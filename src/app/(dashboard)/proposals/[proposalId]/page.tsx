"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { formatAddress } from "@/lib/utils"
import {
  ArrowLeft,
  ThumbsUp,
  Calendar,
  Clock,
  DollarSign,
  Users,
  MessageSquare,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { useWallet } from "@meshsdk/react"
import { vote } from "@/cardano/vote"
import { applyParamsToScript, Asset, deserializeAddress, serializePlutusScript, stringToHex } from "@meshsdk/core"
import { fetchVoter } from "@/cardano/caculateVote"
import axios from "axios";
import {exportMoney} from "@/cardano/exportMoney"
import { readValidator } from "@/cardano/adapter"
import { fetchUtxos, selectBestUtxos, selectBestUtxoTxHashes } from "@/cardano/selectBestUtxos"
import { BLOCKFROST_API_URL, BLOCKFROST_PROJECT_ID, ENDPOINTS } from "@/lib/config"

interface Fund {
  id: string
  name: string
  description: string
  balance: number
  members: number
  approvalThreshold: number
  cooldownPeriod: number
  votingMechanism: string
  proposalEligibility: string
  minContribution: number
  visibility: string
  creator: string
}

interface Proposal {
  id: string
  fundId: string
  title: string
  description: string
  details: string
  amount: number
  category: string
  deadline: string
  createdAt: string
  status: "active" | "approved" | "rejected" | "completed" | "pending"
  votePercentage: number
  votesRequired: number
  votesCount: number
  creator: string
  attachments: {
    id: string
    name: string
    type: string
    url: string
  }[]
  voters: {
    address: string
    vote: "yes" | "no"
    txHash: string
  }[]
  comments: {
    id: string
    address: string
    content: string
    timestamp: string
  }[]
}

// Lấy đóng góp từ Blockfrost
async function fetchContributions(fundAddress: string) {
  try {
    const txListOptions = {
      method: "GET",
      url: `${BLOCKFROST_API_URL}/addresses/${fundAddress}/txs`,
      headers: { Project_id: BLOCKFROST_PROJECT_ID },
      params: { count: 100, page: 1, order: "desc" },
    }
    const { data: txHashes } = await axios.request<string[]>(txListOptions)
    const contributionsByAddress: { [address: string]: number } = {}
    let totalContributions = 0

    await Promise.all(
      txHashes.map(async (txHash: string) => {
        const utxoRes = await axios.get(`${BLOCKFROST_API_URL}/txs/${txHash}/utxos`, { headers: { Project_id: BLOCKFROST_PROJECT_ID } })
        const utxos = utxoRes.data
        utxos.outputs
          .filter((utxo: any) => utxo.address === fundAddress)
          .forEach((utxo: any) => {
            const lovelace = utxo.amount.find((amt: any) => amt.unit === "lovelace")
            if (lovelace) {
              const senders = utxos.inputs.filter((i: any) => i.address !== fundAddress && !i.collateral)
              const sender = senders.length > 0 ? senders[0].address : fundAddress
              const ada = Number(lovelace.quantity) / 1_000_000
              contributionsByAddress[sender] = (contributionsByAddress[sender] || 0) + ada
              totalContributions += ada
            }
          })
      })
    )
    return { contributionsByAddress, totalContributions }
  } catch {
    return { contributionsByAddress: {}, totalContributions: 0 }
  }
}



export default function ProposalDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { wallet, address } = useWallet()
  const proposalId = params.proposalId as string



  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [fund, setFund] = useState<Fund | null>(null)
  const [fundName, setFundName] = useState<string>("Quỹ không xác định")
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [userVoteType, setUserVoteType] = useState<"yes" | "no" | null>(null)
  const [comment, setComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [daysRemaining, setDaysRemaining] = useState(0)

  useEffect(() => {
    const fetchProposal = async () => {
      setLoading(true)
      try {
        if (!proposalId) throw new Error("Thiếu proposalId trong URL")

        // Fetch proposal data
        const proposalResponse = await fetch(ENDPOINTS.GET_PROPOSAL_DETAILS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proposalId }),
        })
        if (!proposalResponse.ok) throw new Error(await proposalResponse.text())
        const proposalData = await proposalResponse.json()
        if (proposalData.error) throw new Error(proposalData.error)

        const fundId = proposalData.fundId
        if (!fundId) throw new Error("Không tìm thấy fundId trong dữ liệu đề xuất")

        // Fetch fund data
        const fundResponse = await fetch(ENDPOINTS.GET_FUND_DETAILS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fundId }),
        })
        if (!fundResponse.ok) throw new Error(await fundResponse.text())
        const fundData = await fundResponse.json()
        if (fundData.error) throw new Error(fundData.error)

        const votingMechanism = fundData.votingMechanism || "contribution-percentage"

        // Fetch voters
        const voteResult = await fetchVoter(proposalData.id)
        const voters = [
          ...voteResult.yesVoters.map(v => ({
            address: v.address,
            vote: "yes" as const,
            txHash: v.txHash,
          })),
          ...voteResult.noVoters.map(v => ({
            address: v.address,
            vote: "no" as const,
            txHash: v.txHash,
          })),
        ]

        // Fetch members
        const membersResponse = await fetch(ENDPOINTS.GET_FUND_MEMBERS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fundId }),
        })
        if (!membersResponse.ok) throw new Error(await membersResponse.text())
        const membersData = await membersResponse.json()
        const membersCount = membersData.length || 0

        // Tính votePercentage
        let votePercentage = 0
        if (votingMechanism === "per-capita") {
          // Đầu người
          const yesVotes = voteResult.yesVoters.length
          votePercentage = membersCount > 0 ? (yesVotes / membersCount) * 100 : 0
        } else {
          // Theo % đóng góp
          const { contributionsByAddress, totalContributions } = await fetchContributions(fundData.id)
          const yesContribution = voteResult.yesVoters.reduce(
            (sum, voter) => sum + (contributionsByAddress[voter.address] || 0),
            0
          )
          votePercentage = totalContributions > 0 ? (yesContribution / totalContributions) * 100 : 0
        }

        // Parse attachments
        let attachments = []
        try {
          attachments = proposalData.attachments ? JSON.parse(proposalData.attachments) : []
          attachments = attachments.map((url: string, index: number) => ({
            id: `att${index}`,
            name: url.split("/").pop() || "Tệp không tên",
            type: url.split(".").pop() || "unknown",
            url: url,
          }))
        } catch (error) {
          // ignore
        }

        const createdAt = new Date(proposalData.createdAt)
        const now = new Date()
        const expireDate = new Date(createdAt)
        expireDate.setDate(expireDate.getDate() + 7)
        const diffTime = expireDate.getTime() - now.getTime()
        const remaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

        const proposalWithData: Proposal = {
          id: proposalData.id,
          fundId: proposalData.fundId,
          title: proposalData.title,
          description: proposalData.description,
          details: proposalData.details,
          amount: Number.parseFloat(proposalData.amount),
          category: proposalData.category || "Khác",
          deadline: proposalData.deadline,
          createdAt: createdAt.toISOString().split("T")[0],
          status: proposalData.status as "active" | "approved" | "rejected" | "completed" | "pending",
          votePercentage,
          votesRequired: fundData.approvalThreshold || 51,
          votesCount: membersCount,
          creator: proposalData.creator,
          attachments,
          voters,
          comments: [],
        }

        setProposal(proposalWithData)
        setFund({
          id: fundData.id,
          name: fundData.name,
          description: fundData.description,
          balance: Number.parseFloat(fundData.current),
          members: fundData.members,
          approvalThreshold: fundData.approvalThreshold,
          cooldownPeriod: fundData.cooldownPeriod || 0,
          votingMechanism,
          proposalEligibility: fundData.proposalEligibility, 
          minContribution: fundData.minContribution,         
          visibility: fundData.visibility,           
          creator: fundData.creator,        
        })
        setFundName(fundData.name || "Quỹ không xác định")
        setDaysRemaining(remaining)
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: `Không thể tải thông tin đề xuất: ${error.message}`,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProposal()
  }, [proposalId, toast, address])


  const handleDisburse = async () => {
    if (!wallet || !proposal || !fund) return;
    try {
      const utxos = await fetchUtxos(fund.id);
      const txHashArr = selectBestUtxoTxHashes(utxos, proposal.amount);
      const contributeCompileCode = readValidator("contribute.contribute.spend");
      const pubkeyAdmin = deserializeAddress(fund.creator).pubKeyHash;
      const name = fund.name;
      const voteRequired = proposal.votesRequired;
      const constributeScriptCbor = applyParamsToScript(
        contributeCompileCode,
        [
          pubkeyAdmin,
          stringToHex(name),
          voteRequired,
          stringToHex(fund.votingMechanism),
          stringToHex(fund.proposalEligibility),
          fund.minContribution,
          fund.cooldownPeriod,
          stringToHex(fund.visibility),
        ]
      );
      const scriptAddr = serializePlutusScript(
        { code: constributeScriptCbor, version: "V3" },
        undefined,
        0,
      ).address;
      const addrReceiver = proposal.creator;
      const admin = fund.creator || "";
  
      const txhash = await exportMoney(
        txHashArr,
        wallet,
        proposal.amount * 1_000_000,
        scriptAddr,
        constributeScriptCbor,
        addrReceiver,
        admin
      );
      await fetch("http://localhost/danofund/api/update_proposal_status.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: proposal.id,
          status: "active",
          txHash: txhash,
        }),
      });

      setProposal(prev => prev ? { ...prev, status: "active" } : prev);

      toast({
        title: "Giải ngân thành công",
        description: `Đã giải ngân ${proposal.amount} ADA cho đề xuất này. TxHash: ${txhash}`,
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: `Giải ngân thất bại: ${error.message}`,
        variant: "destructive",
      });
    }
  };
  
  const handleVote = async (voteType: "yes" | "no") => {
    if (!proposal || !wallet || !fund) return

    setVoting(true)
    try {
      const admin = proposal.creator
      const name = proposal.title
      const assets: Asset[] = [
        {
          unit: "lovelace",
          quantity: "1200000"
        },
      ]
      const amount = proposal.amount
      const deadline = proposal.deadline
      const fundId = proposal.fundId
      const txHash = await vote(wallet, admin, name, voteType, assets, fundId, amount, deadline)

      setHasVoted(true)
      setUserVoteType(voteType)

      toast({
        title: "Đã bỏ phiếu thành công",
        description: `Giao dịch đã được gửi. TxHash: ${txHash}`,
      })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: `Không thể bỏ phiếu: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setVoting(false)
    }
  }

  const handleCancel = async () => {
    if (!proposal) return;
    try {
      await fetch("http://localhost/danofund/api/update_proposal_status.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: proposal.id,
          status: "rejected",
        }),
      });
      setProposal(prev => prev ? { ...prev, status: "rejected" } : prev);
      toast({
        title: "Đã hủy đề xuất",
        description: "Trạng thái đề xuất đã được cập nhật là Từ chối",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: `Không thể hủy đề xuất: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !proposal) return

    setSubmittingComment(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const newComment = {
        id: `comment${Date.now()}`,
        address: address || "addr1qxy8p0khj5xga5s5awd0vzcmea3zjrh6ffr3mxdmqq8y9g8jt8kc9yhe6xh9qxwrvq6jjg0mc9xpjgzuzsjp5v4rns2q5vxrky",
        content: comment,
        timestamp: new Date().toISOString().split("T")[0],
      }
      setProposal({
        ...proposal,
        comments: [...proposal.comments, newComment],
      })
      setComment("")
      toast({
        title: "Đã gửi bình luận",
        description: "Bình luận của bạn đã được đăng thành công",
      })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể gửi bình luận. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setSubmittingComment(false)
    }
  }

  const renderStatus = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertCircle className="mr-1 h-3 w-3" />
            Đang chờ bỏ phiếu
          </Badge>
        )
      case "active":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <AlertCircle className="mr-1 h-3 w-3" />
            Đang hoạt động
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Đã duyệt
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="mr-1 h-3 w-3" />
            Từ chối
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Hoàn thành
          </Badge>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Đang tải thông tin đề xuất...</p>
        </div>
      </div>
    )
  }

  if (!proposal || !fund) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Không tìm thấy đề xuất</h2>
        <p className="text-muted-foreground">Đề xuất này không tồn tại hoặc đã bị xóa</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{proposal.title}</h1>
            {renderStatus(proposal.status)}
          </div>
          <p className="text-muted-foreground text-sm">
            Đề xuất cho {fundName} • Tạo ngày {format(new Date(proposal.createdAt), "dd/MM/yyyy", { locale: vi })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết đề xuất</CardTitle>
              <CardDescription>Thông tin chi tiết về đề xuất</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {proposal.details.split("\n\n").map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Số tiền yêu cầu</div>
                      <div className="font-medium">{proposal.amount} ADA</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Thời hạn</div>
                      <div className="font-medium">
                        {format(new Date(proposal.deadline), "dd/MM/yyyy", { locale: vi })}
                      </div>
                    </div>
                  </div>
                </div>
                {proposal.attachments.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-medium mb-2">Tài liệu đính kèm</h3>
                    <div className="space-y-2">
                      {proposal.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/20">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm">{attachment.name}</span>
                          <Button variant="ghost" size="sm" className="ml-auto h-7 px-2">
                            Tải xuống
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`https://avatar.vercel.sh/${proposal.creator.substring(0, 8)}`} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {proposal.creator.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Người tạo đề xuất</p>
                      <p className="text-xs text-muted-foreground font-mono">{formatAddress(proposal.creator)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="discussion">
            <TabsList className="grid w-full max-w-md grid-cols-2 rounded-full">
              <TabsTrigger value="discussion" className="rounded-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Thảo luận ({proposal.comments.length})
              </TabsTrigger>
              <TabsTrigger value="voters" className="rounded-full">
                <Users className="mr-2 h-4 w-4" />
                Người bỏ phiếu ({proposal.voters.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="discussion" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thảo luận</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {proposal.comments.length > 0 ? (
                      <div className="space-y-4">
                        {proposal.comments.map((comment) => (
                          <div key={comment.id} className="p-4 rounded-lg bg-muted/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={`https://avatar.vercel.sh/${comment.address.substring(0, 8)}`} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {comment.address.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{formatAddress(comment.address)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(comment.timestamp), "dd/MM/yyyy", { locale: vi })}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-2" />
                        <p className="text-muted-foreground">Chưa có bình luận nào</p>
                      </div>
                    )}
                    <Separator />
                    <form onSubmit={handleSubmitComment} className="space-y-4">
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Viết bình luận của bạn..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="default"
                        className="ml-auto"
                        disabled={!comment.trim() || submittingComment}
                      >
                        {submittingComment ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Gửi bình luận
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="voters" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Người bỏ phiếu</CardTitle>
                </CardHeader>
                <CardContent>
                  {proposal.voters.length > 0 ? (
                    <div className="space-y-4">
                      {proposal.voters.map((voter, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={`https://avatar.vercel.sh/${voter.address.substring(0, 8)}`} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {voter.address.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{formatAddress(voter.address)}</p>
                              <span className="text-xs text-muted-foreground break-all">
                                TxHash: {voter.txHash}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant={voter.vote === "yes" ? "default" : "destructive"}
                            className={voter.vote === "yes" ? "bg-green-600" : ""}
                          >
                            {voter.vote === "yes" ? "Ủng hộ" : "Phản đối"}
                        </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-2" />
                      <p className="text-muted-foreground">Chưa có ai bỏ phiếu</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái bỏ phiếu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tiến độ</span>
                  <span className="text-sm font-medium">
                    {proposal.votePercentage}% / {100}%
                  </span>
                </div>
                <Progress value={proposal.votePercentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Cần đạt tối thiểu {proposal.votesRequired}% phiếu bầu để được phê duyệt
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/20">
                  <div className="text-sm text-muted-foreground">Tổng số phiếu của quỹ</div>
                  <div className="text-2xl font-bold">{proposal.votesCount}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/20">
                  <div className="text-sm text-muted-foreground">Thời gian còn lại</div>
                  <div className="text-2xl font-bold">{daysRemaining} ngày</div>
                </div>
              </div>
              {proposal.status === "pending" && (
                <div className="pt-4">
                  <div className="space-y-3">
                    {hasVoted && (
                      <div className="text-center mb-3">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Bạn đã bỏ phiếu {userVoteType === "yes" ? "Ủng hộ" : "Phản đối"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">Bạn vẫn có thể thay đổi quyết định</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleVote("yes")}
                        disabled={voting}
                      >
                        {voting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ThumbsUp className="mr-2 h-4 w-4" />
                        )}
                        Ủng hộ
                      </Button>
                      <Button
                        variant="default"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleVote("no")}
                        disabled={voting}
                      >
                        {voting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4" />
                        )}
                        Phản đối
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Ngày tạo: </span>
                  <span>{format(new Date(proposal.createdAt), "dd/MM/yyyy", { locale: vi })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Thời hạn: </span>
                  <span>{format(new Date(proposal.deadline), "dd/MM/yyyy", { locale: vi })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Số người bỏ phiếu: </span>
                  <span>{proposal.voters.length}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Số bình luận: </span>
                  <span>{proposal.comments.length}</span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Danh mục</h3>
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  {proposal.category}
                </Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Quỹ</h3>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-white font-bold text-xs">
                    {fundName.charAt(0)}
                  </div>
                  <span className="text-sm">{fundName}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hành động</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {proposal.status === "pending" && proposal.creator === address && (
                  <Button
                    variant="default"
                    className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleDisburse}
                    disabled={voting || proposal.votePercentage < proposal.votesRequired}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Giải ngân
                  </Button>
                )}
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Xuất báo cáo PDF
                </Button>
                {proposal.status === "pending" && proposal.creator === address && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleCancel}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Hủy đề xuất
                  </Button>
                )}
              </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}