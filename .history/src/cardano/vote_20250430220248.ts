import {
    applyParamsToScript,
    Asset,
    deserializeAddress,
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
  
  async function contribute(admin: string, assets: any, amount: number, vote: string) {
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
      console.log("Script Address : ", scriptAddr);
  
      const txBuilder = new MeshTxBuilder({
          fetcher: blockchainProvider,
          submitter: blockchainProvider,
        });
      const datum = mConStr0([pubkeyVoter, vote] );
      
      await txBuilder
      .spendingPlutusScriptV3()
      .txOut(scriptAddr, assets)
      .txOutInlineDatumValue(datum)
   //   .txInInlineDatumPresent()
     // .txInRedeemerValue(mConStr0([stringToHex("Contribute")]))
      .changeAddress(walletAddress)
      .requiredSignerHash(pubkeyVoter)
      .selectUtxosFrom(utxos)
      .setNetwork("preprod")
      
  
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
      const vote = "yes";
    const amount = 3;
    const txHash = await contribute(admin, assets, amount, vote);
    console.log("Transaction Hash: ", txHash);
  }
  main();
  function requiredSignerHash(pubkeyContributor: string) {
    throw new Error("Function not implemented.");
  }
  
  