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
    BrowserWallet
  } from "@meshsdk/core";
  
  import {
    blockchainProvider,
    getWalletInfoForTx,
    readValidator,
    getTxBuilder,
    getUtxoPlutusByTxHash
  } from "./adapter";
  
  async function contribute(wallet: BrowserWallet, txHash: string, admin: string, assets: Asset[], name: string, vote: string, id) {
    try {
      const { utxos, walletAddress, collateral } = await getWalletInfoForTx(
        wallet,
      );
      const pubkeyVoter = deserializeAddress(walletAddress).pubKeyHash;
      const pubkeyAdmin = deserializeAddress(admin).pubKeyHash;
  
      const voteCompileCode = readValidator("vote.vote.spend");
      const voteScriptCbor = applyParamsToScript(
        voteCompileCode,
        [pubkeyAdmin, name],
      );
  
      const scriptAddr = serializePlutusScript(
        { code: constributeScriptCbor, version: "V3" },
        undefined,
        0,
      ).address;
      const utxo = await getUtxoPlutusByTxHash(txHash);
      const txBuilder =getTxBuilder();
      const newDatum = mConStr0([pubkeyVoter, vote] );

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
        .txInScript(voteScriptCbor)
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
 