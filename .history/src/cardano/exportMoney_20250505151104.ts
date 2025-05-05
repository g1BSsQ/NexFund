  import {
    deserializeAddress,
    mConStr0,
    stringToHex,
    BrowserWallet,
    deserializeDatum
  } from "@meshsdk/core";
  import {
    blockchainProvider,
    readValidator,
    getWalletInfoForTx,
    getTxBuilder,
  } from "./adapter";
  export async function exportMoney(
    txHash: string[],
    wallet: BrowserWallet, 
    amount: number,
    scriptAddr: string,
    constributeScriptCbor: string,
    ){
    const {utxos, walletAddress, collateral} = await getWalletInfoForTx(wallet);
    const pubkeyContributor = deserializeAddress(walletAddress).pubKeyHash;
    const pubkeyAdmin = deserializeAddress(walletAddress).pubKeyHash;
    const datum = mConStr0([amount, pubkeyContributor, pubkeyAdmin])
    const txBuilder = getTxBuilder();
    let amountSelect = 0;
    for(const tx of txHash){
      const scriptUtxo =  (await blockchainProvider.fetchUTxOs(tx))[0];
      const datumfetch = deserializeDatum(scriptUtxo.output.plutusData!);
      const amountfetch = datumfetch.fi
      if (!scriptUtxo.output.plutusData) throw new Error('Plutus data not found');
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

export default exportMoney;
