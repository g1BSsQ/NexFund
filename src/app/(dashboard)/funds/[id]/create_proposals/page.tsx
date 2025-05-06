"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@meshsdk/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { id, vi } from "date-fns/locale";
import { applyParamsToScript, deserializeAddress, serializePlutusScript, stringToHex } from "@meshsdk/core";
import { readValidator } from "@/cardano/adapter";
import { ENDPOINTS } from "@/lib/config";

interface Fund {
  id: string;
  name: string;
  description: string;
  current: number;
  total: number;
  category: string;
  approvalThreshold: number;
}

export default function CreateProposalPage() {
  const router = useRouter();
  const params = useParams();
  const fundId = params.id as string;
  const { toast } = useToast();
  const { wallet, connect, address } = useWallet();

  // State for fund details
  const [fund, setFund] = useState<Fund | null>(null);
  const [loadingFund, setLoadingFund] = useState(true);
  const [errorFund, setErrorFund] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  );
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch fund details on mount
  useEffect(() => {
    async function loadFund() {
      try {
        const res = await fetch(ENDPOINTS.GET_FUND_DETAILS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fundId }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setFund({
          id: data.id,
          name: data.name,
          description: data.description,
          current: data.current,
          total: data.total,
          category: data.category,
          approvalThreshold: data.approvalThreshold,
        });
      } catch (err: any) {
        console.error("Error fetching fund:", err);
        setErrorFund(err.message || "Không thể kết nối API");
      } finally {
        setLoadingFund(false);
      }
    }
    loadFund();
  }, [fundId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) {
      await connect();
      return;
    }
    if (!title || !description || !amount || !deadline) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ thông tin đề xuất",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const pubkeyAdmin = deserializeAddress(address).pubKeyHash;
      const voteCompileCode = readValidator("vote.vote.spend");
      const deadlineStr: string = deadline!
  .toISOString()
  .split("T")[0];
      const voteScriptCbor = applyParamsToScript(
        voteCompileCode,
        [stringToHex(fundId), pubkeyAdmin, stringToHex(title), amount, deadlineStr],
      );
      console.log(fundId, address, title, amount, deadlineStr);
      const scriptAddr = serializePlutusScript(
        { code: voteScriptCbor, version: "V3" },
        undefined,
        0,
      ).address;

      const formData = new FormData();
      formData.append("id", scriptAddr);
      formData.append("fundId", fundId);
      formData.append("creator", address);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("details", details);
      formData.append("amount", amount);
      formData.append("deadline", deadline.toISOString().split("T")[0]);
      attachments.forEach((file) => formData.append("attachments[]", file));

      const res = await fetch(ENDPOINTS.CREATE_PROPOSAL, {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      toast({
        title: "Đã tạo đề xuất",
        description: "Đề xuất của bạn đã được gửi thành công",
      });
      router.push(`/funds/${fundId}`);
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể tạo đề xuất",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingFund) {
    return <div className="p-6 text-center">Đang tải quỹ…</div>;
  }
  if (errorFund || !fund) {
    return (
      <div className="p-6 text-center text-red-500">
        {errorFund || "Không tìm thấy quỹ"}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => router.push(`/funds/${fundId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Tạo đề xuất mới</h1>
          <p className="text-muted-foreground">
            Cho quỹ <strong>{fund.name}</strong>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-3">
        {/* Main form */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin đề xuất</CardTitle>
              <CardDescription>Nhập đầy đủ thông tin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề</Label>
                <Input
                  id="title"
                  placeholder="Tiêu đề đề xuất"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  placeholder="Chi tiết đề xuất"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              {/* Details */}
              <div className="space-y-2">
                <Label htmlFor="details">Chi tiết đề xuất</Label>
                <Textarea
                  id="details"
                  placeholder="Cung cấp thông tin bổ sung như các bước thực hiện cụ thể, nguồn lực cần thiết, hoặc các mốc thời gian chi tiết..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>
              {/* Amount & Category */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Số tiền (ADA)</Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      min="0"
                      step="0.01"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Danh mục</Label>
                  <Select
                    value={category}
                    onValueChange={setCategory}
                    required
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="education">Thử nghiệm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Deadline */}
              <div className="space-y-2">
                <Label htmlFor="deadline">Thời hạn</Label>
                <DatePicker
                  date={deadline}
                  onSelect={setDeadline}
                  placeholder="Chọn thời hạn"
                />
                <p className="text-xs text-muted-foreground">
                  Thời hạn tối đa là 90 ngày kể từ ngày hiện tại
                </p>
              </div>
              {/* Attachments */}
              <div className="space-y-2">
                <Label htmlFor="attachments">Tệp đính kèm</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    onChange={(e) =>
                      setAttachments(
                        e.target.files ? Array.from(e.target.files) : []
                      )
                    }
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("attachments")?.click()
                    }
                  >
                    <FileText className="mr-2 inline-block" /> Chọn tệp
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {attachments.length
                      ? `${attachments.length} tệp`
                      : "Chưa có tệp"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  PDF/DOC/DOCX/XLSX/PNG/JPG (≤10 MB)
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/funds/${fundId}`)}
              >
                Hủy
              </Button>
              <Button type="submit" className="ml-4" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi…
                  </>
                ) : (
                  "Gửi đề xuất"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Fund Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin quỹ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-medium">{fund.name}</p>
              <p className="text-sm text-muted-foreground">
                {fund.description}
              </p>
              <div className="flex justify-between text-sm">
                <span>Số dư hiện tại:</span>
                <span>{fund.current} ADA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tổng đóng góp:</span>
                <span>{fund.total} ADA</span>
              </div>
            </CardContent>
          </Card>

          {/* Guidance Card */}
          <Card glass hover className="relative overflow-hidden">
            <CardHeader>
              <CardTitle>Hướng dẫn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Tiêu chí đề xuất</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                  <li>Đề xuất phải phù hợp với mục tiêu của quỹ</li>
                  <li>Mô tả chi tiết và rõ ràng về kế hoạch thực hiện</li>
                  <li>Số tiền yêu cầu phải hợp lý và được giải trình cụ thể</li>
                  <li>Thời hạn thực hiện không quá 90 ngày</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Quy trình xét duyệt</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                  <li>Đề xuất sẽ được đăng công khai để các thành viên bỏ phiếu</li>
                  <li>Thời gian bỏ phiếu kéo dài 7 ngày</li>
                  <li>
                    Đề xuất cần đạt tối thiểu <strong>{fund.approvalThreshold}%</strong> phiếu bầu để được phê duyệt
                  </li>
                  <li>Quá trình bỏ phiếu được cập nhật liên tục và công khai</li>
                  <li>Kết quả bỏ phiếu sẽ được cố định ngay sau ngày hạn chót</li>
                </ul>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-primary" />
          </Card>
        </div>
      </form>
    </div>
  );
}