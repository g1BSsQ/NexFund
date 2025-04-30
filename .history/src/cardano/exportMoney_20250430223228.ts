import {
    deserializeAddress,
    deserializeDatum,
    mConStr0,
    MeshTxBuilder, 
    applyParamsToScript,
    serializePlutusScript,
    stringToHex,
    BrowserWallet
  } from "@meshsdk/core";
  import {
    blockchainProvider,
    readValidator,
    getWalletInfoForTx,
    wallet,
  } from "./adapter";
async function exportMoney(txHash: string, wallet: BrowserWallet, walletAddr: string, admin: string, name: string, ) {
    const {utxos, walletAddress, collateral} = await getWalletInfoForTx(wallet);
    const pubkeyAdmin = deserializeAddress(walletAddress).pubKeyHash;
    const contributeCompileCode = readValidator("contribute.contribute.spend");
    const constributeScriptCbor = applyParamsToScript(
      contributeCompileCode,
      [pubkeyAdmin],
    );
    const scriptAddr = serializePlutusScript(
      { code: constributeScriptCbor, version: "V3" },
      undefined,
      0
    ).address;
    const datum = mConStr0([30, pubkeyAdmin, pubkeyAdmin ])
    const txBuilder = new MeshTxBuilder({
        fetcher: blockchainProvider,
        submitter: blockchainProvider,
      });
    
        console.log("1");
        const scriptUtxos = await blockchainProvider.fetchUTxOs(txHash);
        console.log(scriptUtxos);
        if (!scriptUtxos || scriptUtxos.length === 0) {
          throw new Error("No UTXOs found for the given transaction hash.");
        }
        console.log("2");
        const scriptUtxo = scriptUtxos[2];
        const datumm = deserializeDatum(scriptUtxo.output.plutusData!);
        console.log("Datum : ", datumm);
        console.log("3");
      await txBuilder
      .spendingPlutusScriptV3()
      .txIn(
          scriptUtxo.input.txHash,
          scriptUtxo.input.outputIndex,
          scriptUtxo.output.amount,
          scriptAddr
      )
      .txInInlineDatumPresent()
      .txInRedeemerValue(mConStr0([stringToHex("ExportMoney")]))
      
      .txInScript(constributeScriptCbor)
      .txOut(
        walletAddr
        , 
        [])
      .txInCollateral(
          collateral.input.txHash,
          collateral.input.outputIndex,
          collateral.output.amount,
          collateral.output.address,
      )
   
    //.spendingPlutusScriptV3()
      //.txOut(
        //scriptAddr,
      //   [{
      //     unit: "lovelace",
      //     quantity: "45000000"
      //   }]
      // )
      // .txOutInlineDatumValue(datum)


      .changeAddress(walletAddress)
      .requiredSignerHash(pubkeyAdmin)
      .selectUtxosFrom(utxos)
      .setNetwork("preprod")
      .addUtxosFromSelection();
      const completedTx = await txBuilder.complete();
      
      const signedTx = await wallet.signTx(completedTx, true);
      const txhash = await wallet.submitTx(signedTx);
      
      return txhash;

    

}
