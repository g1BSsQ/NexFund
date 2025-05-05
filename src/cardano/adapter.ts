import {
    BlockfrostProvider,
    BrowserWallet,
    IWallet,
    MeshTxBuilder,
    UTxO
  } from "@meshsdk/core";

  import plutus from '../../smartcontract/plutus.json';
  export const blockchainProvider = new BlockfrostProvider('previewxOC094xKrrjbuvWPhJ8bkiSoABW4jpDc');
  
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
    const utxo = utxos.find((utxo: UTxO) => utxo.output.plutusData !== undefined);
    if (!utxo) throw new Error("No UTXOs found in getUtxoPlutusByTxHash method.");
    return utxo;
  }
  
  
  export async function getWalletInfoForTx(wallet: BrowserWallet) {
    const collateral = (await wallet.getCollateral())[0];
    const walletAddress = (await wallet.getUsedAddresses())[0];
    const utxos = await blockchainProvider.fetchAddressUTxOs(walletAddress);

    return { utxos, walletAddress, collateral };
  }
