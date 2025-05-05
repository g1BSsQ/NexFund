"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wallet, UserPlus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@meshsdk/react";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fundId: string;
  fundName: string;
}

export function InviteMemberDialog({ open, onOpenChange, fundId, fundName }: InviteMemberDialogProps) {
  const { wallet } = useWallet();
  // senderAddress lấy từ ví của người dùng
  const [senderAddress, setSenderAddress] = useState("");
  // receiverAddress do người dùng nhập (không có mặc định)
  const [receiverAddress, setReceiverAddress] = useState("");
  const [message, setMessage] = useState(
    `Xin chào,\n\nTôi muốn mời địa chỉ ví của bạn tham gia vào quỹ "${fundName}" trên nền tảng DanoFund.\n\nTrân trọng,`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (wallet) {
      wallet.getChangeAddress().then((addr) => {
        setSenderAddress(addr);
        // Có thể không tự động điền receiverAddress để ép người dùng nhập
        setReceiverAddress("");
      });
    }
  }, [wallet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!receiverAddress || !fundId) return;

    // Kiểm tra nếu người dùng cố gắng gửi lời mời đến chính mình
    if (receiverAddress === senderAddress) {
      toast({
        title: "Lỗi",
        description: "Bạn không thể tự gửi lời mời đến chính mình.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost/danofund/api/create_invitation.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fundId,
          senderAddress,
          receiverAddress,
          message,
        }),
      });
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        // Sau khi gửi thành công, reset receiverAddress và message nếu cần
        setReceiverAddress("");
        setMessage(
          `Xin chào,\n\nTôi muốn mời địa chỉ ví của bạn tham gia vào quỹ "${fundName}" trên nền tảng DanoFund.\n\nTrân trọng,`
        );
        onOpenChange(false);

        toast({
          title: "Đã gửi lời mời",
          description: `Lời mời đã được gửi đến địa chỉ ${receiverAddress.substring(0, 8)}...${receiverAddress.substring(receiverAddress.length - 4)}`,
        });
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: `Không thể gửi lời mời: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] glass-card">
        <DialogHeader>
          <DialogTitle>Mời thành viên mới</DialogTitle>
          <DialogDescription>
            Gửi lời mời tham gia quỹ "{fundName}" đến thành viên mới qua địa chỉ ví.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-center">Lời mời đã được gửi!</h3>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Lời mời đã được gửi đến địa chỉ {receiverAddress.substring(0, 8)}...
              {receiverAddress.substring(receiverAddress.length - 4)}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="walletAddress">Địa chỉ ví</Label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="walletAddress"
                    type="text"
                    placeholder="addr....."
                    value={receiverAddress}
                    onChange={(e) => setReceiverAddress(e.target.value)}
                    className="pl-10 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="message">Lời nhắn</Label>
                <Textarea
                  id="message"
                  placeholder="Nhập lời nhắn của bạn"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting || !receiverAddress}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Gửi lời mời
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}