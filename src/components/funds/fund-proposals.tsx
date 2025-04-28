import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, ThumbsUp, ThumbsDown, ArrowRight } from "lucide-react";
import Link from "next/link";

type ProposalStatus = "approved" | "rejected" | "pending";

interface Proposal {
  id: string;
  title: string;
  description: string;
  votes: {
    for: number;
    against: number;
  };
  status: ProposalStatus;
  date: string;
}

const proposals: Record<string, Proposal[]> = {
  "community-development": [
    {
      id: "prop-1",
      title: "Phát triển ứng dụng di động tương thích",
      description: "Tạo một ứng dụng di động để cộng đồng có thể tương tác với quỹ một cách dễ dàng.",
      votes: { for: 157, against: 43 },
      status: "approved",
      date: "2025-03-15"
    },
    {
      id: "prop-2",
      title: "Tổ chức hội thảo trực tuyến về DeFi",
      description: "Tổ chức một chuỗi hội thảo giáo dục về tài chính phi tập trung.",
      votes: { for: 89, against: 12 },
      status: "pending",
      date: "2025-03-28"
    },
    {
      id: "prop-3",
      title: "Phân bổ ngân sách cho nhóm phát triển",
      description: "Phân bổ 50 ADA cho nhóm phát triển để xây dựng các tính năng mới.",
      votes: { for: 132, against: 65 },
      status: "approved",
      date: "2025-03-10"
    },
    {
      id: "prop-4",
      title: "Hợp tác với đối tác chiến lược",
      description: "Xây dựng quan hệ đối tác với nền tảng DEX để mở rộng đến khách hàng mới.",
      votes: { for: 76, against: 97 },
      status: "rejected",
      date: "2025-03-05"
    }
  ],
  "innovation": [
    {
      id: "prop-5",
      title: "Tài trợ dự án AI cho blockchain",
      description: "Tài trợ dự án nghiên cứu kết hợp AI và blockchain để tối ưu hóa giao dịch.",
      votes: { for: 178, against: 23 },
      status: "approved",
      date: "2025-03-20"
    },
    {
      id: "prop-6",
      title: "Xây dựng cầu nối liên chuỗi",
      description: "Phát triển giải pháp giao tiếp giữa các blockchain khác nhau cho ứng dụng.",
      votes: { for: 145, against: 34 },
      status: "approved",
      date: "2025-03-12"
    },
    {
      id: "prop-7",
      title: "Tài trợ hackathon đổi mới",
      description: "Tổ chức cuộc thi hack để thúc đẩy các giải pháp sáng tạo và thu hút tài năng mới.",
      votes: { for: 112, against: 15 },
      status: "pending",
      date: "2025-03-25"
    }
  ]
};

export function FundProposals({ fundId }: { fundId: string }) {
  const fundProposals = proposals[fundId] || [];

  if (fundProposals.length === 0) {
    return <div className="text-center py-10">Không có đề xuất nào.</div>;
  }

  return (
    <div className="space-y-4">
      {fundProposals.map((proposal) => (
        <div key={proposal.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <StatusIcon status={proposal.status} />
                <h3 className="font-medium">{proposal.title}</h3>
                <StatusBadge status={proposal.status} />
              </div>
              <p className="text-sm text-muted-foreground">{proposal.description}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center text-sm">
                <ThumbsUp className="h-4 w-4 mr-1 text-green-500" />
                <span>{proposal.votes.for}</span>
              </div>
              <div className="flex items-center text-sm">
                <ThumbsDown className="h-4 w-4 mr-1 text-red-500" />
                <span>{proposal.votes.against}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{new Date(proposal.date).toLocaleDateString('vi-VN')}</span>
              <Link href={`/funds/${fundId}/proposals/${proposal.id}`}>
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  Chi tiết
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusIcon({ status }: { status: ProposalStatus }) {
  switch (status) {
    case "approved":
      return <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;
    case "pending":
      return <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />;
  }
}

function StatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <Badge variant="outline" className={
      status === "approved" 
        ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800"
        : status === "rejected"
          ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800"
          : "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-800"
    }>
      {status === "approved" && "Đã duyệt"}
      {status === "rejected" && "Từ chối"}
      {status === "pending" && "Đang chờ"}
    </Badge>
  );
}