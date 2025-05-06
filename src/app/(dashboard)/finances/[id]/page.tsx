"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, ArrowUpDown, Plus } from "lucide-react";
import { TransactionHistory } from "@/components/finances/transaction-history";
import { FinancialOverview } from "@/components/finances/financial-overview";
import { useWallet } from "@meshsdk/react";
import { useEffect, useState } from "react";
import axios from "axios";
import { BLOCKFROST_API_URL, BLOCKFROST_PROJECT_ID, BLOCKFROST_PROJECT_ID, COINGECKO_API_URL } from "@/lib/config";


interface Transaction {
  id: string;
  type: "in" | "out";
  amount: number;
  fee: number;
  date: Date;
  status: "completed";
  description: string;
  address: string;
}

interface TransactionAggregates {
  totalFees: number;
  totalTxIn: number;
  totalTxOut: number;
  transactions: Transaction[];
}

interface PriceData {
  [key: string]: number;
}

async function getTransactionAggregates(walletAddress: string): Promise<TransactionAggregates> {
  const txListOptions = {
    method: "GET",
    url: `${BLOCKFROST_API_URL}/addresses/${walletAddress}/txs`, 
    headers: { Project_id: BLOCKFROST_PROJECT_ID },
    params: {
      count: 100,
      page: 1,
      order: "desc",
    },
  };

  try {
    const { data: txHashes } = await axios.request<string[]>(txListOptions);

    const aggregatesArray = await Promise.all(
      txHashes.map(async (txHash: string) => {
        const txDetailOptions = {
          method: "GET",
          url: `${BLOCKFROST_API_URL}/txs/${txHash}`,
          headers: { Project_id: BLOCKFROST_PROJECT_ID },
        };
        const txUtxoOptions = {
          method: "GET",
          url: `${BLOCKFROST_API_URL}/txs/${txHash}/utxos`,
          headers: { Project_id: BLOCKFROST_PROJECT_ID },
        };

        try {
          const [txDetailRes, txUtxoRes] = await Promise.all([
            axios.request(txDetailOptions),
            axios.request(txUtxoOptions),
          ]);

          const fee = Number(txDetailRes.data.fees) || 0;
          const utxos = txUtxoRes.data;

          const totalOutputLovelace = utxos.outputs
            .filter((utxo: any) => utxo.address === walletAddress)
            .reduce((sum: number, utxo: any) => {
              const lovelace = utxo.amount.find((amt: any) => amt.unit === "lovelace");
              return sum + (lovelace ? Number(lovelace.quantity) : 0);
            }, 0);

          const totalInputLovelace = utxos.inputs
            .filter((utxo: any) => utxo.address === walletAddress && !utxo.collateral)
            .reduce((sum: number, utxo: any) => {
              const lovelace = utxo.amount.find((amt: any) => amt.unit === "lovelace");
              return sum + (lovelace ? Number(lovelace.quantity) : 0);
            }, 0);

          const amount = totalInputLovelace - totalOutputLovelace;

          let type: "in" | "out" = amount > 0 ? "out" : "in";

          let txIn = 0;
          let txOut = 0;
          if (type === "in") {
            txIn = Math.abs(amount);
            txOut = 0;
          } else {
            txOut = Math.abs(amount);
            txIn = 0;
          }

          let counterPartyAddress = "";
          if (type === "out") {
            const outputAddresses = utxos.outputs
              .filter((utxo: any) => utxo.address !== walletAddress)
              .map((utxo: any) => utxo.address);
            counterPartyAddress = outputAddresses.length > 0 ? outputAddresses[0] : "Giao dịch nội bộ";
          } else {
            const senderAddresses = utxos.inputs
              .filter((utxo: any) => utxo.address !== walletAddress && !utxo.collateral)
              .map((utxo: any) => utxo.address);
            counterPartyAddress = senderAddresses.length > 0 ? senderAddresses[0] : "Giao dịch nội bộ";
          }

          const blockOptions = {
            method: "GET",
            url: `${BLOCKFROST_API_URL}/blocks/${txDetailRes.data.block}`,
            headers: { Project_id: BLOCKFROST_PROJECT_ID },
          };
          const blockRes = await axios.request(blockOptions);
          const txDate = new Date(blockRes.data.time * 1000);

          return {
            fee,
            txIn,
            txOut,
            transaction: {
              id: txHash,
              type,
              amount: Math.abs(amount),
              fee,
              date: txDate,
              status: "completed",
              description: counterPartyAddress === "Giao dịch nội bộ" ? counterPartyAddress : (type === "in" ? "Giao dịch nhận vào" : "Giao dịch gửi ra"),
              address: counterPartyAddress === "Giao dịch nội bộ" ? walletAddress : counterPartyAddress,
            },
          };
        } catch (error) {
          console.error(`Lỗi khi xử lý giao dịch ${tx.tx_hash}:`, error);
          return {
            fee: 0,
            txIn: 0,
            txOut: 0,
            transaction: null,
          };
        }
      })
    );

    const totalFees = aggregatesArray.reduce((acc, agg) => acc + agg.fee, 0);
    const totalTxIn = aggregatesArray.reduce((acc, agg) => acc + agg.txIn, 0);
    const totalTxOut = aggregatesArray.reduce((acc, agg) => acc + agg.txOut, 0);
    const validTransactions = aggregatesArray
      .filter((agg) => agg.transaction !== null)
      .map((agg) => agg.transaction as Transaction);

    return { totalFees, totalTxIn, totalTxOut, transactions: validTransactions };
  } catch (error) {
    console.error("Lỗi khi truy vấn danh sách giao dịch:", error);
    throw error;
  }
}

