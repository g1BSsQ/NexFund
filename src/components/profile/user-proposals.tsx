import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

type ProposalStatus = "approved" | "rejected" | "pending";

interface Proposal {
  id: string;
  title: string;
  description: string;
  fund: {
    id: string;
    name: string;
  };
  status: ProposalStatus;
  date: string;
}

const proposals: Proposal[] = [
  {
    id: "prop-1",
    title: "Phát triển ứng dụng di động tương thích",
    description: "Tạo một ứng dụng di động để cộng đồng có thể tương tác với quỹ một cách dễ dàng.",
    fund: {
      id: "community-development",
      name: "Quỹ phát triển cộng đồng"
    },
    status: "approved",
    date: "2025-03-15"
  },
  {
    id: "prop-6",
    title: "Xây dựng cầu nối liên chuỗi",
    description: "Phát triển giải pháp giao tiếp giữa các blockchain khác nhau cho ứng dụng.",
    fund: {
      id: "innovation",
      name: "Quỹ đổi mới sáng tạo"
    },
    status: "approved",
    date: "2025-03-12"
  },
  {
    id: "prop-2",
    title: "Tổ chức hội thảo trực tuyến về DeFi",
    description: "Tổ chức một chuỗi hội thảo giáo dục về tài chính phi tập trung.",
    fund: {
      id: "community-development",
      name: "Quỹ phát triển cộng đồng"
    },
    status: "pending",
    date: "2025-03-28"
  }
];

export function UserProposals() {
  return (
    <div className="space-y-4">
      {proposals.map((proposal) => (
        <div key={proposal.id} className="border rounded-lg p-4 bg-white dark:bg-gray-950">
          <div className="flex items-center gap-2 mb-2">
            <StatusIcon status={proposal.status} />
            <h3 className="font-medium">{proposal.title}</h3>
            <StatusBadge status={proposal.status} />
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">{proposal.description}</p>
          
          <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
            <Badge variant="outline">{proposal.fund.name}</Badge>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{new Date(proposal.date).toLocaleDateString('vi-VN')}</span>
              <Link href={`/funds/${proposal.fund.id}/proposals/${proposal.id}`}>
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