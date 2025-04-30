import {
    deserializeAddress,
    deserializeDatum,
    mConStr0,
    MeshTxBuilder, 
    applyParamsToScript,
    serializePlutusScript,
    stringToHex,
  } from "@meshsdk/core";
  import {
    blockchainProvider,
    readValidator,
    getWalletInfoForTx,
    wallet,
  } from "./adapter";
async function exportMoney(txHash: string){
    const walletAddr = "addr_test1qqwkave5e46pelgysvg6mx0st5zhte7gn79srscs8wv2qp5qkfvca3f7kpx3v3rssm4j97f63v5whrj8yvsx6dac9xrqyqqef6";
    const {utxos, walletAddress, collateral} = await getWalletInfoForTx(wallet);
    const pubkeyAdmin = deserializeAddress(walletAddress).pubKeyHash;
    
   
   // const datum = deserializeDatum(scriptUtxo.output.plutusData!);
   //  console.log("Datum : ", datum);
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
async function main(){
  const tx1 = "4633f7dbace5663fdc184812f20fd2933da6faca973ddc4f54e948def297f34d";
 // const tx2 = "d39d9068ea4916eb9051e5de0d202e74dcb76a2b3d4f57beb5ca0a100f073811";
  const tx3 = "58f9d29442165f4281a67beb3b231670e8463a504061d5860d1673b8a9ef346c";
 
  const lovelacesend = "45000000"

    const txHash = await exportMoney(tx1);
    console.log("Transaction Hash : ", txHash);

    


}
main();
