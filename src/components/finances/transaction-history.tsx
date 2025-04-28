"use client"

import { BadgePlus, BadgeMinus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Transaction {
  id: string;
  type: "in" | "out";
  amount: number;
  token: string;
  address: string;
  date: string;
  description: string;
  txHash: string;
}

const transactions: Transaction[] = [
  {
    id: "tx-001",
    type: "in",
    amount: 35,
    token: "ADA",
    address: "0x8731d54E9D02c286767d56ac03e8037C07e01e98",
    date: "2025-03-20T14:32:26Z",
    description: "Đóng góp cho quỹ phát triển cộng đồng",
    txHash: "0xabcd1234..."
  },
  {
    id: "tx-002",
    type: "in",
    amount: 20000,
    token: "USDT",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    date: "2025-03-19T09:15:10Z",
    description: "Đóng góp cho quỹ đổi mới sáng tạo",
    txHash: "0xefgh5678..."
  },
  {
    id: "tx-003",
    type: "out",
    amount: 15,
    token: "ADA",
    address: "0x1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P7q8R9s0T",
    date: "2025-03-17T16:45:33Z",
    description: "Tài trợ cho dự án phát triển ứng dụng di động",
    txHash: "0xijkl9012..."
  },
  {
    id: "tx-004",
    type: "in",
    amount: 50,
    token: "ADA",
    address: "0xa1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0",
    date: "2025-03-15T10:22:15Z",
    description: "Đóng góp cho quỹ phát triển cộng đồng",
    txHash: "0xmnop3456..."
  },
  {
    id: "tx-005",
    type: "out",
    amount: 5000,
    token: "USDT",
    address: "0x1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P7q8R9s0T",
    date: "2025-03-12T13:55:42Z",
    description: "Tài trợ cho hội thảo trực tuyến về blockchain",
    txHash: "0xqrst7890..."
  },
  {
    id: "tx-006",
    type: "in",
    amount: 100,
    token: "ADA",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    date: "2025-03-10T11:23:45Z",
    description: "Đóng góp cho quỹ đổi mới sáng tạo",
    txHash: "0xuvwx1234..."
  },
  {
    id: "tx-007",
    type: "out",
    amount: 750,
    token: "COMP",
    address: "0x8731d54E9D02c286767d56ac03e8037C07e01e98",
    date: "2025-03-08T14:36:22Z",
    description: "Tài trợ cho dự án AI kết hợp blockchain",
    txHash: "0xyzab5678..."
  }
];

interface TransactionHistoryProps {
  filter?: "all" | "in" | "out";
}

export function TransactionHistory({ filter = "all" }: TransactionHistoryProps) {
  const filteredTransactions = transactions.filter(transaction => {
    if (filter === "all") return true;
    return transaction.type === filter;
  });

  if (filteredTransactions.length === 0) {
    return <div className="text-center py-10">Không có giao dịch nào.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium text-sm">Loại</th>
            <th className="text-left py-3 px-4 font-medium text-sm">Mô tả</th>
            <th className="text-left py-3 px-4 font-medium text-sm">Địa chỉ</th>
            <th className="text-right py-3 px-4 font-medium text-sm">Số lượng</th>
            <th className="text-right py-3 px-4 font-medium text-sm">Ngày</th>
            <th className="text-center py-3 px-4 font-medium text-sm">Chi tiết</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.map((transaction) => (
            <tr key={transaction.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900">
              <td className="py-3 px-4">
                <div className={
                  transaction.type === "in" 
                    ? "w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center"
                    : "w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center"
                }>
                  {transaction.type === "in" ? (
                    <BadgePlus className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <BadgeMinus className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                <p className="font-medium">{transaction.description}</p>
                <p className="text-xs text-muted-foreground">{transaction.txHash}</p>
              </td>
              <td className="py-3 px-4 text-sm">
                {transaction.address.slice(0, 6)}...{transaction.address.slice(-4)}
              </td>
              <td className={
                "py-3 px-4 text-right font-medium " + 
                (transaction.type === "in" 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400")
              }>
                {transaction.type === "in" ? "+" : "-"}{transaction.amount} {transaction.token}
              </td>
              <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                {new Date(transaction.date).toLocaleDateString('vi-VN')}
              </td>
              <td className="py-3 px-4 text-center">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">Xem chi tiết</span>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}