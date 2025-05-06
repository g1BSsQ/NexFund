"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatAddress } from "@/lib/utils";
import { ENDPOINTS } from "@/lib/config";

interface Member {
  id: string;
  address: string;
  role: "quản trị viên" | "thành viên tích cực" | "thành viên";
  contribution: number;
  joinDate: string;
}

interface Transaction {
  id: string;
  type: "in" | "out";
  amount: number;
  fee: number;
  date: string;
  status: "completed" | "pending" | "failed";
  description: string;
  address: string;
}

export function FundMembers({ fundId, memberTransactions }: { fundId: string; memberTransactions: Transaction[] }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(ENDPOINTS.GET_FUND_MEMBERS, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fundId }),
        });
        const data = await response.json();
        if (data.error || data.message === "Không tìm thấy thành viên nào") {
          setMembers([]);
          setError(data.error || "Không tìm thấy thành viên nào");
          return;
        }

        // Tính lại contribution dựa trên memberTransactions
        const updatedMembers = data.map((member: Member) => {
          const memberContribution = memberTransactions
            .filter((tx) => tx.type === "in" && tx.address === member.address && tx.description === "Đóng góp")
            .reduce((sum, tx) => sum + tx.amount, 0);

          return {
            ...member,
            contribution: memberContribution,
          };
        });

        setMembers(updatedMembers);
        setError(null);
      } catch (error) {
        setError("Không thể kết nối đến API. Vui lòng kiểm tra kết nối hoặc thử lại sau.");
        setMembers([]);
      }
    };

    if (fundId) {
      fetchMembers();
    }
  }, [fundId, memberTransactions]);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!members.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Chưa có thành viên nào trong quỹ này</p>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "quản trị viên":
        return <Badge variant="gradient">Quản trị viên</Badge>;
      case "thành viên tích cực":
        return (
          <Badge variant="outline" className="bg-primary/10 text-primary">
            Thành viên tích cực
          </Badge>
        );
      case "thành viên":
        return <Badge variant="outline">Thành viên</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg glass-card">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={`https://avatar.vercel.sh/${member.address}`} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {member.address.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{formatAddress(member.address, 30, 8)}</p>
                {getRoleBadge(member.role)}
              </div>
              <p className="text-xs text-muted-foreground">
                Tham gia: {new Date(member.joinDate).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">{member.contribution.toFixed(3)} ADA</p>
            <p className="text-xs text-muted-foreground">Đã đóng góp</p>
          </div>
        </div>
      ))}
    </div>
  );
}