async function fetchPriceData(balanceADA: number): Promise<PriceData> {
  try {
    const response = await axios.get(COINGECKO_API_URL, {
      params: {
        ids: 'cardano',
        vs_currencies: 'eth,btc,usd,vnd',
      },
    });
    const prices = response.data.cardano;
    const adaToEth = prices.eth;
    const adaToBtc = prices.btc;
    const adaToUsd = prices.usd;
    const adaToVnd = prices.vnd;

    return {
      ETH: (balanceADA * adaToEth).toFixed(6),
      BTC: (balanceADA * adaToBtc).toFixed(8),
      USD: (balanceADA * adaToUsd).toFixed(2),
      VND: (balanceADA * adaToVnd).toFixed(0),
    };
  } catch (error) {
    console.error("Lỗi khi lấy tỷ giá:", error);
    return { ETH: "0", BTC: "0", USD: "0", VND: "0" };
  }
}

export default function FinancesPage() {
  const { wallet, address } = useWallet();
  const [balance, setBalance] = useState(0);
  const [totalFees, setTotalFees] = useState(0);
  const [totalIn, setTotalIn] = useState(0);
  const [totalOut, setTotalOut] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [convertedValues, setConvertedValues] = useState<PriceData>({ ETH: "0", BTC: "0", USD: "0", VND: "0" });

  useEffect(() => {
    async function fetchFinances() {
      if (wallet) {
        try {
          const balance = Number((await wallet.getBalance())[0].quantity);
          const aggregates = await getTransactionAggregates(address);

          setBalance(balance);
          setTotalFees(aggregates.totalFees);
          setTotalIn(aggregates.totalTxIn);
          setTotalOut(aggregates.totalTxOut);
          setTransactions(aggregates.transactions);

          // Lấy tỷ giá và quy đổi
          const balanceADA = balance / 1000000; // Chuyển từ Lovelace sang ADA
          const prices = await fetchPriceData(balanceADA);
          setConvertedValues(prices);
        } catch (error) {
          console.error("Không thể lấy dữ liệu tài chính:", error);
        }
      }
    }
    fetchFinances();
  }, [wallet]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Tài chính</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng tài sản</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(balance / 1000000).toFixed(3)} ADA</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giao dịch ra</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalOut / 1000000).toFixed(3)} ADA</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giao dịch vào</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalIn / 1000000).toFixed(3)} ADA</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phí giao dịch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalFees / 1000000).toFixed(3)} ADA</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Tổng quan tài chính</CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialOverview balance={balance} transactions={transactions} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader className="space-y-0">
            <CardTitle>Tài sản quy đổi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>CARDANO</span>
                  </div>
                  <span className="font-medium">{(balance / 1000000).toFixed(3)} ADA</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>ETHERIUM</span>
                  </div>
                  <span className="font-medium">{convertedValues.ETH} ETH</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span>BITCOIN</span>
                  </div>
                  <span className="font-medium">{convertedValues.BTC} BTC</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span>USD</span>
                  </div>
                  <span className="font-medium">{convertedValues.USD}$</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>VND</span>
                  </div>
                  <span className="font-medium">{convertedValues.VND} VND</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử giao dịch</CardTitle>
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm giao dịch..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Sắp xếp
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="in">Giao dịch vào</TabsTrigger>
              <TabsTrigger value="out">Giao dịch ra</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <TransactionHistory transactions={transactions} filter="all" searchQuery={searchQuery} />
            </TabsContent>
            <TabsContent value="in" className="mt-4">
              <TransactionHistory transactions={transactions} filter="in" searchQuery={searchQuery} />
            </TabsContent>
            <TabsContent value="out" className="mt-4">
              <TransactionHistory transactions={transactions} filter="out" searchQuery={searchQuery} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}