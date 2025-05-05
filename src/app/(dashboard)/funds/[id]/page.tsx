"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpRight, Calendar, Users, UserPlus } from "lucide-react";
import { FundProposals } from "@/components/funds/fund-proposals";
import { FundTransactions } from "@/components/funds/fund-transactions";
import { FundMembers } from "@/components/funds/fund-members";
import { InviteMemberDialog } from "@/components/funds/invite-member-dialog";
import { formatAddress } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@meshsdk/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { contribute } from "@/cardano/contribute";
import { Asset } from "@meshsdk/core";
import { fetchVoter } from "@/cardano/caculateVote";
import axios from "axios";

interface Fund {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  current: number;
  total: number;
  category: string;
  members: number;
  proposals: number;
  transactions: number;
  startDate: string;
  creator: string;
  status: string;
  approvedProposals: number;
  activeMembers: number;
  daysActive: number;
  votingMechanism: string;
  proposalEligibility: string;
  approvalThreshold: number;
  minContribution: number;
  cooldownPeriod: number;
  visibility: string;
  activeProposals: number;
}

interface Proposal {
  id: string;
  fundId: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  deadline: string;
  createdAt: string;
  status: "active" | "approved" | "rejected" | "completed" | "pending";
  votePercentage: number;
  votesRequired: number;
  votesCount: number;
  creator: string;
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

interface Member {
  id: string;
  address: string;
  role: string;
  contribution: number;
  joinDate: string;
}

const API_URL = 'https://cardano-preview.blockfrost.io/api/v0';
const PROJECT_ID = 'previewxOC094xKrrjbuvWPhJ8bkiSoABW4jpDc';

async function getTransactionDetails(fundAddress: string): Promise<Transaction[]> {
  const txListOptions = {
    method: "GET",
    url: `${API_URL}/addresses/${fundAddress}/txs`,
    headers: { Project_id: PROJECT_ID },
    params: {
      count: 100,
      page: 1,
      order: "desc",
    },
  };

  try {
    const { data: txHashes } = await axios.request<string[]>(txListOptions);

    const transactions = await Promise.all(
      txHashes.map(async (txHash: string) => {
        const txDetailOptions = {
          method: "GET",
          url: `${API_URL}/txs/${txHash}`,
          headers: { Project_id: PROJECT_ID },
        };
        const txUtxoOptions = {
          method: "GET",
          url: `${API_URL}/txs/${txHash}/utxos`,
          headers: { Project_id: PROJECT_ID },
        };

        try {
          const [txDetailRes, txUtxoRes] = await Promise.all([
            axios.request(txDetailOptions),
            axios.request(txUtxoOptions),
          ]);

          const fee = Number(txDetailRes.data.fees) || 0;
          const utxos = txUtxoRes.data;

          const totalOutputLovelace = utxos.outputs
            .filter((utxo: any) => utxo.address === fundAddress)
            .reduce((sum: number, utxo: any) => {
              const lovelace = utxo.amount.find((amt: any) => amt.unit === "lovelace");
              return sum + (lovelace ? Number(lovelace.quantity) : 0);
            }, 0);

          const totalInputLovelace = utxos.inputs
            .filter((utxo: any) => utxo.address === fundAddress && !utxo.collateral)
            .reduce((sum: number, utxo: any) => {
              const lovelace = utxo.amount.find((amt: any) => amt.unit === "lovelace");
              return sum + (lovelace ? Number(lovelace.quantity) : 0);
            }, 0);

          const amount = totalInputLovelace - totalOutputLovelace;
          let type: "in" | "out" = amount > 0 ? "out" : "in";
          const amountInADA = Math.abs(amount) / 1000000;

          let counterPartyAddress = "";
          if (type === "out") {
            const outputAddresses = utxos.outputs
              .filter((utxo: any) => utxo.address !== fundAddress)
              .map((utxo: any) => utxo.address);
            counterPartyAddress = outputAddresses.length > 0 ? outputAddresses[0] : "Giao dịch nội bộ";
          } else {
            const senderAddresses = utxos.inputs
              .filter((utxo: any) => utxo.address !== fundAddress && !utxo.collateral)
              .map((utxo: any) => utxo.address);
            counterPartyAddress = senderAddresses.length > 0 ? senderAddresses[0] : "Giao dịch nội bộ";
          }

          const blockOptions = {
            method: "GET",
            url: `${API_URL}/blocks/${txDetailRes.data.block}`,
            headers: { Project_id: PROJECT_ID },
          };
          const blockRes = await axios.request(blockOptions);
          const txDate = new Date(blockRes.data.time * 1000).toISOString().split("T")[0];

          return {
            id: txHash,
            type,
            amount: amountInADA,
            fee: fee / 1000000,
            date: txDate,
            status: "completed",
            description: counterPartyAddress === "Giao dịch nội bộ" ? counterPartyAddress : (type === "in" ? "Đóng góp" : "Giải ngân"),
            address: counterPartyAddress === "Giao dịch nội bộ" ? fundAddress : counterPartyAddress,
          };
        } catch (error) {
          console.error(`Lỗi khi xử lý giao dịch ${txHash}:`, error);
          return null;
        }
      })
    );

    return transactions.filter((tx): tx is Transaction => tx !== null);
  } catch (error) {
    console.error("Lỗi khi truy vấn danh sách giao dịch:", error);
    return [];
  }
}

async function getFundBalance(fundAddress: string): Promise<number> {
  const options = {
    method: "GET",
    url: `${API_URL}/addresses/${fundAddress}`,
    headers: { Project_id: PROJECT_ID },
  };

  try {
    const { data } = await axios.request(options);
    const lovelace = data.amount.find((amt: any) => amt.unit === "lovelace");
    return lovelace ? Number(lovelace.quantity) / 1000000 : 0;
  } catch (error) {
    console.error("Lỗi khi lấy số dư từ Blockfrost:", error);
    return 0;
  }
}

export default function FundPage() {
  const params = useParams();
  const router = useRouter();
  const fundId = params.id as string;
  const { wallet } = useWallet();
  const { toast } = useToast();
  const [fund, setFund] = useState<Fund | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [memberTransactions, setMemberTransactions] = useState<Transaction[]>([]);
  const [memberData, setMemberData] = useState<(Transaction & { role: string; joinDate: string })[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [isMember, setIsMember] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [invitationId, setInvitationId] = useState<string | null>(null);

  const [contributeDialogOpen, setContributeDialogOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");
  const [contributionsByAddress, setContributionsByAddress] = useState<{ [address: string]: number }>({});
  const [totalContributions, setTotalContributions] = useState<number>(0);


  // Hàm tính toán vai trò thành viên
  const computeMemberRole = (contribution: number, fundTotal: number, fundMembers: number): string => {
    const averageContribution = fundMembers > 0 ? fundTotal / fundMembers : 0;
    return contribution > averageContribution ? "thành viên tích cực" : "thành viên";
  };

  async function fetchProposals(
    fundId: string,
    contributions: { [address: string]: number },
    totalContribution: number,
    approvalThreshold: number,
    votingMechanism: string,
    membersCount: number
  ) {
    try {
      const response = await fetch("http://localhost/danofund/api/get_proposals.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fundId }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
  
      const updatedProposals = await Promise.all(
        data.map(async (proposal: any) => {
          const voteResult = await fetchVoter(proposal.id);
          const totalVoters = voteResult.totalVoters;
          let votePercentage = 0;
  
          if (votingMechanism === "per-capita") {
            // Đầu người: số lượng phiếu ủng hộ / tổng thành viên
            const yesVotes = voteResult.yesVoters.length;
            votePercentage = membersCount > 0 ? (yesVotes / membersCount) * 100 : 0;
          } else {
            // Theo đóng góp: tổng đóng góp của người vote yes / tổng đóng góp
            const yesContribution = voteResult.yesVoters.reduce(
              (sum, voter) => sum + (contributions[voter.address] || 0),
              0
            );
            votePercentage = totalContribution > 0 ? (yesContribution / totalContribution) * 100 : 0;
          }
  
          return {
            id: proposal.id,
            fundId: proposal.fundId,
            title: proposal.title,
            description: proposal.description,
            amount: Number.parseFloat(proposal.amount),
            category: proposal.category || "Thử nghiệm",
            deadline: proposal.deadline,
            createdAt: proposal.createdAt && !isNaN(Date.parse(proposal.createdAt)) ? new Date(proposal.createdAt).toISOString().split("T")[0] : "",
            status: proposal.status as "active" | "approved" | "rejected" | "completed" | "pending",
            votePercentage,
            votesRequired: approvalThreshold || 51,
            votesCount: totalVoters,
            creator: proposal.creator,
          };
        })
      );
  
      return updatedProposals;
    } catch (error) {
      console.error("Không thể lấy danh sách đề xuất:", error);
      return [];
    }
  }

  useEffect(() => {
    const fetchTransactionsCount = async (address: string) => {
      try {
        const { data } = await axios.get<string[]>(
          `${API_URL}/addresses/${address}/transactions`,
          { headers: { Project_id: PROJECT_ID } }
        );
        return Array.isArray(data) ? data.length : 0;
      } catch {
        return 0;
      }
    };

    const fetchApprovedProposalsCount = async (address: string) => {
      try {
        const { data: hashes } = await axios.get<string[]>(
          `${API_URL}/addresses/${address}/transactions`,
          { headers: { Project_id: PROJECT_ID } }
        );
        let countOut = 0;
        await Promise.all(
          hashes.map(async (txHash) => {
            const utxos = (
              await axios.get(`${API_URL}/txs/${txHash}/utxos`, {
                headers: { Project_id: PROJECT_ID },
              })
            ).data;
            const totalOut = utxos.outputs
              .filter((o: any) => o.address !== address)
              .reduce((sum: number, o: any) => {
                const lov = o.amount.find((a: any) => a.unit === "lovelace");
                return sum + (lov ? +lov.quantity : 0);
              }, 0);
            if (totalOut > 0) countOut++;
          })
        );
        return countOut;
      } catch {
        return 0;
      }
    };

    const fetchFundDetails = async () => {
      try {
        const response = await fetch("http://localhost/danofund/api/get_fund_details.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fundId }),
        });
        const data = await response.json();
        if (data.error) {
          setError(data.error);
          setFund(null);
          return;
        }

        const [txCount, apprCount, txDetails, balance] = await Promise.all([
          fetchTransactionsCount(data.address),
          fetchApprovedProposalsCount(data.address),
          getTransactionDetails(data.address),
          getFundBalance(data.address),
        ]);
        setTransactions(txDetails);

        // Lọc giao dịch "in" để tính đóng góp cho thành viên
        const memberTxs = txDetails.filter((tx) => tx.type === "in" && tx.description === "Đóng góp");
        setMemberTransactions(memberTxs);

        // Tính tổng số đóng góp từ tất cả giao dịch "in"
        const totalContributions = memberTxs.reduce((sum, tx) => sum + tx.amount, 0);

        // Tính đóng góp của từng thành viên dựa trên địa chỉ
        const contributionsByAddress: { [address: string]: number } = {};
        memberTxs.forEach((tx) => {
          if (!contributionsByAddress[tx.address]) {
            contributionsByAddress[tx.address] = 0;
          }
          contributionsByAddress[tx.address] += tx.amount;
        });

        setContributionsByAddress(contributionsByAddress);
        setTotalContributions(totalContributions);

        // Lấy danh sách thành viên từ API get_fund_members.php
        const membersResponse = await fetch("http://localhost/danofund/api/get_fund_members.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fundId }),
        });
        const membersData = await membersResponse.json();

        let activeMembersCount = 0;
        let updatedMemberData: (Transaction & { role: string; joinDate: string })[] = [];

        if (membersData.message || membersData.error) {
          setMemberData([]);
        } else {
          // Kết hợp dữ liệu từ memberTransactions và membersData
          const memberMap: { [address: string]: Transaction[] } = {};
          memberTxs.forEach((tx) => {
            if (!memberMap[tx.address]) {
              memberMap[tx.address] = [];
            }
            memberMap[tx.address].push(tx);
          });

          updatedMemberData = membersData.map((member: Member) => {
            const memberTxs = memberMap[member.address] || [];
            const contribution = contributionsByAddress[member.address] || 0;
            const role = member.role === "quản trị viên" ? "quản trị viên" : computeMemberRole(contribution, totalContributions, data.members);
            if (role === "thành viên tích cực") activeMembersCount++;
            return {
              id: memberTxs.length > 0 ? memberTxs[0].id : "",
              type: "in" as const,
              amount: contribution,
              fee: 0,
              date: member.joinDate,
              status: "completed" as const,
              description: "Đóng góp",
              address: member.address,
              role,
              joinDate: member.joinDate,
            };
          });
          setMemberData(updatedMemberData);
        }

        setFund({
          ...data,
          transactions: txCount,
          approvedProposals: apprCount,
          total: totalContributions,
          current: balance,
          activeMembers: activeMembersCount,
        });
        setError(null);
      } catch (error) {
        setError("Không thể kết nối đến API. Vui lòng kiểm tra kết nối hoặc thử lại sau.");
        setFund(null);
        console.error("Không thể lấy dữ liệu quỹ:", error);
      }
    };

    const checkMembership = async () => {
      if (!wallet) return;
      try {
        const address = await wallet.getChangeAddress();
        const response = await fetch("http://localhost/danofund/api/check_membership.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fundId, address }),
        });
        const data = await response.json();
        if (data.error) {
          setError(data.error);
          return;
        }
        setIsMember(data.isMember);
      } catch (error) {
        setError("Không thể kiểm tra tư cách thành viên. Vui lòng thử lại sau.");
        console.error("Lỗi khi kiểm tra tư cách thành viên:", error);
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const invId = urlParams.get("invitationId");
    if (invId) setInvitationId(invId);
  const fetchData = async () => {
    setIsLoading(true);
    await fetchFundDetails();
    await checkMembership();
    setIsLoading(false);
  };

    if (fundId) {
      fetchData();
    } else {
      setError("Không tìm thấy fundId trong URL.");
      setIsLoading(false);
    }
  }, [fundId, wallet]);
  useEffect(() => {
    const fetchAndSetProposals = async () => {
      if (fund && fundId && fund.approvalThreshold !== undefined) {
        const updatedProposals = await fetchProposals(
          fundId,
          contributionsByAddress,
          totalContributions,
          fund.approvalThreshold,
          fund.votingMechanism,
          fund.members
        );
        setProposals(updatedProposals);
      }
    };
    fetchAndSetProposals();
  }, [fund, contributionsByAddress, totalContributions, fundId]);

  const handleOpenContributeDialog = async () => {
    setContributeDialogOpen(true);
    setContributeAmount("");
    if (wallet) {
      try {
        const balance = Number((await wallet.getBalance())[0].quantity);
        setWalletBalance(Number(balance) / 1_000_000);
      } catch {
        setWalletBalance(null);
      }
    }
  };

  const handleContribute = async () => {
    if (!wallet || !fund) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin ví hoặc quỹ.",
        variant: "destructive",
      });
      return;
    }
    try {
      const admin = fund.creator;
      const amount = Number(contributeAmount) * 1_000_000;
      const assets: Asset[] = [{ unit: "lovelace", quantity: amount.toString() }];
      const name = fund.name;
      const proposalEligibilityText = fund.proposalEligibility;
      const cooldownPeriod = fund.cooldownPeriod;
      const visibility = fund.visibility;
      const minContribution = fund.minContribution;
      const approvalThreshold = fund.approvalThreshold;
      const votingMechanism = fund.votingMechanism;
      const txhash = await contribute(
        wallet,
        admin,
        assets,
        amount,
        name,
        proposalEligibilityText,
        cooldownPeriod,
        visibility,
        minContribution,
        approvalThreshold,
        votingMechanism
      );
      toast({
        title: "Đóng góp thành công",
        description: `Bạn đã đóng góp ${contributeAmount} ADA vào quỹ ${fund.name}`,
      });
      setContributeDialogOpen(false);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: `Không thể đóng góp: ${error.message}`,
        variant: "destructive",
      });
      console.error("Lỗi khi đóng góp:", error);
    }
  };

  const handleJoinFund = async () => {
    if (!wallet || !fund) return;

    try {
      const address = await wallet.getChangeAddress();
      const joinResponse = await fetch("http://localhost/danofund/api/join_fund.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fundId: fund.id, address }),
      });
      const joinData = await joinResponse.json();
      if (joinData.error) throw new Error(joinData.error);

      if (fund.visibility === "private" && invitationId) {
        const deleteResponse = await fetch("http://localhost/danofund/api/delete_invitation.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitationId }),
        });
        const deleteData = await deleteResponse.json();
        if (deleteData.error) throw new Error(deleteData.error);
        setInvitationId(null);
      }

      setIsMember(true);
      setFund({ ...fund, members: fund.members + 1 });
      toast({
        title: "Tham gia thành công",
        description: `Bạn đã trở thành thành viên của quỹ ${fund.name}`,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: `Không thể tham gia quỹ: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center">Đang tải...</div>;
  }

  if (error || !fund) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-4">Lỗi</h1>
        <p className="text-red-500">{error || "Không tìm thấy quỹ"}</p>
      </div>
    );
  }

  const votingMechanismText =
    fund.votingMechanism === "per-capita"
      ? "Mỗi thành viên có quyền bỏ phiếu cho các đề xuất"
      : fund.votingMechanism === "contribution-percentage"
      ? "Trọng số phiếu bầu tỷ lệ với số tiền đóng góp"
      : "Cơ chế bỏ phiếu chưa được xác định";

  const proposalEligibilityText =
    fund.proposalEligibility === "all-members"
      ? "Bất kỳ thành viên nào cũng có thể tạo đề xuất"
      : fund.proposalEligibility === "min-contribution"
      ? "Chỉ thành viên đã đóng góp đủ mức tối thiểu"
      : fund.proposalEligibility === "founding-members"
      ? "Chỉ người tạo quỹ mới có thể tạo đề xuất"
      : "Điều kiện tạo đề xuất chưa được xác định";

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
        <div className="flex gap-2">
          {isMember ? (
            <>
              <Button variant="outline" className="gap-2" onClick={() => setInviteDialogOpen(true)}>
                <Users className="h-4 w-4" />
                Mời thành viên
              </Button>
              <Button
                variant="default"
                className="gap-2"
                onClick={handleOpenContributeDialog}
              >
                <ArrowUpRight className="h-4 w-4" />
                Đóng góp
              </Button>
            </>
          ) : (
            (fund.visibility === "public" || (fund.visibility === "private" && invitationId)) && (
              <Button variant="outline" className="gap-2" onClick={handleJoinFund}>
                <UserPlus className="h-4 w-4" />
                Tham gia
              </Button>
            )
          )}
        </div>
      </div>

      <Dialog open={contributeDialogOpen} onOpenChange={setContributeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đóng góp vào quỹ</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Số dư ví hiện tại:</span>
              <div className="font-bold text-lg">
                {walletBalance !== null ? `${walletBalance.toFixed(2)} ADA` : "Đang tải..."}
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Số ADA muốn đóng góp:</span>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={contributeAmount}
                onChange={e => setContributeAmount(e.target.value)}
                placeholder="Nhập số ADA"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleContribute}
              disabled={
                !contributeAmount ||
                Number(contributeAmount) <= 0 ||
                (walletBalance !== null && Number(contributeAmount) > walletBalance)
              }
            >
              Xác nhận đóng góp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <p className="text-sm text-muted-foreground mb-6">{fund.longDescription}</p>
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Bắt đầu: {new Date(fund.startDate).toLocaleDateString("vi-VN")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{fund.members} thành viên tham gia</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Số dư: {fund.current.toFixed(3)} ADA</span>
                    <span>Đã quyên góp: {fund.total.toFixed(3)} ADA</span>
                  </div>
                  <Progress value={fund.total === 0 ? 0 : (fund.current / fund.total) * 100} className="h-2" />
                  <p className="text-xs text-right text-muted-foreground">
                    Đã sử dụng {fund.total === 0 ? 0 : 100 - Math.round((fund.current / fund.total) * 100)}%
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`https://avatar.vercel.sh/${fund.id}`} />
                      <AvatarFallback className="bg-primary/10 text-primary">{fund.id.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{formatAddress(fund.id, 38, 8)}</p>
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
                    {isMember && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => router.push(`/funds/${fund.id}/create_proposals`)}
                      >
                        Tạo đề xuất
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FundProposals fundId={fundId} proposals={proposals} fund={fund} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>Giao dịch</CardTitle>
                </CardHeader>
                <CardContent>
                  <FundTransactions transactions={transactions} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="members">
              <Card>
                <CardHeader>
                  <CardTitle>Thành viên</CardTitle>
                </CardHeader>
                <CardContent>
                  <FundMembers fundId={fundId} memberTransactions={memberData} />
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
                  <dd className="text-sm font-medium">{fund.approvedProposals}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Thành viên tích cực:</dt>
                  <dd className="text-sm font-medium">{fund.activeMembers}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Thời gian hoạt động:</dt>
                  <dd className="text-sm font-medium">{fund.daysActive} ngày</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card glass hover className="overflow-hidden">
            <CardHeader>
              <CardTitle>Cơ chế hoạt động</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Cơ chế bỏ phiếu</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                  <li>{votingMechanismText}</li>
                  <li>Đề xuất cần đạt tối thiểu {fund.approvalThreshold}% phiếu bầu để được phê duyệt</li>
                  <li>Thời gian bỏ phiếu kéo dài 7 ngày tính từ ngày tạo đề xuất</li>
                  <li>Có thể thay đổi phiếu bầu sau khi đã bỏ phiếu</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Điều kiện tạo đề xuất</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                  <li>{proposalEligibilityText}</li>
                  <li>Đề xuất phải có mô tả chi tiết và số lượng ADA yêu cầu</li>
                  <li>Thời hạn đề xuất tối thiểu là {fund.cooldownPeriod} ngày kể từ ngày tạo</li>
                  <li>Mỗi thành viên chỉ được có tối đa 1 đề xuất đang hoạt động</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Quy định khác</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                  <li>Đề xuất có đủ số vote sẽ được người viết đề xuất giải ngân</li>
                  <li>Thành viên tạo đề xuất phải báo cáo tiến độ mỗi 14 ngày</li>
                  <li>Quỹ có quyền hủy đề xuất thông qua bỏ phiếu nếu phát hiện gian lận</li>
                </ul>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-primary" />
          </Card>
        </div>
      </div>
      {isMember && (
        <InviteMemberDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          fundId={fundId}
          fundName={fund.name}
        />
      )}
    </div>
  );
}