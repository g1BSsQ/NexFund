// components/profile/user-funds.tsx

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
  current: number;  // ADA
  total: number;    // ADA
  category: string;
  role: string;
}

interface UserFundsProps {
  funds: Fund[];
}

export function UserFunds({ funds }: UserFundsProps) {
  if (funds.length === 0) {
    return <div className="p-4 text-muted-foreground">Bạn không quản lý quỹ nào.</div>;
  }

  return (
    <div className="space-y-4">
      {funds.map((fund) => (
        <div key={fund.id} className="border rounded-lg p-4 bg-white dark:bg-gray-950">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-lg">{fund.name}</h3>
                <Badge>{fund.role || "Quản trị viên"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{fund.description}</p>
            </div>
            <Link href={`/funds/${fund.id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" /> Chi tiết
              </Button>
            </Link>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Số dư: {fund.current.toFixed(3)} ADA</span>
              <span>Đã quyên góp: {fund.total.toFixed(3)} ADA</span>
            </div>
            <Progress
              value={fund.total === 0 ? 0 : (fund.current / fund.total) * 100}
              className="h-2"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between mt-4 gap-2">
            <Badge variant="secondary">{fund.category}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
