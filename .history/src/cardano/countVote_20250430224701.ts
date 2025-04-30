import axios from 'axios';
import {
    blockchainProvider,
} from './adapter';
import { deserializeDatum } from '@meshsdk/core';

// Blockfrost API configuration
const BLOCKFROST_API_KEY = 'preprod2DQWsQjqnzLW9swoBQujfKBIFyYILBiL';
const BLOCKFROST_BASE_URL = 'https://cardano-preprod.blockfrost.io/api/v0';

/**
 * Fetches transaction UTXOs from Blockfrost API
 * @param txHash Transaction hash
 * @returns UTXOs associated with the transaction
 */
export async function fetchTxUtxos(txHash: string) {
  try {
    const response = await axios.get(`${BLOCKFROST_BASE_URL}/txs/${txHash}/utxos`, {
      headers: {
        'project_id': BLOCKFROST_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Blockfrost API Error:', error.response?.data || error.message);
    } else {
      console.error('Error fetching UTXOs:', error);
    }
    throw error;
  }
}

async function main() {
  const addrScript = "addr_test1wpjqgeeaatmfee304p9e9a3t24pej3ef2xws7lucphscg0gvckan9";
  const txs = await blockchainProvider.fetchAddressTransactions(addrScript);

  console.log("UTxos: ", txs);

  const txHashes = txs.map((tx) => tx.hash);
  console.log("Transaction Hashes: ", txHashes);

  let addressAmountPairs: [string, number][] = []; 
  
  for (const txHash of txHashes) {
    try {
      const tx = await fetchTxUtxos(txHash);
     // console.log("Transaction: ", tx);
      if (tx && tx.inputs && tx.inputs.length > 0) {
        const address = tx.inputs[0].address;
        const txs = await blockchainProvider.fetchUTxOs(txHash);
        const txx = txs[0];
        const datum = deserializeDatum(txx.output.plutusData!);
        const lovelaceAmount = datum.fields[0].int;
        
        
        addressAmountPairs.push([address, lovelaceAmount]);
      }
    } catch (error) {
      console.error(`Error processing transaction ${txHash}:`, error);
    }
  }

  console.log("Address-Amount Pairs:");
  addressAmountPairs.forEach((pair, index) => {
    console.log(`${index + 1}. [${pair[0]}, ${pair[1]}]`);
  });
  
  // Calculate statistics
  // 1. Total amount contributed
  const totalAmount = addressAmountPairs.reduce((sum, pair) => sum + pair[1], 0);
  
  // 2. Number of unique contributors (unique addresses)
  const uniqueContributors = new Set(addressAmountPairs.map(pair => pair[0]));
  const contributorCount = uniqueContributors.size;
  
  // 3. Total number of contributions
  const contributionCount = addressAmountPairs.length;
  
  // Group contributions by address and sum amounts
  const contributionsByAddress = new Map<string, number>();
  addressAmountPairs.forEach(pair => {
    const [address, amount] = pair;
    const currentTotal = contributionsByAddress.get(address) || 0;
    contributionsByAddress.set(address, currentTotal + amount);
  });
  
  // Display statistics
  console.log("\n--- Contribution Statistics ---");
  console.log(`Total Amount: ${totalAmount} lovelace (${totalAmount / 1000000} ADA)`);
  console.log(`Unique Contributors: ${contributorCount}`);
  console.log(`Total Contributions: ${contributionCount}`);
  
  // Display contributions by address
  console.log("\n--- Contributions By Address ---");
  let index = 1;
  for (const [address, amount] of contributionsByAddress.entries()) {
    // Create a short address version for readability
    const shortAddress = address.substring(0, 10) + "..." + address.substring(address.length - 6);
    console.log(`${index}. ${shortAddress}: ${amount} lovelace (${amount / 1000000} ADA)`);
    index++;
  }
  
  // Format as a JSON string for easier copying
  console.log("\nJSON formatted pairs:");
  console.log(JSON.stringify(addressAmountPairs, null, 2));
  
  // Format contributions by address as JSON
  console.log("\nJSON formatted contributions by address:");
  console.log(JSON.stringify(Array.from(contributionsByAddress.entries()), null, 2));
}

main();