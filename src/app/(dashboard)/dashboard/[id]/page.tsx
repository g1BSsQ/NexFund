"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@meshsdk/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  PieChart, 
  FileText, 
  TrendingUp,
  Plus,
  ArrowUpRight
} from "lucide-react";
import { FundsList } from "@/components/dashboard/funds-list";
import { PopularProposals } from "@/components/dashboard/popular-proposals";
import { BudgetAllocation } from "@/components/dashboard/budget-allocation";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const { wallet } = useWallet(); // Lấy wallet từ useWallet
  const [address, setAddress] = useState('');
  const [stats, setStats] = useState({
    total_funds: 0,
    fund_count: 0,
    pending_proposals: 0,
    total_members: 0,
    budget_allocation: [],
    funds_list: [],
    popular_proposals: []
  });

  // Lấy address từ ví Cardano
  useEffect(() => {
    async function fetchAddress() {
      if (wallet) {
        try {
          const addr = await wallet.getChangeAddress();
          setAddress(addr);
        } catch (error) {
          console.error("Không thể lấy địa chỉ ví:", error);
        }
      }
    }
    fetchAddress();
  }, [wallet]);

  // Gọi API khi có address
  useEffect(() => {
    if (!address) return; // Không gọi API nếu chưa có address

    const fetchStats = async () => {
      try {
        const response = await fetch("http://localhost/danofund/api/get_dashboard_stats.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_address: address }),
        });
        const data = await response.json();
        if (data.error) {
          console.error(data.error);
          return;
        }
        setStats(data);
      } catch (error) {
        console.error("Không thể lấy dữ liệu dashboard:", error);
      }
    };

    fetchStats();
  }, [address]);

  // Hiển thị thông báo nếu chưa kết nối ví
  if (!wallet || !address) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-4">Tổng quan</h1>
        <p className="text-red-500">Vui lòng kết nối ví Cardano để xem dữ liệu của bạn.</p>
        {/* Có thể thêm nút để yêu cầu kết nối ví nếu cần */}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Tổng quan
        </h1>
        <Button className="gap-2" onClick={() => router.push("/funds/create")}>
          <Plus className="h-4 w-4" />
          Tạo quỹ mới
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng quỹ quản lý
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_funds} ADA</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Số lượng quỹ
            </CardTitle>
            <BarChart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.fund_count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Đề xuất đang chờ
            </CardTitle>
            <FileText className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_proposals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng số thành viên
            </CardTitle>
            <PieChart className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_members}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Phân bổ ngân sách</span>
              <Button variant="ghost" size="sm" className="gap-1">
                Xem tất cả
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetAllocation data={stats.budget_allocation} />
          </CardContent>
        </Card>
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Đề xuất nổi bật</span>
              <Button variant="ghost" size="sm" className="gap-1">
                Xem tất cả
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PopularProposals proposals={stats.popular_proposals} />
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Danh sách quỹ của tôi</span>
              <Link href="/funds">
                <Button variant="ghost" size="sm" className="gap-1">
                  Xem tất cả
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FundsList funds={stats.funds_list} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}