import axios from 'axios';
import {
    blockchainProvider,
} from './adapter';
import { deserializeDatum, hexToString } from '@meshsdk/core';

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

/**
 * Tries to process a UTXO at a specific index to extract voting data
 */
function tryProcessUtxo(txs, index) {
  if (index >= txs.length) {
    throw new Error(`Not enough UTXOs to try index ${index}`);
  }
  
  const txx = txs[index];
  if (!txx.output.plutusData) {
    throw new Error(`No plutus data in txs[${index}]`);
  }
  
  const datum = deserializeDatum(txx.output.plutusData);
  const sayVote = datum.fields[1].bytes;
  const say = hexToString(sayVote);
  return say;
}

async function main() {
  const addrScript = "addr_test1wqkjgp3egxehpwgh0k0hfp66yypx7qqvsm2535ss5v424ms4chhyv";
  
  // Addresses to filter out (script addresses or any other addresses you want to exclude)
  const filteredAddresses = [
    addrScript,
    "addr_test1wpjqgeeaatmfee304p9e9a3t24pej3ef2xws7lucphscg0gvckan9"
  ];
  
  const txs = await blockchainProvider.fetchAddressTransactions(addrScript);
  const txHashes = txs.map((tx) => tx.hash);
  
  // Map to store the latest vote for each address
  const latestVotes = new Map();

  for(const txHash of txHashes) {
    try {
      console.log("Transaction Hash: ", txHash);
      let tx = await fetchTxUtxos(txHash);
      let address;
      if(tx.inputs[0].address == addrScript) {
        address = tx.inputs[1].address;
      } else {
        address = tx.inputs[0].address;
      }
      
      // Skip filtered addresses
      if (filteredAddresses.includes(address)) {
        console.log(`Skipping filtered address: ${address}`);
        continue;
      }
      
      console.log("Address: ", address);
      
      // Fetch UTXOs for this transaction
      let utxos = await blockchainProvider.fetchUTxOs(txHash);
      
      // Try each index in sequence
      const indicesToTry = [0, 1, 2];
      let success = false;

      for (const index of indicesToTry) {
        try {
          const say = tryProcessUtxo(utxos, index);
          console.log(`Say Vote (from txs[${index}]): ${say}`);
          
          // Store this as the latest vote for this address
          latestVotes.set(address, say.toLowerCase());
          
          success = true;
          break; // Exit the loop if successful
        } catch (error) {
          console.log(`Trying index ${index}: ${error.message}`);
          // Continue to the next index
        }
      }

      if (!success) {
        console.error(`Failed to extract vote data from any index for transaction ${txHash}`);
      }
      
    } catch (error) {
      console.error(`Error processing transaction ${txHash}:`, error);
    }
  }
  
  // Calculate voting statistics
  let yesCount = 0;
  let noCount = 0;
  
  // Count votes from the latest votes map
  for (const [address, vote] of latestVotes.entries()) {
    if (vote.includes('yes')) {
      yesCount++;
    } else if (vote.includes('no')) {
      noCount++;
    }
  }
  
  // Calculate total valid votes and percentages
  const totalValidVotes = yesCount + noCount;
  const yesPercentage = totalValidVotes > 0 ? (yesCount / totalValidVotes * 100).toFixed(2) : '0.00';
  const noPercentage = totalValidVotes > 0 ? (noCount / totalValidVotes * 100).toFixed(2) : '0.00';
  
  // Display voting summary
  console.log("\n=== VOTING SUMMARY ===");
  console.log(`Total unique voters: ${latestVotes.size}`);
  console.log(`YES votes: ${yesCount} (${yesPercentage}%)`);
  console.log(`NO votes: ${noCount} (${noPercentage}%)`);
  
  // Display approval percentage (yes votes as percentage of total votes)
  console.log(`\nProposal approval rate: ${yesPercentage}%`);
  
  // Display each address's final vote
  console.log("\n=== FINAL VOTES BY ADDRESS ===");
  for (const [address, vote] of latestVotes.entries()) {
    const shortAddr = `${address.substring(0, 12)}...${address.substring(address.length - 8)}`;
    console.log(`${shortAddr}: ${vote}`);
  }
}

main();