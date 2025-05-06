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
import { getTransactionDetails, getFundBalance } from "@/lib/utils";
import { ENDPOINTS } from "@/lib/config";

// Định nghĩa interface cho fund từ API
interface FundFromApi {
  id: string;
  name: string;
  description: string;
  category: string;
  role: string;
  members?: number;
  status?: string;
}

// Định nghĩa interface cho fund đã bổ sung dữ liệu blockchain
interface EnrichedFund extends FundFromApi {
  current: number;
  total: number;
}

// Interface cho dữ liệu stats từ API
interface DashboardStats {
  total_funds: number;
  fund_count: number;
  pending_proposals: number;
  total_members: number;
  budget_allocation: any[];
  funds_list: FundFromApi[];
  popular_proposals: any[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { wallet, address } = useWallet();
  const [stats, setStats] = useState<DashboardStats>({
    total_funds: 0,
    fund_count: 0,
    pending_proposals: 0,
    total_members: 0,
    budget_allocation: [],
    funds_list: [],
    popular_proposals: []
  });
  const [enrichedFunds, setEnrichedFunds] = useState<EnrichedFund[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);


  // Gọi API khi có address
  useEffect(() => {
    if (!address) return; // Không gọi API nếu chưa có address
    setIsLoading(true);

    const fetchStats = async () => {
      try {
        const response = await fetch(ENDPOINTS.GET_DASHBOARD_STATS, {
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [address]);

  // Tính toán lại current và total từ blockchain khi có danh sách quỹ
  useEffect(() => {
    if (!stats.funds_list.length) return;

    const enrichFundsWithBlockchainData = async () => {
      console.log("Bắt đầu tính toán dữ liệu blockchain cho", stats.funds_list.length, "quỹ");
      
      try {
        const enriched = await Promise.all(
          stats.funds_list.map(async (fund) => {
            // Sử dụng ID của quỹ làm địa chỉ blockchain
            const fundAddress = fund.id;
            console.log(`Lấy dữ liệu blockchain cho quỹ ${fund.name} (${fundAddress})`);
            
            try {
              // Lấy giao dịch và số dư từ blockchain
              const [txs, balance] = await Promise.all([
                getTransactionDetails(fundAddress),
                getFundBalance(fundAddress),
              ]);
              
              // Tính tổng đóng góp từ các giao dịch vào
              const totalDonated = txs
                .filter(tx => tx.type === "in" && tx.description === "Đóng góp")
                .reduce((sum, tx) => sum + tx.amount, 0);
              
              console.log(`Quỹ ${fund.name}: current=${balance}, total=${totalDonated}`);
              
              // Trả về fund với dữ liệu đã bổ sung
              return {
                ...fund,
                current: balance,
                total: totalDonated
              } as EnrichedFund;
            } catch (err) {
              console.error(`Lỗi khi lấy dữ liệu blockchain cho quỹ ${fund.name}:`, err);
              // Nếu có lỗi, trả về giá trị mặc định
              return {
                ...fund,
                current: 0,
                total: 0
              } as EnrichedFund;
            }
          })
        );
        
        console.log("Đã hoàn thành tính toán blockchain cho", enriched.length, "quỹ");
        
        // Cập nhật lại tổng quỹ quản lý từ dữ liệu blockchain
        const newTotalFunds = enriched.reduce((sum, fund) => sum + fund.current, 0);
        setStats(prev => ({
          ...prev,
          total_funds: newTotalFunds
        }));
        
        setEnrichedFunds(enriched);
      } catch (error) {
        console.error("Lỗi khi tính toán dữ liệu blockchain:", error);
      }
    };

    enrichFundsWithBlockchainData();
  }, [stats.funds_list]);

  // Hiển thị thông báo nếu chưa kết nối ví
  if (!wallet || !address) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-4">Tổng quan</h1>
        <p className="text-red-500">Vui lòng kết nối ví Cardano để xem dữ liệu của bạn.</p>
      </div>
    );
  }

  // Hiển thị loader khi đang tải
  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-4">Tổng quan</h1>
        <p>Đang tải dữ liệu...</p>
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
            {/* Sử dụng enrichedFunds thay vì stats.funds_list */}
            <FundsList funds={enrichedFunds.length > 0 ? enrichedFunds : stats.funds_list} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}