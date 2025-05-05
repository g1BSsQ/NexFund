import {
    BlockfrostProvider,
    MeshTxBuilder,
    MeshWallet,
    PlutusScript,
    serializePlutusScript,
    UTxO
    ,resolvePlutusScriptAddress,
    BrowserWallet,
  } from "@meshsdk/core";
  import { applyParamsToScript } from "@meshsdk/core-csl";
  import blueprint from "./plutus.json";
  import { Script } from "node:vm";
  import plutus from '../../smartcontract/plutus.json';
  export const blockchainProvider = new BlockfrostProvider('preprod2DQWsQjqnzLW9swoBQujfKBIFyYILBiL');
  
  export function readValidator(title: string): string {
      const validator = plutus.validators.find(v => v.title === title);
      if (!validator) {
        throw new Error(`${title} validator not found.`);
      }
      return validator.compiledCode;
    }
  export function getTxBuilder() {
    return new MeshTxBuilder({
      fetcher: blockchainProvider,
      submitter: blockchainProvider,
      verbose:true,
    });
  }
   
  // reusable function to get a UTxO by transaction hash
  export async function getUtxoPlutusByTxHash(txHash: string): Promise<UTxO> {
    const utxos = await blockchainProvider.fetchUTxOs(txHash);
    return  
  }
  
  
  export async function getWalletInfoForTx(wallet: BrowserWallet) {
    const utxos = await wallet.getUtxos();
    const walletAddress = (await wallet.getUsedAddresses())[0];
    const collateral = (await wallet.getCollateral())[0];
    return { utxos, walletAddress, collateral };
  }
async function main(){
    console.log("hello world");
    
}
main();