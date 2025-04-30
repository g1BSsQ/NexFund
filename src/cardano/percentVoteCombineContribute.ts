import axios from 'axios';
import { blockchainProvider } from './adapter';
import { deserializeDatum, hexToString } from '@meshsdk/core';

// Define return types for better structure
interface ContributionStats {
  totalAmount: number;
  totalAmountAda: number;
  uniqueContributors: number;
  totalContributions: number;
  contributionsByAddress: Array<{
    address: string;
    shortAddress: string;
    amount: number;
    amountAda: number;
  }>;
  addressAmountPairs: Array<[string, number]>;
}

interface VoteStats {
  totalUniqueVoters: number;
  yesCount: number;
  noCount: number;
  yesPercentage: string;
  noPercentage: string;
  approvalRate: string;
  votesByAddress: Array<{
    address: string;
    shortAddress: string;
    vote: string;
  }>;
}

interface CombinedStats {
  contributions: ContributionStats;
  votes: VoteStats;
}

// Blockfrost API configuration
const BLOCKFROST_API_KEY = process.env.BLOCKFROST_API_KEY || '';
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
 * Gets combined contribution and vote statistics
 * @param contributionAddr The script address for contributions
 * @param voteAddr The script address for votes
 * @param filteredAddresses Addresses to exclude from vote counting
 * @returns Combined statistics object
 */
export async function getCombinedStats(
  contributionAddr: string = "addr_test1wpjqgeeaatmfee304p9e9a3t24pej3ef2xws7lucphscg0gvckan9",
  voteAddr: string = "addr_test1wqkjgp3egxehpwgh0k0hfp66yypx7qqvsm2535ss5v424ms4chhyv",
  filteredAddresses: string[] = []
): Promise<CombinedStats> {
  // 1. Get contribution statistics
  const contributionStats = await getContributionStats(contributionAddr);
  
  // 2. Get voting statistics
  const voteStats = await getVoteStats(voteAddr, [contributionAddr, ...filteredAddresses]);
  
  // 3. Return combined statistics
  return {
    contributions: contributionStats,
    votes: voteStats
  };
}

/**
 * Gets contribution statistics for a script address
 * @param addrScript The script address to analyze
 * @returns Contribution statistics
 */
export async function getContributionStats(
  addrScript: string = "addr_test1wpjqgeeaatmfee304p9e9a3t24pej3ef2xws7lucphscg0gvckan9"
): Promise<ContributionStats> {
  const txs = await blockchainProvider.fetchAddressTransactions(addrScript);
  const txHashes = txs.map((tx) => tx.hash);
  let addressAmountPairs: [string, number][] = []; 
  
  for (const txHash of txHashes) {
    try {
      const tx = await fetchTxUtxos(txHash);
      if (tx && tx.inputs && tx.inputs.length > 0) {
        const address = tx.inputs[0].address;
        const txs = await blockchainProvider.fetchUTxOs(txHash);
        const txx = txs[0];
        const datum = deserializeDatum(txx.output.plutusData!);
        const lovelaceAmount = datum.fields[0].int;
        
        addressAmountPairs.push([address, lovelaceAmount]);
      }
    } catch (error) {
      throw new Error(`Error processing transaction ${txHash}: ${error}`);
    }
  }
  
  // Calculate statistics
  const totalAmount = addressAmountPairs.reduce((sum, pair) => sum + pair[1], 0);
  const uniqueContributors = new Set(addressAmountPairs.map(pair => pair[0]));
  const contributorCount = uniqueContributors.size;
  const contributionCount = addressAmountPairs.length;
  
  // Group contributions by address and sum amounts
  const contributionsByAddress = new Map<string, number>();
  addressAmountPairs.forEach(pair => {
    const [address, amount] = pair;
    const currentTotal = contributionsByAddress.get(address) || 0;
    contributionsByAddress.set(address, currentTotal + amount);
  });
  
  // Format for return
  const formattedContributions = Array.from(contributionsByAddress.entries()).map(
    ([address, amount]) => ({
      address,
      shortAddress: `${address.substring(0, 10)}...${address.substring(address.length - 6)}`,
      amount,
      amountAda: amount / 1000000
    })
  );
  
  return {
    totalAmount,
    totalAmountAda: totalAmount / 1000000,
    uniqueContributors: contributorCount,
    totalContributions: contributionCount,
    contributionsByAddress: formattedContributions,
    addressAmountPairs
  };
}

/**
 * Gets voting statistics for a script address
 * @param addrScript The script address to analyze
 * @param filteredAddresses Addresses to exclude from vote counting
 * @returns Voting statistics
 */
export async function getVoteStats(
  addrScript: string = "addr_test1wqkjgp3egxehpwgh0k0hfp66yypx7qqvsm2535ss5v424ms4chhyv",
  filteredAddresses: string[] = []
): Promise<VoteStats> {
  // Ensure script address is added to filtered addresses
  if (!filteredAddresses.includes(addrScript)) {
    filteredAddresses = [addrScript, ...filteredAddresses];
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
  const votesByAddress = Array.from(latestVotes.entries()).map(([address, vote]) => ({
    address,
    shortAddress: `${address.substring(0, 12)}...${address.substring(address.length - 8)}`,
    vote
  }));
  
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