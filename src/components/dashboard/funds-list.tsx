"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eye } from "lucide-react";
import Link from "next/link";

interface Fund {
  id: string;
  name: string;
  description: string;
  current: number;
  total: number;
  category: string;
  members: number;
}

interface FundsListProps {
  funds: Fund[];
}

export function FundsList({ funds }: FundsListProps) {
  // Nếu không có quỹ, hiển thị thông báo
  if (!funds || funds.length === 0) {
    return (
      <div className="text-muted-foreground">
        Bạn chưa tham gia hoặc tạo quỹ nào.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {funds.map((fund) => (
        <div key={fund.id} className="border rounded-lg p-4 bg-white dark:bg-gray-950">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-medium text-lg">{fund.name}</h3>
              <p className="text-sm text-muted-foreground">{fund.description}</p>
            </div>
            <Link href={`/funds/${fund.id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                Chi tiết
              </Button>
            </Link>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Số dư: {fund.current} ADA</span>
              <span>Đã quyên góp: {fund.total} ADA</span>
            </div>
            <Progress value={fund.total === 0 ? 0 : (fund.current / fund.total) * 100} className="h-2" />
          </div>
          
          <div className="flex flex-wrap items-center justify-between mt-4 gap-2">
            <Badge variant="secondary">{fund.category}</Badge>
            <span className="text-xs text-muted-foreground">{fund.members} thành viên tham gia</span>
          </div>
        </div>
      ))}
    </div>
  );
}