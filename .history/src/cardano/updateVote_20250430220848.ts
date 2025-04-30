import {
    applyParamsToScript,
    Asset,
    deserializeAddress,
    deserializeDatum,
    mConStr0,
    MeshTxBuilder,
    MeshValue,
    serializePlutusScript,
    stringToHex,
    Transaction,
  } from "@meshsdk/core";
  
  import {
    blockchainProvider,
    getWalletInfoForTx,
    readValidator,
    getTxBuilder
  } from "./adapter";
  
  async function contribute(txHash: string, admin: string, assets: Asset[], name: string, vote: string) {
    try {
      const { utxos, walletAddress, collateral } = await getWalletInfoForTx(
        wallet,
      );
      const pubkeyVoter = deserializeAddress(walletAddress).pubKeyHash;
      const pubkeyAdmin = deserializeAddress(admin).pubKeyHash;
  
      const voteCompileCode = readValidator("vote.vote.spend");
      const constributeScriptCbor = applyParamsToScript(
        contributeCompileCode,
        [pubkeyAdmin],
      );
  
      const scriptAddr = serializePlutusScript(
        { code: constributeScriptCbor, version: "V3" },
        undefined,
        0,
      ).address;
     // console.log("Script Address : ", scriptAddr);
      const scriptUtxos = await blockchainProvider.fetchUTxOs(txHash);
      const utxo = scriptUtxos[0];
      const datumm = deserializeDatum(utxo.output.plutusData!);
      console.log("Datum : ", datumm);
      const txBuilder = new MeshTxBuilder({
          fetcher: blockchainProvider,
          submitter: blockchainProvider,
        });
      const newDatum = mConStr0([pubkeyVoter, vote] );
      //unlock 

      await txBuilder
        .spendingPlutusScriptV3()
        .txIn(
            utxo.input.txHash,
            utxo.input.outputIndex,
            utxo.output.amount,
            scriptAddr
        )
        .txInInlineDatumPresent()
        .txInRedeemerValue(mConStr0([stringToHex("update")]))
        .txInScript(constributeScriptCbor)
        .txOut(walletAddress, [])
        .txInCollateral(
            collateral.input.txHash!,
            collateral.input.outputIndex!,
            collateral.output.amount!,
            collateral.output.address!,
        )
        .requiredSignerHash(pubkeyVoter)
        .txOut(scriptAddr, assets)
        .txOutInlineDatumValue(newDatum)
        .changeAddress(walletAddress)
        .selectUtxosFrom(utxos)
        .setNetwork("preprod")
        .complete();

      
  
      const tx =  await txBuilder.complete();
      const signedTx = await wallet.signTx(tx, true);
      const TxHash = await wallet.submitTx(signedTx);
      
      return TxHash;
    } catch(error) {
      throw new Error("Error in contribute function: " + error);
    }
  }
 