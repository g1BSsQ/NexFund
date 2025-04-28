"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpRight, Calendar, Users, VoteIcon } from "lucide-react";
import { FundProposals } from "@/components/funds/fund-proposals";
import { FundTransactions } from "@/components/funds/fund-transactions";
import { FundMembers } from "@/components/funds/fund-members";
import { useParams } from "next/navigation";

interface Fund {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  raised: number;
  goal: number;
  category: string;
  members: number;
  proposals: number;
  transactions: number;
  startDate: string;
  creator: {
    address: string;
    name: string;
  };
}

const fundsData: Record<string, Fund> = {
  "community-development": {
    id: "community-development",
    name: "Quỹ phát triển cộng đồng",
    description: "Tài trợ các dự án phát triển cộng đồng và giáo dục blockchain.",
    longDescription: "Quỹ phát triển cộng đồng tập trung vào việc xây dựng và phát triển các dự án cộng đồng liên quan đến blockchain. Quỹ này nhằm tạo ra một hệ sinh thái mạnh mẽ cho các nhà phát triển, người dùng và các bên liên quan thông qua các sáng kiến giáo dục, sự kiện cộng đồng và tài liệu hướng dẫn.",
    raised: 850,
    goal: 1000,
    category: "Cộng đồng",
    members: 187,
    proposals: 24,
    transactions: 152,
    startDate: "2025-01-15",
    creator: {
      address: "0x8731d54E9D02c286767d56ac03e8037C07e01e98",
      name: "Nguyễn Văn A"
    }
  },
  "innovation": {
    id: "innovation",
    name: "Quỹ đổi mới sáng tạo",
    description: "Hỗ trợ các dự án khởi nghiệp và đổi mới công nghệ blockchain.",
    longDescription: "Quỹ đổi mới sáng tạo cung cấp nguồn vốn và hỗ trợ cho các dự án khởi nghiệp và các sáng kiến mới trong lĩnh vực blockchain. Quỹ tập trung vào việc thúc đẩy các giải pháp đột phá, công nghệ mới và các ứng dụng tiên tiến nhằm mở rộng khả năng áp dụng của blockchain vào các lĩnh vực khác nhau.",
    raised: 1250,
    goal: 2000,
    category: "Đổi mới",
    members: 235,
    proposals: 32,
    transactions: 187,
    startDate: "2025-02-10",
    creator: {
      address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      name: "Trần Thị B"
    }
  }
};

export default function FundPage() {
  const params = useParams();
  const fundId = params.id as string;
  const fund = fundsData[fundId];

  if (!fund) {
    return <div className="p-6">Không tìm thấy quỹ</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {fund.name}
            <Badge variant="secondary">{fund.category}</Badge>
          </h1>
          <p className="text-muted-foreground">{fund.description}</p>
        </div>
        <Button className="gap-2">
          <VoteIcon className="h-4 w-4" />
          Bỏ phiếu
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tổng quan</CardTitle>
              <CardDescription>Chi tiết về quỹ và tiến độ hiện tại</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-6">
                    {fund.longDescription}
                  </p>
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Bắt đầu: {new Date(fund.startDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{fund.members} thành viên tham gia</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Đã quyên góp: {fund.raised} ADA</span>
                    <span>Mục tiêu: {fund.goal} ADA</span>
                  </div>
                  <Progress value={(fund.raised / fund.goal) * 100} className="h-2" />
                  <p className="text-xs text-right text-muted-foreground">
                    {Math.round((fund.raised / fund.goal) * 100)}% đạt được
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src="/avatar.png" />
                      <AvatarFallback>{fund.creator.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{fund.creator.name}</p>
                      <p className="text-xs text-muted-foreground">{fund.creator.address.slice(0, 6)}...{fund.creator.address.slice(-4)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="proposals">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="proposals">Đề xuất ({fund.proposals})</TabsTrigger>
              <TabsTrigger value="transactions">Giao dịch ({fund.transactions})</TabsTrigger>
              <TabsTrigger value="members">Thành viên ({fund.members})</TabsTrigger>
            </TabsList>
            <TabsContent value="proposals">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Đề xuất</span>
                    <Button variant="outline" size="sm" className="gap-1">
                      Tạo đề xuất
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FundProposals fundId={fundId} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>Giao dịch</CardTitle>
                </CardHeader>
                <CardContent>
                  <FundTransactions fundId={fundId} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="members">
              <Card>
                <CardHeader>
                  <CardTitle>Thành viên</CardTitle>
                </CardHeader>
                <CardContent>
                  <FundMembers fundId={fundId} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thống kê</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Tổng số đề xuất:</dt>
                  <dd className="text-sm font-medium">{fund.proposals}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Tổng giao dịch:</dt>
                  <dd className="text-sm font-medium">{fund.transactions}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Đề xuất đã duyệt:</dt>
                  <dd className="text-sm font-medium">{Math.floor(fund.proposals * 0.65)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Thành viên tích cực:</dt>
                  <dd className="text-sm font-medium">{Math.floor(fund.members * 0.75)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Thời gian hoạt động:</dt>
                  <dd className="text-sm font-medium">135 ngày</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danh mục tài sản</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">ADA</span>
                  </div>
                  <span className="text-sm font-medium">65%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">USDT</span>
                  </div>
                  <span className="text-sm font-medium">25%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm">COMP</span>
                  </div>
                  <span className="text-sm font-medium">10%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}