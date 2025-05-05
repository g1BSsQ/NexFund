import axios from "axios";

type Utxo = {
  tx_hash: string;
  output_index: number;
  amount: { unit: string; quantity: string }[];
};

const API_URL = 'https://cardano-preview.blockfrost.io/api/v0';
const PROJECT_ID = 'previewxOC094xKrrjbuvWPhJ8bkiSoABW4jpDc';

export async function fetchUtxos(address: string): Promise<Utxo[]> {
  const res = await axios.get(`${API_URL}/addresses/${address}/utxos`, {
    headers: { Project_id: PROJECT_ID },
  });
  return res.data as Utxo[];
}

export function selectBestUtxoTxHashes(utxos: Utxo[], amountAda: number): string[] {
    const utxoList = utxos
      .map(u => {
        const lovelace = u.amount.find(a => a.unit === "lovelace");
        return lovelace
          ? { ...u, ada: Number(lovelace.quantity) / 1_000_000 }
          : null;
      })
      .filter(Boolean) as (Utxo & { ada: number })[];
  
    if (utxoList.length === 0) return [];
  
    if (utxoList.length === 1) {
      return utxoList[0].ada >= amountAda ? [utxoList[0].tx_hash] : [];
    }
  
    let bestSingle: Utxo & { ada: number } | null = null;
    for (const u of utxoList) {
      if (u.ada >= amountAda) {
        if (!bestSingle || u.ada < bestSingle.ada) bestSingle = u;
      }
    }
  
    let bestPair: [Utxo & { ada: number }, Utxo & { ada: number }] | null = null;
    let minOver = Infinity;
    for (let i = 0; i < utxoList.length; i++) {
      for (let j = i + 1; j < utxoList.length; j++) {
        const sum = utxoList[i].ada + utxoList[j].ada;
        if (sum >= amountAda && sum - amountAda < minOver) {
          minOver = sum - amountAda;
          bestPair = [utxoList[i], utxoList[j]];
        }
      }
    }
  
    if (bestSingle) return [bestSingle.tx_hash];
    if (bestPair) return [bestPair[0].tx_hash, bestPair[1].tx_hash];
    return [];
  }