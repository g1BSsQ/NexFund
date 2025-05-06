import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import axios from "axios";
import { BLOCKFROST_API_URL, BLOCKFROST_PROJECT_ID } from './config';

export interface Transaction {
  id: string;
  type: "in" | "out";
  amount: number;      // ADA
  fee: number;         // ADA
  date: string;        // YYYY-MM-DD
  status: "completed" | "pending" | "failed";
  description: string; // "Đóng góp" | "Giải ngân" | "Giao dịch nội bộ"
  address: string;     // địa chỉ phía đối tác hoặc quỹ nếu nội bộ
}

export async function getTransactionDetails(fundAddress: string): Promise<Transaction[]> {
  try {
    const txListOptions = {
      method: "GET",
      url: `${BLOCKFROST_API_URL}/addresses/${fundAddress}/txs`,
      headers: { Project_id: BLOCKFROST_PROJECT_ID },
      params: { count: 100, page: 1, order: "desc" },
    };
    const { data: txHashes } = await axios.request<string[]>(txListOptions);

    const transactions = await Promise.all(
      txHashes.map(async (txHash) => {
        try {
          const [txDetailRes, txUtxoRes] = await Promise.all([
            axios.get(`${BLOCKFROST_API_URL}/txs/${txHash}`, {
              headers: { Project_id: BLOCKFROST_PROJECT_ID },
            }),
            axios.get(`${BLOCKFROST_API_URL}/txs/${txHash}/utxos`, {
              headers: { Project_id: BLOCKFROST_PROJECT_ID },
            }),
          ]);

          const fee = Number(txDetailRes.data.fees) || 0;
          const utxos = txUtxoRes.data;
          // Tính tổng Lovelace in/out cho quỹ
          const totalOutput = utxos.outputs
            .filter((o: any) => o.address === fundAddress)
            .reduce((s: number, o: any) => {
              const lov = o.amount.find((a: any) => a.unit === "lovelace");
              return s + (lov ? +lov.quantity : 0);
            }, 0);
          const totalInput = utxos.inputs
            .filter((i: any) => i.address === fundAddress && !i.collateral)
            .reduce((s: number, i: any) => {
              const lov = i.amount.find((a: any) => a.unit === "lovelace");
              return s + (lov ? +lov.quantity : 0);
            }, 0);

          const delta = totalInput - totalOutput;
          const type = delta > 0 ? "out" : "in";
          const amountADA = Math.abs(delta) / 1_000_000;

          // Lấy đối tác
          let counter = "";
          if (type === "out") {
            const outs = utxos.outputs.filter((o: any) => o.address !== fundAddress);
            counter = outs[0]?.address || "Giao dịch nội bộ";
          } else {
            const ins = utxos.inputs.filter((i: any) => i.address !== fundAddress && !i.collateral);
            counter = ins[0]?.address || "Giao dịch nội bộ";
          }

          return {
            id: txHash,
            type,
            amount: amountADA,
            fee: fee / 1_000_000,
            status: "completed",
            description:
              counter === "Giao dịch nội bộ"
                ? counter
                : type === "in"
                ? "Đóng góp"
                : "Giải ngân",
            address: counter === "Giao dịch nội bộ" ? fundAddress : counter,
          } as Transaction;
        } catch {
          // silent failure: drop this tx
          return null;
        }
      })
    );

    return transactions.filter((t): t is Transaction => t !== null);
  } catch {
    // silent failure: return empty list
    return [];
  }
}

export async function getFundBalance(fundAddress: string): Promise<number> {
  try {
    const res = await axios.get(`${BLOCKFROST_API_URL}/addresses/${fundAddress}`, {
      headers: { Project_id: BLOCKFROST_PROJECT_ID },
    });
    const lov = res.data.amount.find((a: any) => a.unit === "lovelace");
    return lov ? Number(lov.quantity) / 1_000_000 : 0;
  } catch {
    return 0;
  }
}

// Hàm mới: Tính tổng quyên góp
export async function getTotalDonations(fundAddress: string): Promise<number> {
  const transactions = await getTransactionDetails(fundAddress);
  return transactions
    .filter(tx => tx.type === "in" && tx.description === "Đóng góp")
    .reduce((sum, tx) => sum + tx.amount, 0);
}

// Hàm mới: Lấy tổng quyên góp, tổng chi tiêu và số dư cùng một lúc
export async function getTransactionsWithTotal(fundAddress: string): Promise<{
  transactions: Transaction[];
  totalDonations: number;
  totalSpent: number;
  balance: number;
}> {
  const transactions = await getTransactionDetails(fundAddress);

  const totalDonations = transactions
    .filter(tx => tx.type === "in" && tx.description === "Đóng góp")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalSpent = transactions
    .filter(tx => tx.type === "out" && tx.description === "Giải ngân")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const balance = totalDonations - totalSpent;

  return { transactions, totalDonations, totalSpent, balance };
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string, prefixLength: number = 14, suffixLength: number = 3) {
  return address.length > prefixLength + suffixLength
    ? `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`
    : address;
}