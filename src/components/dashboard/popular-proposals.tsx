import { CheckCircle2, XCircle, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type ProposalStatus = "approved" | "rejected" | "pending";

interface Proposal {
  id: string;
  title: string;
  votes: number;
  status: ProposalStatus;
}

const proposals: Proposal[] = [
  { id: "1", title: "Phát triển ứng dụng di động tương thích", votes: 157, status: "approved" },
  { id: "2", title: "Tổ chức hội thảo trực tuyến về DeFi", votes: 89, status: "pending" },
  { id: "3", title: "Đầu tư vào nghiên cứu an ninh blockchain", votes: 132, status: "approved" },
  { id: "4", title: "Hợp tác với dự án DEX", votes: 76, status: "rejected" },
];

export function PopularProposals() {
  return (
    <div className="space-y-4">
      {proposals.map((proposal) => (
        <div key={proposal.id} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <StatusIcon status={proposal.status} />
              <p className="font-medium text-sm">{proposal.title}</p>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Users className="h-3 w-3 mr-1" />
              {proposal.votes} phiếu bầu
            </div>
          </div>
          <StatusBadge status={proposal.status} />
        </div>
      ))}
    </div>
  );
}

function StatusIcon({ status }: { status: ProposalStatus }) {
  switch (status) {
    case "approved":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "pending":
      return <Clock className="h-4 w-4 text-amber-500" />;
  }
}

function StatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <Badge className={cn(
      "text-xs",
      status === "approved" && "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300",
      status === "rejected" && "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-300",
      status === "pending" && "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-300"
    )}>
      {status === "approved" && "Đã duyệt"}
      {status === "rejected" && "Từ chối"}
      {status === "pending" && "Đang chờ"}
    </Badge>
  );
}