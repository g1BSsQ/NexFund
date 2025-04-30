import {
    applyParamsToScript,
    Asset,
    deserializeAddress,
    mConStr0,
    MeshTxBuilder,
    serializePlutusScript,
    stringToHex,
    BrowserWallet
  } from "@meshsdk/core";
  
  import {
    blockchainProvider,
    getWalletInfoForTx,
    readValidator,
    get
  } from "./adapter";
  
  async function contribute(admin: string, assets: any, amount: number) {
    try {
      const { utxos, walletAddress} = await getWalletInfoForTx(
        wallet
      );
      const pubkeyContributor = deserializeAddress(walletAddress).pubKeyHash;
      const pubkeyAdmin = deserializeAddress(admin).pubKeyHash;
      const contributeCompileCode = readValidator("contribute.contribute.spend");
      const constributeScriptCbor = applyParamsToScript(
        contributeCompileCode,
        [pubkeyAdmin, stringToHex(name)],
      );
      const scriptAddr = serializePlutusScript(
        { code: constributeScriptCbor, version: "V3" },
        undefined,
        0,
      ).address;
      const txBuilder = new MeshTxBuilder({
          fetcher: blockchainProvider,
          submitter: blockchainProvider,
        });
      const datum = mConStr0([ amount, pubkeyContributor, pubkeyAdmin] );
      
      await txBuilder
      .spendingPlutusScriptV3()
      .txOut(scriptAddr, assets)
      .txOutInlineDatumValue(datum)
   //   .txInInlineDatumPresent()
     // .txInRedeemerValue(mConStr0([stringToHex("Contribute")]))
      .changeAddress(walletAddress)
      .requiredSignerHash(pubkeyContributor)
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
          quantity: "30000000",
        }
      ];
    const amount = 30;
    const txHash = await contribute(admin, assets, amount);
    console.log("Transaction Hash: ", txHash);
  }
  main();
  function requiredSignerHash(pubkeyContributor: string) {
    throw new Error("Function not implemented.");
  }
  
  