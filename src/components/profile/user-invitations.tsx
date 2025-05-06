"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, X, Calendar, Users, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatAddress } from "@/lib/utils";
import { ENDPOINTS } from "@/lib/config";

interface Invitation {
  id: string;
  fundId: string;
  fundName: string;
  senderAddress: string;
  message: string;
  date: string;
}

interface UserInvitationsProps {
  invitations: Invitation[];
  address: string;
}

export function UserInvitations({ invitations, address }: UserInvitationsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [currentInvitations, setCurrentInvitations] = useState<Invitation[]>(invitations);

  const handleAccept = async (id: string) => {
    const invitation = currentInvitations.find((inv) => inv.id === id);
    if (!invitation) return;

    try {
      // Chuyển đến trang chi tiết quỹ với invitationId
      router.push(`/funds/${invitation.fundId}?invitationId=${invitation.id}`);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: `Không thể chuyển đến chi tiết quỹ: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (id: string) => {
    const invitation = currentInvitations.find((inv) => inv.id === id);
    if (!invitation) return;

    try {
      const response = await fetch(ENDPOINTS.DELETE_INVITATION, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: id }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setCurrentInvitations(currentInvitations.filter((inv) => inv.id !== id));
      toast({
        title: "Đã từ chối lời mời",
        description: `Lời mời tham gia quỹ ${invitation.fundName} đã được từ chối`,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: `Không thể từ chối lời mời: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  if (currentInvitations.length === 0) {
    return (
      <Alert className="glass-card">
        <AlertTitle>Chưa có lời mời nào</AlertTitle>
        <AlertDescription>
          Bạn chưa nhận được lời mời tham gia quỹ nào. Khi có người mời bạn tham gia quỹ, lời mời sẽ xuất hiện ở đây.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {currentInvitations.map((invitation) => (
          <Card key={invitation.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="gradient">{invitation.fundName}</Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Lời mời mới
                </Badge>
              </div>
              <CardTitle className="text-lg mt-2">Lời mời tham gia quỹ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={`https://avatar.vercel.sh/${invitation.senderAddress}`} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {invitation.senderAddress.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <p>
                    <span className="font-medium">{formatAddress(invitation.senderAddress)}</span>
                    <span className="text-sm text-muted-foreground"> đã mời bạn tham gia</span>
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-white/10">
                  <p className="text-sm">{invitation.message}</p>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(invitation.date).toLocaleDateString("vi-VN")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Quỹ: {invitation.fundName}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
                    onClick={() => handleDecline(invitation.id)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Từ chối
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => handleAccept(invitation.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Chi tiết
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}