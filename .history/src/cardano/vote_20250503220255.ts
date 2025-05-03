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
    BrowserWallet
  } from "@meshsdk/core";
  
  import {
    blockchainProvider,
    getWalletInfoForTx,
    readValidator,
    getTxBuilder
  } from "./adapter";


  async function vote(wallet: BrowserWallet, admin: string, name: string, vote: string, assets: Asset[], id:  number, amount: number, timeStamp: number) {
    try {
      const { utxos, walletAddress, collateral } = await getWalletInfoForTx(
        wallet
      );
      const pubkeyVoter = deserializeAddress(walletAddress).pubKeyHash;
      const pubkeyAdmin = deserializeAddress(admin).pubKeyHash;
  
      const voteCompileCode = readValidator("vote.vote.spend");
      const voteScriptCbor = applyParamsToScript(
        voteCompileCode,
        [id, pubkeyAdmin, stringname, amount, timeStamp],
      );
  
      const scriptAddr = serializePlutusScript(
        { code: voteScriptCbor, version: "V3" },
        undefined,
        0,
      ).address;
      console.log("Script Address : ", scriptAddr);
  
      const txBuilder = getTxBuilder();
      const datum = mConStr0([pubkeyVoter, vote] );
      
      await txBuilder
      .spendingPlutusScriptV3()
      .txOut(scriptAddr, assets)
      .txOutInlineDatumValue(datum)
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