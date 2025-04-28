"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserActivity } from "@/components/profile/user-activity";
import { UserFunds } from "@/components/profile/user-funds";
import { UserProposals } from "@/components/profile/user-proposals";
import { UserVotes } from "@/components/profile/user-votes";
import { Settings, Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { useWallet } from "@meshsdk/react";
import { formatAddress } from "@/lib/utils";

export default function ProfilePage() {
  const { wallet } = useWallet();
  const [address, setAddress] = useState('');

  useEffect(() => {
    async function fetchAddress() {
      if (wallet) {
        const addr = await wallet.getChangeAddress();
        setAddress(addr);
      }
    }
    fetchAddress();
  }, [wallet]);
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Hồ sơ
        </h1>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Cài đặt
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/avatar.png" />
                <AvatarFallback className="text-2xl">NN</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-xl font-bold">Người Dùng</h2>
                <p className="text-sm text-muted-foreground">{formatAddress(address)}</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                Chỉnh sửa hồ sơ
              </Button>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Vai trò</p>
                <p className="text-sm">Quản trị viên, Thành viên</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Ngày tham gia</p>
                <p className="text-sm">15/01/2025</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Quỹ quản lý</p>
                <p className="text-sm">2</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Đề xuất đã tạo</p>
                <p className="text-sm">8</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Số phiếu bầu</p>
                <p className="text-sm">35</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tổng quan hoạt động</CardTitle>
            </CardHeader>
            <CardContent>
              <UserActivity />
            </CardContent>
          </Card>
          
          <Tabs defaultValue="funds">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="funds">Quỹ của tôi</TabsTrigger>
              <TabsTrigger value="proposals">Đề xuất</TabsTrigger>
              <TabsTrigger value="votes">Bỏ phiếu</TabsTrigger>
              <TabsTrigger value="transactions">Giao dịch</TabsTrigger>
            </TabsList>
            <TabsContent value="funds" className="mt-6">
              <UserFunds />
            </TabsContent>
            <TabsContent value="proposals" className="mt-6">
              <UserProposals />
            </TabsContent>
            <TabsContent value="votes" className="mt-6">
              <UserVotes />
            </TabsContent>
            <TabsContent value="transactions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Giao dịch gần đây</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-4">
                    <p className="text-muted-foreground">Xem giao dịch trong phần Tài chính</p>
                    <Button className="mt-4">Đi đến Tài chính</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}