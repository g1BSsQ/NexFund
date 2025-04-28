import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, ArrowUpDown, Plus } from "lucide-react";
import { TransactionHistory } from "@/components/finances/transaction-history";
import { FinancialOverview } from "@/components/finances/financial-overview";

export default function FinancesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Tài chính
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Xuất báo cáo
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Giao dịch mới
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng tài sản
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,456 ADA</div>
            <p className="text-xs text-muted-foreground">
              +15.2% so với tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Giao dịch ra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-324 ADA</div>
            <p className="text-xs text-muted-foreground">
              +8.1% so với tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Giao dịch vào
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+567 ADA</div>
            <p className="text-xs text-muted-foreground">
              +22.5% so với tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Phí giao dịch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.4 ADA</div>
            <p className="text-xs text-muted-foreground">
              -3.2% so với tháng trước
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Tổng quan tài chính</CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialOverview />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader className="space-y-0">
            <CardTitle>Tài sản</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>ADA</span>
                  </div>
                  <span className="font-medium">1,850 ADA</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>USDT</span>
                  </div>
                  <span className="font-medium">350,000 USDT</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span>COMP</span>
                  </div>
                  <span className="font-medium">2,500 COMP</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span>AAVE</span>
                  </div>
                  <span className="font-medium">1,200 AAVE</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>UNI</span>
                  </div>
                  <span className="font-medium">3,800 UNI</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử giao dịch</CardTitle>
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm kiếm giao dịch..." className="pl-8" />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Sắp xếp
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="in">Giao dịch vào</TabsTrigger>
              <TabsTrigger value="out">Giao dịch ra</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <TransactionHistory filter="all" />
            </TabsContent>
            <TabsContent value="in" className="mt-4">
              <TransactionHistory filter="in" />
            </TabsContent>
            <TabsContent value="out" className="mt-4">
              <TransactionHistory filter="out" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}