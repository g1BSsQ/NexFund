// Trong FundProposals.tsx
"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThumbsUp, Calendar } from "lucide-react"
import { formatAddress } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface Proposal {
  id: string
  fundId: string
  title: string
  description: string
  amount: number
  category: string
  deadline: string
  createdAt: string
  status: "active" | "approved" | "rejected" | "completed" | "pending"
  votePercentage: number
  votesRequired: number
  votesCount: number
  creator: string
}

interface Fund {
  id: string
  name: string
  description: string
  balance: number
  members: number
  approvalThreshold: number
  cooldownPeriod: number
}

export function FundProposals({ fundId, proposals, fund }: { fundId: string; proposals: Proposal[]; fund: Fund }) {
  const router = useRouter()

  if (!proposals.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Chưa có đề xuất nào cho quỹ này</p>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Đang hoạt động
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Đã duyệt
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Từ chối
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Hoàn thành
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {proposals.map((proposal) => (
        <div key={proposal.id} className="p-4 border rounded-lg glass-card">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium">{proposal.title}</h3>
            {getStatusBadge(proposal.status)}
          </div>
          <p className="text-sm text-muted-foreground mb-4">{proposal.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Hạn chót: {new Date(proposal.deadline).toLocaleDateString("vi-VN")}</span>
            </div>
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{proposal.votesCount} phiếu bầu</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm mb-2">
            <span>Yêu cầu: {proposal.amount.toFixed(3)} ADA</span>
            <span className="text-primary">{Math.round(proposal.votePercentage)}% đạt được</span>
          </div>
          <Progress value={fund.members > 0 ? (proposal.votePercentage) : 0} className="h-2 mb-4" />

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={`https://avatar.vercel.sh/${proposal.creator}`} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {proposal.creator.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{formatAddress(proposal.creator, 38, 8)}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.sessionStorage.setItem(
                  "proposal-detail",
                  JSON.stringify({ proposal, fund })
                );
                router.push(`/proposals/${proposal.id}`);
              }}
            >
              Chi tiết
            </Button>
          </div>
        </div>  
      ))}
    </div>
  )
}