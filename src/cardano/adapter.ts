import {
    BlockfrostProvider,
    BrowserWallet,
    IWallet,
    MeshTxBuilder,
    UTxO
  } from "@meshsdk/core";
<<<<<<< HEAD

=======
  import { applyParamsToScript } from "@meshsdk/core-csl";
>>>>>>> 89d88d498753b057df368ff4458573e442205541
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
  export async function getUtxoPlutusByTxHash(txHash: string){
    const utxos = await blockchainProvider.fetchUTxOs(txHash);
    return  utxos[0];
  }
  
  
  export async function getWalletInfoForTx(wallet: BrowserWallet) {
    const collateral = (await wallet.getCollateral())[0];
    const walletAddress = (await wallet.getUsedAddresses())[0];
    const utxos = await blockchainProvider.fetchAddressUTxOs(walletAddress);

    return { utxos, walletAddress, collateral };
  }
