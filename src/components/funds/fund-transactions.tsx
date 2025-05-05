"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft, ExternalLink } from "lucide-react";
import { formatAddress } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "in" | "out";
  amount: number;
  fee: number;
  date: string;
  status: "completed" | "pending" | "failed";
  description: string;
  address: string;
}

export function FundTransactions({ transactions }: { transactions: Transaction[] }) {
  if (!transactions.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Chưa có giao dịch nào cho quỹ này</p>
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
          {transactions.map((tx) => (
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
              <TableCell>{new Date(tx.date).toLocaleDateString("vi-VN")}</TableCell>
              <TableCell className={tx.type === "in" ? "text-green-600" : "text-red-600"}>
                {tx.type === "in" ? "+" : "-"}
                {tx.amount.toFixed(1)} ADA
              </TableCell>
              <TableCell>{tx.fee.toFixed(1)} ADA</TableCell>
              <TableCell>
                <Badge
                  variant={tx.status === "completed" ? "default" : tx.status === "pending" ? "outline" : "destructive"}
                >
                  {tx.status === "completed" ? "Hoàn thành" : tx.status === "pending" ? "Đang xử lý" : "Thất bại"}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs">{formatAddress(tx.address,12,3)}</TableCell>
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
    </div>
  );
}