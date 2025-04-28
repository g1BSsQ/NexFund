"use client"

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eye } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Fund {
  id: string;
  name: string;
  description: string;
  raised: number;
  goal: number;
  category: string;
  members: number;
  status: 'active' | 'completed' | 'draft';
}

const fundsData: Fund[] = [
  {
    id: "community-development",
    name: "Quỹ phát triển cộng đồng",
    description: "Tài trợ các dự án phát triển cộng đồng và giáo dục blockchain.",
    raised: 850,
    goal: 1000,
    category: "Cộng đồng",
    members: 187,
    status: 'active'
  },
  {
    id: "innovation",
    name: "Quỹ đổi mới sáng tạo",
    description: "Hỗ trợ các dự án khởi nghiệp và đổi mới công nghệ blockchain.",
    raised: 1250,
    goal: 2000,
    category: "Đổi mới",
    members: 235,
    status: 'active'
  },
  {
    id: "education",
    name: "Quỹ giáo dục blockchain",
    description: "Cung cấp nguồn lực giáo dục và đào tạo về blockchain và công nghệ phi tập trung.",
    raised: 500,
    goal: 800,
    category: "Giáo dục",
    members: 125,
    status: 'active'
  },
  {
    id: "research",
    name: "Quỹ nghiên cứu và phát triển",
    description: "Tài trợ cho nghiên cứu về công nghệ mới trong không gian blockchain.",
    raised: 1800,
    goal: 1800,
    category: "Nghiên cứu",
    members: 93,
    status: 'completed'
  }
];

interface FundsListProps {
  showFilters?: boolean;
}

export function FundsList({ showFilters = false }: FundsListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredFunds = fundsData.filter(fund => {
    if (statusFilter !== "all" && fund.status !== statusFilter) return false;
    if (categoryFilter !== "all" && fund.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Trạng thái:</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="completed">Đã hoàn thành</SelectItem>
                <SelectItem value="draft">Bản nháp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Danh mục:</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="Cộng đồng">Cộng đồng</SelectItem>
                <SelectItem value="Đổi mới">Đổi mới</SelectItem>
                <SelectItem value="Giáo dục">Giáo dục</SelectItem>
                <SelectItem value="Nghiên cứu">Nghiên cứu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredFunds.map((fund) => (
          <div key={fund.id} className="border rounded-lg p-4 bg-white dark:bg-gray-950 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-lg">{fund.name}</h3>
                  <StatusBadge status={fund.status} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">{fund.description}</p>
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
                <span>Đã quyên góp: {fund.raised} ADA</span>
                <span>Mục tiêu: {fund.goal} ADA</span>
              </div>
              <Progress value={(fund.raised / fund.goal) * 100} className="h-2" />
            </div>
            
            <div className="flex flex-wrap items-center justify-between mt-4 gap-2">
              <Badge variant="secondary">{fund.category}</Badge>
              <span className="text-xs text-muted-foreground">{fund.members} thành viên tham gia</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'active' | 'completed' | 'draft' }) {
  if (status === 'active') {
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800">
        Đang hoạt động
      </Badge>
    );
  } else if (status === 'completed') {
    return (
      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800">
        Đã hoàn thành
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
        Bản nháp
      </Badge>
    );
  }
}