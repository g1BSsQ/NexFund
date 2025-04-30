//percentVoteCombineContribute.ts
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


   const addrScriptt = "addr_test1wqkjgp3egxehpwgh0k0hfp66yypx7qqvsm2535ss5v424ms4chhyv";
    
    // Addresses to filter out (script addresses or any other addresses you want to exclude)
    const filteredAddresses = [
      addrScript,
      "addr_test1wpjqgeeaatmfee304p9e9a3t24pej3ef2xws7lucphscg0gvckan9"
    ];
    
    const txss = await blockchainProvider.fetchAddressTransactions(addrScriptt);
    const txHashess = txss.map((tx) => tx.hash);
    
    // Map to store the latest vote for each address
    const latestVotes = new Map();
  
    for(const txHashh of txHashess) {
      try {
        console.log("Transaction Hash: ", txHashh);
        let tx = await fetchTxUtxos(txHashh);
        let addresss;
        if(tx.inputs[0].address == addrScript) {
          addresss = tx.inputs[1].address;
        } else {
          addresss = tx.inputs[0].address;
        }
        
        // Skip filtered addresses
        if (filteredAddresses.includes(addresss)) {
          console.log(`Skipping filtered address: ${addresss}`);
          continue;
        }
        
        console.log("Address: ", addresss);
        
        // Fetch UTXOs for this transaction
        let utxos = await blockchainProvider.fetchUTxOs(txHashh);
        
        // Try each index in sequence
        const indicesToTry = [0, 1, 2];
        let success = false;
  
        for (const index of indicesToTry) {
          try {
            const say = tryProcessUtxo(utxos, index);
            console.log(`Say Vote (from txs[${index}]): ${say}`);
            
            // Store this as the latest vote for this address
            latestVotes.set(addresss, say.toLowerCase());
            
            success = true;
            break; // Exit the loop if successful
          } catch (error) {
            console.log(`Trying index ${index}: ${error.message}`);
            // Continue to the next index
          }
        }
  
        if (!success) {
          console.error(`Failed to extract vote data from any index for transaction ${txHashh}`);
        }
        
      } catch (error) {
        console.error(`Error processing transaction ${txHashh}:`, error);
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