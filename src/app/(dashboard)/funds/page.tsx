"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FundsList } from "@/components/funds/funds-list";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FundsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Danh sách quỹ công khai</h1>
        <Button className="gap-2" onClick={() => router.push("/funds/create")}>
          <Plus className="h-4 w-4" />
          Tạo quỹ mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tất cả quỹ</CardTitle>
          <div className="mt-2 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm quỹ..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <FundsList searchQuery={searchQuery} showFilters={true} />
        </CardContent>
      </Card>
    </div>
  );
}