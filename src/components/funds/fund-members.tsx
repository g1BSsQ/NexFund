import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Member {
  id: string;
  name: string;
  address: string;
  joinDate: string;
  contributions: number;
  role: "admin" | "member" | "contributor";
  votes: number;
}

const members: Record<string, Member[]> = {
  "community-development": [
    {
      id: "member-1",
      name: "Nguyễn Văn A",
      address: "0x8731d54E9D02c286767d56ac03e8037C07e01e98",
      joinDate: "2025-01-15",
      contributions: 150,
      role: "admin",
      votes: 48
    },
    {
      id: "member-2",
      name: "Trần Thị B",
      address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      joinDate: "2025-01-16",
      contributions: 125,
      role: "contributor",
      votes: 36
    },
    {
      id: "member-3",
      name: "Lê Văn C",
      address: "0x1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P7q8R9s0T",
      joinDate: "2025-01-18",
      contributions: 75,
      role: "member",
      votes: 25
    },
    {
      id: "member-4",
      name: "Phạm Thị D",
      address: "0xa1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0",
      joinDate: "2025-01-22",
      contributions: 85,
      role: "contributor",
      votes: 32
    },
    {
      id: "member-5",
      name: "Hoàng Văn E",
      address: "0xE5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v2W3",
      joinDate: "2025-01-25",
      contributions: 60,
      role: "member",
      votes: 21
    }
  ],
  "innovation": [
    {
      id: "member-6",
      name: "Trần Thị B",
      address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      joinDate: "2025-02-10",
      contributions: 200,
      role: "admin",
      votes: 52
    },
    {
      id: "member-7",
      name: "Nguyễn Văn A",
      address: "0x8731d54E9D02c286767d56ac03e8037C07e01e98",
      joinDate: "2025-02-12",
      contributions: 175,
      role: "contributor",
      votes: 45
    },
    {
      id: "member-8",
      name: "Vũ Thị F",
      address: "0xF1g2H3i4J5k6L7m8N9o0P1q2R3s4T5u6V7w8X9",
      joinDate: "2025-02-15",
      contributions: 150,
      role: "contributor",
      votes: 38
    },
    {
      id: "member-9",
      name: "Đỗ Văn G",
      address: "0xG1h2I3j4K5l6M7n8O9p0Q1r2S3t4U5v6W7x8Y9",
      joinDate: "2025-02-18",
      contributions: 120,
      role: "member",
      votes: 30
    },
    {
      id: "member-10",
      name: "Ngô Thị H",
      address: "0xH1i2J3k4L5m6N7o8P9q0R1s2T3u4V5w6X7y8Z9",
      joinDate: "2025-02-20",
      contributions: 90,
      role: "member",
      votes: 25
    }
  ]
};

export function FundMembers({ fundId }: { fundId: string }) {
  const fundMembers = members[fundId] || [];

  if (fundMembers.length === 0) {
    return <div className="text-center py-10">Không có thành viên nào.</div>;
  }

  return (
    <div className="space-y-4">
      {fundMembers.map((member) => (
        <div key={member.id} className="flex items-center justify-between p-4 border-b last:border-0">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="/avatar.png" />
              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{member.name}</p>
                <RoleBadge role={member.role} />
              </div>
              <p className="text-xs text-muted-foreground">{member.address.slice(0, 6)}...{member.address.slice(-4)}</p>
            </div>
          </div>
          <div className="text-sm text-right">
            <p><span className="font-medium">{member.contributions}</span> ADA</p>
            <p className="text-xs text-muted-foreground">{member.votes} phiếu bầu</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RoleBadge({ role }: { role: "admin" | "member" | "contributor" }) {
  return (
    <Badge variant="outline" className={
      role === "admin" 
        ? "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-800"
        : role === "contributor"
          ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800"
          : "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
    }>
      {role === "admin" && "Quản trị viên"}
      {role === "contributor" && "Đóng góp"}
      {role === "member" && "Thành viên"}
    </Badge>
  );
}