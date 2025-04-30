import axios from 'axios';
import { blockchainProvider } from './adapter';
import { deserializeDatum } from '@meshsdk/core';

// Blockfrost API configuration
const BLOCKFROST_API_KEY = process.env.BLOCKFROST_API_KEY || ''; // Should be set properly
const BLOCKFROST_BASE_URL = 'https://cardano-preprod.blockfrost.io/api/v0';

// Define return types for better clarity
interface ContributionStats {
  totalAmount: number;
  totalAmountAda: number;
  uniqueContributors: number;
  totalContributions: number;
  contributionsByAddress: Array<[string, number, number]>; // [address, lovelace, ada]
  addressAmountPairs: Array<[string, number]>;
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
 * Counts votes from a script address
 * @param addrScript Script address to count votes from
 * @returns Statistics about contributions
 */
export async function countVote(addrScript: string): Promise<ContributionStats> {
  // Remove hardcoded value and use parameter instead
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
      // Silent fail or re-throw based on requirements
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
  
  // Format the results for return
  const formattedContributionsByAddress: Array<[string, number, number]> = 
    Array.from(contributionsByAddress.entries())
      .map(([address, amount]) => [
        address, 
        amount// filepath: e:\DanoFund\src\cardano\countVote.ts
import axios from 'axios';
import { blockchainProvider } from './adapter';
import { deserializeDatum } from '@meshsdk/core';

// Blockfrost API configuration
const BLOCKFROST_API_KEY = process.env.BLOCKFROST_API_KEY || ''; // Should be set properly
const BLOCKFROST_BASE_URL = 'https://cardano-preprod.blockfrost.io/api/v0';

// Define return types for better clarity
interface ContributionStats {
  totalAmount: number;
  totalAmountAda: number;
  uniqueContributors: number;
  totalContributions: number;
  contributionsByAddress: Array<[string, number, number]>; // [address, lovelace, ada]
  addressAmountPairs: Array<[string, number]>;
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
 * Counts votes from a script address
 * @param addrScript Script address to count votes from
 * @returns Statistics about contributions
 */
export async function countVote(addrScript: string): Promise<ContributionStats> {
  // Remove hardcoded value and use parameter instead
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
      // Silent fail or re-throw based on requirements
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
  
  // Format the results for return
  const formattedContributionsByAddress: Array<[string, number, number]> = 
    Array.from(contributionsByAddress.entries())
      .map(([address, amount]) => [
        address, 
        amount