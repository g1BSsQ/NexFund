
import {
  deserializeAddress,
  deserializeDatum,
  mConStr0,
  stringToHex,
  BrowserWallet,
} from "@meshsdk/core";
import {
  blockchainProvider,
  getTxBuilder,
  getWalletInfoForTx,
} from "./adapter";
export async function exportMoney(
  txHash: string[],
  wallet: BrowserWallet,
  amount: number,
  scriptAddr: string,
  contributeScriptCbor: string,
  addrReceiver: string,
  admin: string,
) {
  try {
    const { utxos, walletAddress, collateral } = await getWalletInfoForTx(wallet);
    const pubkeyAdmin = deserializeAddress(admin).pubKeyHash;
    const pubkeyContributor = deserializeAddress(walletAddress).pubKeyHash;
    const txBuilder = getTxBuilder();
    let cash = 0;
    for (const tx of txHash) {
      const scriptUtxos = await blockchainProvider.fetchUTxOs(tx);
      let utxo;
      for (let i = 0; i < scriptUtxos.length; i++) {
        if (scriptUtxos[i].output.plutusData  !== undefined) {
          utxo = scriptUtxos[i];
          break;
        }
      }  
      console.log("utxo", utxo);
      if (!utxo) {

        console.error("Not Found", tx);
        continue;
      } 
      const datumFetch = deserializeDatum(utxo.output.plutusData!);
      cash += Number(datumFetch.fields[0].int);
      console.log("cash", cash);
      txBuilder
        .spendingPlutusScriptV3()
        .txIn(
          utxo.input.txHash,
          utxo.input.outputIndex,
          utxo.output.amount,
          scriptAddr
        )
        .txInInlineDatumPresent()
        .txInRedeemerValue(
          mConStr0([stringToHex("ExportMoney")])
          
        )
        .txInScript(contributeScriptCbor);
    }
     const amountReverse = cash - amount;
     txBuilder
     .spendingPlutusScriptV3()
      .txInCollateral(
        collateral.input.txHash,
        collateral.input.outputIndex,
        collateral.output.amount,
        collateral.output.address
      )
      .txOut(
        addrReceiver,
        [{
          unit: "lovelace",
          quantity: amount.toString(),
        }]
      );
      
    if (amountReverse > 12000000) {
      const datum = mConStr0([10000000, pubkeyContributor, pubkeyAdmin]);
      txBuilder
      .spendingPlutusScriptV3()
        .txOut(
          scriptAddr,
          [{
            unit: "lovelace",
            quantity: amountReverse.toString(),
          }]
        )
        .txOutInlineDatumValue(datum);
    }

    txBuilder
      .changeAddress(walletAddress)
      .requiredSignerHash(pubkeyContributor)
      .selectUtxosFrom(utxos)
      .setNetwork("preview")
      .setNetwork("preview")
      .addUtxosFromSelection();

    const txHexBuilder = await txBuilder.complete();
    const signedTx = await wallet.signTx(txHexBuilder, true);
    const txId = await wallet.submitTx(signedTx);
    console.log("Transaction ID: ", txId);
    return txId;
    
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Error in exportMoney function: " + error);
  }
}