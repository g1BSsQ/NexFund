import axios from 'axios';
import { blockchainProvider } from './adapter';
import { deserializeDatum, hexToString } from '@meshsdk/core';

// Blockfrost API configuration
const BLOCKFROST_API_KEY = blockchainProvider;
const BLOCKFROST_BASE_URL = 'https://cardano-preprod.blockfrost.io/api/v0';

// Define the return type for better clarity
interface VoteSummary {
  totalUniqueVoters: number;
  yesCount: number;
  noCount: number;
  yesPercentage: string;
  noPercentage: string;
  approvalRate: string;
  votesByAddress: Array<{address: string, shortAddress: string, vote: string}>;
}

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
      throw new Error(`Blockfrost API Error: ${error.response?.data || error.message}`);
    } else {
      throw new Error(`Error fetching UTXOs: ${error}`);
    }
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

/**
 * Calculates voting results for a given script address
 * @param addrScript - Script address to calculate votes for
 * @param filteredAddresses - Optional array of addresses to filter out
 * @returns Voting summary data
 */
export async function calculateVote(
  addrScript: string = "addr_test1wqkjgp3egxehpwgh0k0hfp66yypx7qqvsm2535ss5v424ms4chhyv",
  filteredAddresses: string[] = []
): Promise<VoteSummary> {
  
  // Ensure script address is added to filtered addresses
  if (!filteredAddresses.includes(addrScript)) {
    filteredAddresses = [
      addrScript,
      "addr_test1wpjqgeeaatmfee304p9e9a3t24pej3ef2xws7lucphscg0gvckan9",
      ...filteredAddresses
    ];
  }
  
  const txs = await blockchainProvider.fetchAddressTransactions(addrScript);
  const txHashes = txs.map((tx) => tx.hash);
  
  // Map to store the latest vote for each address
  const latestVotes = new Map();

  for(const txHash of txHashes) {
    try {
      let tx = await fetchTxUtxos(txHash);
      let address;
      if(tx.inputs[0].address == addrScript) {
        address = tx.inputs[1].address;
      } else {
        address = tx.inputs[0].address;
      }
      
      // Skip filtered addresses
      if (filteredAddresses.includes(address)) {
        continue;
      }
      
      // Fetch UTXOs for this transaction
      let utxos = await blockchainProvider.fetchUTxOs(txHash);
      
      // Try each index in sequence
      const indicesToTry = [0, 1, 2];
      
      for (const index of indicesToTry) {
        try {
          const say = tryProcessUtxo(utxos, index);
          
          // Store this as the latest vote for this address
          latestVotes.set(address, say.toLowerCase());
          break; // Exit the loop if successful
        } catch (error) {
          // Continue to the next index
        }
      }
    } catch (error) {
      // Skip transactions that can't be processed
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
  
  // Format votes by address for return
  const votesByAddress = Array.from(latestVotes.entries()).map(([address, vote]) => {
    const shortAddress = `${address.substring(0, 12)}...${address.substring(address.length - 8)}`;
    return { 
      address,
      shortAddress,
      vote
    };
  });
  
  // Return the vote summary
  return {
    totalUniqueVoters: latestVotes.size,
    yesCount,
    noCount,
    yesPercentage,
    noPercentage,
    approvalRate: yesPercentage,
    votesByAddress
  };
}