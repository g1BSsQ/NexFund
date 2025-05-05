"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Info, Settings, Users, Shield, Eye, EyeOff, Wallet } from "lucide-react"
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip"
import { motion } from "framer-motion"
import { useWallet } from "@meshsdk/react"
import { applyParamsToScript, deserializeAddress, serializePlutusScript, stringToHex } from "@meshsdk/core"
import { readValidator } from "@/cardano/adapter"

async function createFund(
  admin: string,
  name: string,
  description: string,
  shortDescription: string,
  governanceRules: any,
) {
  try {
    const pubkeyAdmin = deserializeAddress(admin).pubKeyHash;
    const contributeCompileCode = readValidator("contribute.contribute.spend");
    const constributeScriptCbor = applyParamsToScript(
      contributeCompileCode,
      [pubkeyAdmin, stringToHex(name),
        governanceRules.approvalThreshold,
        stringToHex(governanceRules.votingMechanism),
        stringToHex(governanceRules.proposalEligibility),
        governanceRules.minContribution,
        governanceRules.cooldownPeriod,
        stringToHex(governanceRules.visibility),
        
      ],
    );
    const scriptAddr = serializePlutusScript(
      { code: constributeScriptCbor, version: "V3" },
      undefined,
      0,
    ).address;

    const response = await fetch('http://localhost/danofund/api/create_fund.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scriptAddr,
        name,
        shortDescription,
        description,
        admin,
        governanceRules,
      }),
    });

    const result = await response.json();

    if (!response.ok || result.error || result.warning) {
      if (result.warning && result.warning.includes("Quỹ đã tồn tại")) {
        window.alert("Quỹ đã tồn tại. Bạn đã tạo quỹ giống nhau rồi, vui lòng kiểm tra lại.");
      } else {
        window.alert(result.error || result.warning || "Không thể tạo quỹ");
      }
      return null;
    }

    return result.scriptAddr;
  } catch (error) {
    console.error("Không thể tạo quỹ:", error);
    window.alert("Có lỗi xảy ra khi tạo quỹ.");
    return null;
  }
}

