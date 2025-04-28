import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eye } from "lucide-react";
import Link from "next/link";

interface Fund {
  id: string;
  name: string;
  description: string;
  raised: number;
  goal: number;
  category: string;
  role: string;
}

const funds: Fund[] = [
  {
    id: "community-development",
    name: "Quỹ phát triển cộng đồng",
    description: "Tài trợ các dự án phát triển cộng đồng và giáo dục blockchain.",
    raised: 850,
    goal: 1000,
    category: "Cộng đồng",
    role: "Quản trị viên"
  },
  {
    id: "innovation",
    name: "Quỹ đổi mới sáng tạo",
    description: "Hỗ trợ các dự án khởi nghiệp và đổi mới công nghệ blockchain.",
    raised: 1250,
    goal: 2000,
    category: "Đổi mới",
    role: "Thành viên"
  }
];

export function UserFunds() {
  return (
    <div className="space-y-4">
      {funds.map((fund) => (
        <div key={fund.id} className="border rounded-lg p-4 bg-white dark:bg-gray-950">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-lg">{fund.name}</h3>
                <Badge>{fund.role}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{fund.description}</p>
            </div>
            <Link href={`/funds/${fund.id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                Chi tiết
              </Button>
            </Link>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Đã quyên góp: {fund.raised} ADA</span>
              <span>Mục tiêu: {fund.goal} ADA</span>
            </div>
            <Progress value={(fund.raised / fund.goal) * 100} className="h-2" />
          </div>
          
          <div className="flex flex-wrap items-center justify-between mt-4 gap-2">
            <Badge variant="secondary">{fund.category}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}