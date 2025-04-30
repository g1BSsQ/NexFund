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
    wallet,
  } from "./adapter";
  
  async function contribute(txHash: string, admin: string, assets: any, amount: number, vote: string) {
    try {
      const { utxos, walletAddress, collateral } = await getWalletInfoForTx(
        wallet,
      );
  
      const pubkeyVoter = deserializeAddress(walletAddress).pubKeyHash;
      const pubkeyAdmin = deserializeAddress(admin).pubKeyHash;
  
      const contributeCompileCode = readValidator("vote.vote.spend");
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
  async function main() {
    const admin =
      "addr_test1qqwkave5e46pelgysvg6mx0st5zhte7gn79srscs8wv2qp5qkfvca3f7kpx3v3rssm4j97f63v5whrj8yvsx6dac9xrqyqqef6";
      const assets: Asset[] = [
        {
          unit: "lovelace",
          quantity: "1100000",
        }
      ];
      const txHash = "4d795aa9f5e3fcda087b3e144691f01bf6a2fc15ae0fb9f4ae1aff05cc1538e1";
      const vote = "no";
    const amount = 3;
    const TxHash = await contribute(txHash, admin, assets, amount, vote);
    console.log("Transaction Hash: ", TxHash);
  }
  main();
  function requiredSignerHash(pubkeyContributor: string) {
    throw new Error("Function not implemented.");
  }
  
  