export default function CreateFundPage() {

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
  
  const router = useRouter()

  // Basic fund information
  const [name, setName] = useState("")
  const [shortDescription, setShortDescription] = useState("") // Trường mô tả ngắn mới
  const [description, setDescription] = useState("")

  // Governance settings
  const [votingMechanism, setVotingMechanism] = useState<"per-capita" | "contribution-percentage">(
    "per-capita",
  )
  const [proposalEligibility, setProposalEligibility] = useState<
    "all-members" | "min-contribution" | "founding-members"
  >("all-members")
  const [approvalThreshold, setApprovalThreshold] = useState(51)
  const [minContribution, setMinContribution] = useState(0)
  const [cooldownPeriod, setCooldownPeriod] = useState(7)
  const [visibility, setVisibility] = useState<"public" | "private">("private")

  // Current tab
  const [currentTab, setCurrentTab] = useState("basic")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !shortDescription) return;
  
    try {
      const governanceRules = {
        votingMechanism,
        proposalEligibility,
        approvalThreshold,
        minContribution,
        cooldownPeriod,
        visibility,
      }
      const result = await createFund(address, name, description, shortDescription, governanceRules);
      if (result) {
        router.push(`/dashboard/${address}`);
      }
    } catch (error) {
      console.error("Failed to create fund:", error);
    }
  }

  const handleGoBack = () => {
    router.back()
  }

  return (
    <TooltipProvider>
      <div className="container max-w-4xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-6"
        >
          <Button variant="ghost" size="icon" onClick={handleGoBack} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text">Tạo quỹ mới</h1>
            <p className="text-muted-foreground">Thiết lập quỹ và quy tắc quản trị</p>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Thông tin cơ bản
              </TabsTrigger>
              <TabsTrigger value="governance" className="flex items-center gap-2" disabled={!name || !description || !shortDescription}>
                <Shield className="h-4 w-4" />
                Quy tắc quản trị
              </TabsTrigger>
              <TabsTrigger value="visibility" className="flex items-center gap-2" disabled={!name || !description || !shortDescription}>
                <Users className="h-4 w-4" />
                Quyền truy cập
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <Card glass gradient>
                <CardHeader>
                  <CardTitle>Thông tin quỹ</CardTitle>
                  <CardDescription>Nhập thông tin cơ bản về quỹ của bạn</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tên quỹ</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nhập tên quỹ"
                      className="glass-card"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="short-description">Mô tả ngắn</Label>
                    <Input
                      id="short-description"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      placeholder="Nhập mô tả ngắn về quỹ"
                      className="glass-card"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Mô tả mục đích và mục tiêu của quỹ"
                      className="glass-card min-h-[120px]"
                      required
                    />
                  </div>
                  <div className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-primary" />
                        <span className="font-medium">Đơn vị tiền tệ</span>
                      </div>
                      <Badge variant="gradient">ADA</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Quỹ này sẽ sử dụng ADA làm đơn vị tiền tệ chính</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handleGoBack}>
                    Hủy
                  </Button>
                  <Button variant="gradient" onClick={() => setCurrentTab("governance")} disabled={!name || !description}>
                    Tiếp tục
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

          <TabsContent value="governance">
            <Card glass gradient>
              <CardHeader>
                <CardTitle>Quy tắc quản trị</CardTitle>
                <CardDescription>Thiết lập cách thức hoạt động và ra quyết định của quỹ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="voting-mechanism" className="flex items-center gap-2">
                      Cơ chế bỏ phiếu
                      <Tooltip content="Cách tính trọng số phiếu bầu của các thành viên">
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </Tooltip>
                    </Label>
                  </div>
                  <Select value={votingMechanism} onValueChange={(value: any) => setVotingMechanism(value)}>
                    <SelectTrigger id="voting-mechanism" className="glass-card">
                      <SelectValue placeholder="Chọn cơ chế bỏ phiếu" />
                    </SelectTrigger>
                    <SelectContent className="glass-card">
                      <SelectItem value="per-capita">
                        <div className="flex flex-col">
                          <span>Bình đẳng (1 người = 1 phiếu)</span>
                          <span className="text-xs text-muted-foreground">
                            Mỗi thành viên có một phiếu bầu có giá trị ngang nhau
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="contribution-percentage">
                        <div className="flex flex-col">
                          <span>Theo tỷ lệ đóng góp</span>
                          <span className="text-xs text-muted-foreground">
                            Trọng số phiếu bầu tỷ lệ với số tiền đóng góp
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="proposal-eligibility" className="flex items-center gap-2">
                      Điều kiện tạo đề xuất
                      <Tooltip content="Ai có thể tạo đề xuất trong quỹ này">
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </Tooltip>
                    </Label>
                  </div>
                  <Select value={proposalEligibility} onValueChange={(value: any) => setProposalEligibility(value)}>
                    <SelectTrigger id="proposal-eligibility" className="glass-card">
                      <SelectValue placeholder="Chọn điều kiện tạo đề xuất" />
                    </SelectTrigger>
                    <SelectContent className="glass-card">
                      <SelectItem value="all-members">
                        <div className="flex flex-col">
                          <span>Tất cả thành viên</span>
                          <span className="text-xs text-muted-foreground">
                            Bất kỳ thành viên nào cũng có thể tạo đề xuất
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="min-contribution">
                        <div className="flex flex-col">
                          <span>Đóng góp tối thiểu</span>
                          <span className="text-xs text-muted-foreground">
                            Chỉ thành viên đã đóng góp đủ mức tối thiểu
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="founding-members">
                        <div className="flex flex-col">
                          <span>Thành viên sáng lập</span>
                          <span className="text-xs text-muted-foreground">
                            Chỉ người tạo quỹ mới có thể tạo đề xuất
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="approval-threshold" className="flex items-center gap-2">
                      Ngưỡng phê duyệt
                      <Tooltip content="Tỷ lệ phần trăm phiếu bầu cần thiết để thông qua đề xuất">
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </Tooltip>
                    </Label>
                    <span className="text-sm font-medium">{approvalThreshold}%</span>
                  </div>
                  <Slider
                    id="approval-threshold"
                    min={50}
                    max={100}
                    step={1}
                    value={[approvalThreshold]}
                    onValueChange={(value) => setApprovalThreshold(value[0])}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Đa số đơn giản (50%)</span>
                    <span>Đồng thuận (100%)</span>
                  </div>
                </div>

                {proposalEligibility === "min-contribution" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="min-contribution" className="flex items-center gap-2">
                        Đóng góp tối thiểu (ADA)
                        <Tooltip content="Số ADA tối thiểu cần đóng góp để tạo đề xuất">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Tooltip>
                      </Label>
                    </div>
                    <Input
                      id="min-contribution"
                      type="number"
                      min={0}
                      value={minContribution}
                      onChange={(e) => setMinContribution(Number(e.target.value))}
                      className="glass-card"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cooldown-period" className="flex items-center gap-2">
                      Thời gian chờ giữa các đề xuất (ngày)
                      <Tooltip content="Số ngày một thành viên phải đợi trước khi tạo đề xuất mới">
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </Tooltip>
                    </Label>
                  </div>
                  <Input
                    id="cooldown-period"
                    type="number"
                    min={0}
                    max={30}
                    value={cooldownPeriod}
                    onChange={(e) => setCooldownPeriod(Number(e.target.value))}
                    className="glass-card"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentTab("basic")}>
                  Quay lại
                </Button>
                <Button variant="gradient" onClick={() => setCurrentTab("visibility")}>
                  Tiếp tục
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="visibility">
            <Card glass gradient>
              <CardHeader>
                <CardTitle>Quyền truy cập</CardTitle>
                <CardDescription>Thiết lập quyền truy cập và tham gia quỹ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="visibility" className="flex items-center gap-2">
                        Hiển thị công khai
                        <Tooltip content="Cho phép người khác tìm thấy quỹ này trong danh sách công khai">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Tooltip>
                      </Label>
                    </div>
                    <Switch
                      id="visibility"
                      checked={visibility === "public"}
                      onCheckedChange={(checked) => setVisibility(checked ? "public" : "private")}
                    />
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-white/10">
                    {visibility === "public" ? (
                      <>
                        <Eye className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Quỹ công khai</p>
                          <p className="text-sm text-muted-foreground">
                            Quỹ này sẽ hiển thị trong danh sách công khai và người dùng có thể yêu cầu tham gia
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Quỹ riêng tư</p>
                          <p className="text-sm text-muted-foreground">
                            Quỹ này sẽ không hiển thị công khai, chỉ những người được mời mới có thể tham gia
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {visibility === "public" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="min-join-contribution" className="flex items-center gap-2">
                        Đóng góp tối thiểu để tham gia (ADA)
                        <Tooltip content="Số ADA tối thiểu cần đóng góp để tham gia quỹ">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Tooltip>
                      </Label>
                    </div>
                    <Input
                      id="min-join-contribution"
                      type="number"
                      min={0}
                      value={minContribution}
                      onChange={(e) => setMinContribution(Number(e.target.value))}
                      className="glass-card"
                    />
                    <p className="text-sm text-muted-foreground">
                      {minContribution > 0
                        ? `Người dùng sẽ cần đóng góp ít nhất ${minContribution} ADA để tham gia quỹ này`
                        : "Bất kỳ ai cũng có thể tham gia quỹ này mà không cần đóng góp ban đầu"}
                    </p>
                  </div>
                )}

                <div className="rounded-lg border border-primary/20 p-4 bg-primary/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Tóm tắt cài đặt quản trị</h3>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center justify-between">
                      <span className="text-muted-foreground">Cơ chế bỏ phiếu:</span>
                      <span className="font-medium">
                        {votingMechanism === "per-capita" && "Bình đẳng (1 người = 1 phiếu)"}
                        {votingMechanism === "contribution-percentage" && "Theo tỷ lệ đóng góp"}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-muted-foreground">Điều kiện tạo đề xuất:</span>
                      <span className="font-medium">
                        {proposalEligibility === "all-members" && "Tất cả thành viên"}
                        {proposalEligibility === "min-contribution" && "Đóng góp tối thiểu"}
                        {proposalEligibility === "founding-members" && "Thành viên sáng lập"}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-muted-foreground">Ngưỡng phê duyệt:</span>
                      <span className="font-medium">{approvalThreshold}%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-muted-foreground">Thời gian chờ giữa các đề xuất:</span>
                      <span className="font-medium">{cooldownPeriod} ngày</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-muted-foreground">Hiển thị:</span>
                      <span className="font-medium">{visibility === "public" ? "Công khai" : "Riêng tư"}</span>
                    </li>
                    {(proposalEligibility === "min-contribution" || visibility === "public") && minContribution > 0 && (
                      <li className="flex items-center justify-between">
                        <span className="text-muted-foreground">Đóng góp tối thiểu:</span>
                        <span className="font-medium">{minContribution} ADA</span>
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentTab("governance")}>
                  Quay lại
                </Button>
                <Button type="submit" variant="gradient" disabled = {!address || !name || !description || !shortDescription}>
                  Tạo quỹ
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
    </TooltipProvider>
  )
}
