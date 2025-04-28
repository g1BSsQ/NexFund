import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FundsList } from "@/components/funds/funds-list";
import { Plus, Search } from "lucide-react";

export default function FundsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Danh sách quỹ
        </h1>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Tạo quỹ mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tất cả quỹ</CardTitle>
          <div className="mt-2 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm kiếm quỹ..." className="pl-8" />
          </div>
        </CardHeader>
        <CardContent>
          <FundsList showFilters={true} />
        </CardContent>
      </Card>
    </div>
  );
}