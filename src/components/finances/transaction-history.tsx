"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { formatAddress } from "@/lib/utils";

type Transaction = {
  id: string;
  type: "in" | "out";
  amount: number;
  fee: number;
  date: Date;
  status: "completed";
  description: string;
  address: string;
};

type TransactionHistoryProps = {
  transactions: Transaction[];
  filter: "all" | "in" | "out";
  searchQuery?: string;
};

export function TransactionHistory({ transactions, filter, searchQuery = "" }: TransactionHistoryProps) {
  const filteredTransactions = transactions
    .filter((tx) => filter === "all" || tx.type === filter)
    .filter((tx) =>
      searchQuery
        ? tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.amount.toString().includes(searchQuery.toLowerCase())
        : true
    );

  // Phân trang
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (filteredTransactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Không tìm thấy giao dịch nào</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border glass-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Loại</TableHead>
            <TableHead>Mô tả</TableHead>
            <TableHead>Ngày</TableHead>
            <TableHead>Số lượng</TableHead>
            <TableHead>Phí</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Địa chỉ</TableHead>
            <TableHead className="text-right">Chi tiết</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedTransactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell>
                {tx.type === "in" ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <ArrowDownLeft className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-green-600 font-medium">Vào</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <ArrowUpRight className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="text-red-600 font-medium">Ra</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{tx.description}</TableCell>
              <TableCell>{format(tx.date, "dd MMM yyyy", { locale: vi })}</TableCell>
              <TableCell className={tx.type === "in" ? "text-green-600" : "text-red-600"}>
                {tx.type === "in" ? "+" : "-"}
                {(tx.amount / 1000000).toFixed(3)} ADA
              </TableCell>
              <TableCell>{(tx.fee / 1000000).toFixed(3)} ADA</TableCell>
              <TableCell>
                <Badge variant="default">Hoàn thành</Badge>
              </TableCell>
              <TableCell className="font-mono text-xs">{formatAddress(tx.address, 30, 10)}</TableCell>
              <TableCell className="text-right">
                <a
                  href={`https://explorer.cardano.org/tx/${tx.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      <div className="flex justify-end items-center space-x-4 p-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Trước
        </button>
        <span>
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Sau
        </button>
      </div>
    </div>
  );
}