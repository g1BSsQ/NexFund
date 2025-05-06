"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eye } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getFundBalance, getTotalDonations } from "@/lib/utils";
import { ENDPOINTS } from "@/lib/config";

interface Fund {
  id: string;
  name: string;
  description: string;
  current: number;
  total: number;
  category: string;
  members: number;
  status: "active" | "completed" | "draft";
}

interface FundsListProps {
  showFilters?: boolean;
  searchQuery?: string;
}

export function FundsList({ showFilters = false, searchQuery = "" }: FundsListProps) {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchFunds = async () => {
      try {
        setLoading(true);
        const response = await fetch(ENDPOINTS.GET_PUBLIC_FUNDS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ search: searchQuery }),
        });
        const data = await response.json();
        if (data.error) {
          setError(data.error);
          setFunds([]);
          setLoading(false);
          return;
        }

        // Lấy thêm thông tin balance và donation từ blockchain cho mỗi quỹ
        const enrichedFunds = await Promise.all(
          data.map(async (fund: Fund) => {
            try {
              // Kiểm tra xác định fund.address tồn tại
              if (!fund.id) {
                console.warn(`Fund ${fund.id} doesn't have an address`);
                return { ...fund, current: 0, total: 0 };
              }

              // Lấy dữ liệu từ blockchain
              const [balance, totalDonations] = await Promise.all([
                getFundBalance(fund.id),
                getTotalDonations(fund.id)
              ]);

              return { 
                ...fund, 
                current: balance,
                total: totalDonations
              };
            } catch (err) {
              return fund; // Giữ nguyên nếu có lỗi
            }
          })
        );

        setFunds(enrichedFunds);
        setError(null);
      } catch (error) {
        setError("Không thể tải danh sách quỹ. Vui lòng thử lại sau.");
        setFunds([]);
        console.error("Lỗi khi lấy danh sách quỹ:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFunds();
  }, [searchQuery]);

  const filteredFunds = funds.filter((fund) => {
    if (statusFilter !== "all" && fund.status !== statusFilter) return false;
    if (categoryFilter !== "all" && fund.category !== categoryFilter) return false;
    return true;
  });

  if (loading) {
    return <div className="p-4 text-center">Đang tải dữ liệu quỹ...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

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
                <SelectItem value="Thử nghiệm">Thử Nghiệm</SelectItem>
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
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "completed" | "draft" }) {
  if (status === "active") {
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800">
        Đang hoạt động
      </Badge>
    );
  }
}