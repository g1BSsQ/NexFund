"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";

export default function CreateFundPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate fund creation
    setTimeout(() => {
      setLoading(false);
      router.push('/funds');
    }, 1000);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Tạo quỹ mới
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin quỹ</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tên quỹ</label>
                <Input placeholder="Nhập tên quỹ..." className="mt-1" />
              </div>
              
              <div>
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea placeholder="Mô tả về quỹ..." className="mt-1" />
              </div>
              
              <div>
                <label className="text-sm font-medium">Danh mục</label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="community">Cộng đồng</SelectItem>
                    <SelectItem value="innovation">Đổi mới</SelectItem>
                    <SelectItem value="education">Giáo dục</SelectItem>
                    <SelectItem value="research">Nghiên cứu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Mục tiêu gây quỹ (ADA)</label>
                <Input type="number" placeholder="0" className="mt-1" />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Đang tạo..." : "Tạo quỹ"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}