// pages/profile.tsx

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserActivity } from "@/components/profile/user-activity";
import { UserProposals } from "@/components/profile/user-proposals";
import { UserVotes } from "@/components/profile/user-votes";
import { UserInvitations } from "@/components/profile/user-invitations";
import { UserFunds } from "@/components/profile/user-funds";
import { Settings, Edit } from "lucide-react";
import { useWallet } from "@meshsdk/react";
import { formatAddress, getTransactionDetails, getFundBalance } from "@/lib/utils";

interface RawFund {
  id: string;
  address: string;
  name: string;
  description: string;
  category: string;
  role: string;
}

interface Fund extends RawFund {
  current: number;
  total: number;
}

interface Invitation {
  id: string;
  fundId: string;
  fundName: string;
  senderAddress: string;
  message: string;
  date: string;
}

type ProposalStatus = "approved" | "rejected" | "pending";

interface Proposal {
  id: string;
  title: string;
  description: string;
  fund: { id: string; name: string };
  status: ProposalStatus;
  date: string;
  creator: string;
}

interface ActivityData {
  name: string;
  proposals: number;
  contributions: number;
}

interface UserProfile {
  join_date: string;
  fund_count: number;
  proposal_count: number;
  roles: string;
}

interface UserData {
  profile: UserProfile;
  funds: RawFund[];
  invitations: Invitation[];
  proposals: Proposal[];
  activity: ActivityData[];
}

export default function ProfilePage() {
  const { wallet } = useWallet();
  const [address, setAddress] = useState<string>("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [fundsWithStats, setFundsWithStats] = useState<Fund[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [myProposals, setMyProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    if (!wallet) {
      setError("Vui lòng kết nối ví để xem hồ sơ.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Lấy address
        const addr = await wallet.getChangeAddress();
        console.log("User address:", addr);
        setAddress(addr);

        // 2. Gọi API user_data.php
        const resp = await fetch("http://localhost/danofund/api/user_data.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_address: addr }),
        });
        console.log("user_data.php status:", resp.status);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data: UserData = await resp.json();
        if ((data as any).error) throw new Error((data as any).error);
        setUserData(data);

        // 3. Lấy proposals do user tạo
        const propRes = await fetch("http://localhost/danofund/api/get_proposals.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const allProps: any[] = await propRes.json();
        setMyProposals(allProps.filter(p => p.creator === addr));

        // 4. Enrich mỗi fund với current + total
        const enriched = await Promise.all(
          data.funds.map(async f => {
            const [txs, balance] = await Promise.all([
              getTransactionDetails(f.address),
              getFundBalance(f.address),
            ]);
            const totalDonated = txs
              .filter(tx => tx.type === "in" && tx.description === "Đóng góp")
              .reduce((sum, tx) => sum + tx.amount, 0);
            return { ...f, current: balance, total: totalDonated } as Fund;
          })
        );
        setFundsWithStats(enriched);
        setError(null);

      } catch (e: any) {
        console.error("fetchData error:", e);
        setError(e.message || "Không thể tải hồ sơ. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [wallet]);

  if (isLoading) return <div className="p-6 text-center">Đang tải...</div>;
  if (error)     return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Hồ sơ</h1>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" /> Cài đặt
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Thông tin cá nhân */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={`https://avatar.vercel.sh/${address}`} />
                <AvatarFallback className="text-2xl">
                  {address ? address.charAt(0) : "NN"}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-xl font-bold">Người Dùng</h2>
                <p className="text-sm text-muted-foreground">{formatAddress(address)}</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="h-4 w-4" /> Chỉnh sửa hồ sơ
              </Button>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-medium">Vai trò</p>
                <p className="text-sm">{userData?.profile.roles}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Ngày tham gia</p>
                <p className="text-sm">{userData?.profile.join_date}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Quỹ quản lý</p>
                <p className="text-sm">{userData?.profile.fund_count}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Đề xuất đã tạo</p>
                <p className="text-sm">{userData?.profile.proposal_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs phần còn lại */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tổng quan hoạt động</CardTitle>
            </CardHeader>
            <CardContent>
              <UserActivity data={userData?.activity || []} />
            </CardContent>
          </Card>

          <Tabs defaultValue="funds">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="funds">Quỹ của tôi</TabsTrigger>
              <TabsTrigger value="proposals">Đề xuất</TabsTrigger>
              <TabsTrigger value="votes">Bỏ phiếu</TabsTrigger>
              <TabsTrigger value="invitations">Lời mời</TabsTrigger>
            </TabsList>
            <TabsContent value="funds" className="mt-6">
              <UserFunds funds={fundsWithStats} />
            </TabsContent>
            <TabsContent value="proposals" className="mt-6">
              <UserProposals proposals={myProposals} />
            </TabsContent>
            <TabsContent value="votes" className="mt-6">
              <UserVotes />
            </TabsContent>
            <TabsContent value="invitations" className="mt-6">
              <UserInvitations invitations={userData?.invitations || []} address={address} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
