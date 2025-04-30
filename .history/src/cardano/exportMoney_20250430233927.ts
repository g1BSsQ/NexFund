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
    getTxBuilder,
    getUtxoPlutusByTxHash
  } from "./adapter";
async function exportMoney(
    txHash: string[],
    wallet: BrowserWallet,
    walletAddr: string,
    admin: string,
    name: string, 
    minimum: number, 
    amount: number,
    receiver: string,
    amountReceiver: number,
    amountSelect: number,
    contributeSelection: number,
    other: number,
    ){
    const {utxos, walletAddress, collateral} = await getWalletInfoForTx(wallet);
    const pubkeyContributor = deserializeAddress(walletAddress).pubKeyHash;
    const pubkeyAdmin = deserializeAddress(walletAddress).pubKeyHash;
    const contributeCompileCode = readValidator("contribute.contribute.spend");
    const constributeScriptCbor = applyParamsToScript(
      contributeCompileCode,
      [pubkeyAdmin, name, minimum, contributeSelection],
    );
    const scriptAddr = serializePlutusScript(
      { code: constributeScriptCbor, version: "V3" },
      undefined,
      0
    ).address;
    const datum = mConStr0([amount, pubkeyContributor, pubkeyAdmin])
    const txBuilder = getTxBuilder();

    for(const tx of txHash){
    const scriptUtxo = getUtxoPlutusByTxHash(txHash);
    const datumm = deserializeDatum(scriptUtxo.output.plutusData!); 
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
        walletAddress
        , 
        [])
      .txInCollateral(
          collateral.input.txHash,
          collateral.input.outputIndex,
          collateral.output.amount,
          collateral.output.address,
      )
    }
    const amountRefund = amountSelect - amountReceiver;
    await txBuilder
    .spendingPlutusScriptV3()
      .txOut(
        scriptAddr,
        [{
          unit: "lovelace",
          quantity: amountRefund.toString(),
        }]
      )
      .txOutInlineDatumValue(datum)
      .changeAddress(walletAddress)
      .requiredSignerHash(pubkeyContributor)
      .selectUtxosFrom(utxos)
      .setNetwork("preprod")
      .addUtxosFromSelection();
      const completedTx = await txBuilder.complete();     
      const signedTx = await wallet.signTx(completedTx, true);
      const txhash = await wallet.submitTx(signedTx);
      
      return txhash;
}
