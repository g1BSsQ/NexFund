"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Transaction = {
  id: string;
  type: "in" | "out";
  amount: number;
  fee: number;
  date: Date;
  status: "completed";
  description: string;
  address: string;
};

type FinancialOverviewProps = {
  balance: number; // Tổng tài sản hiện tại (Lovelace)
  transactions: Transaction[]; // Danh sách 100 giao dịch mới nhất
};

export function FinancialOverview({ balance, transactions }: FinancialOverviewProps) {
  // Lấy thời điểm hiện tại
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-11 (Th1-Th12)
  const currentYear = currentDate.getFullYear();

  // Khởi tạo mảng dữ liệu cho các tháng từ Th1 đến tháng hiện tại
  const monthlyBalance: { name: string; value: number }[] = Array.from({ length: currentMonth + 1 }, (_, i) => ({
    name: `Th${i + 1}`,
    value: 0,
  }));

  // Sắp xếp giao dịch theo ngày tăng dần
  const sortedTransactions = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Tính tài sản tại từng tháng
  let currentBalance = balance; // Bắt đầu từ balance tại thời điểm hiện tại

  // Tính ngược từ thời điểm hiện tại về đầu năm
  for (let i = sortedTransactions.length - 1; i >= 0; i--) {
    const tx = sortedTransactions[i];
    const txYear = tx.date.getFullYear();

    if (txYear === currentYear && tx.date <= currentDate) { // Chỉ xử lý giao dịch trong năm hiện tại và trước giờ
      if (tx.type === "in") {
        currentBalance -= tx.amount; // Trừ đi số tiền nhận
      } else {
        currentBalance += tx.amount; // Cộng lại số tiền gửi
      }
    }
  }

  // Tài sản tại đầu năm
  let balanceAtStartOfYear = currentBalance;

  // Tính lại tài sản tại từng tháng
  currentBalance = balanceAtStartOfYear;
  for (let month = 0; month <= currentMonth; month++) {
    // Gán giá trị tài sản đầu tháng (làm tròn đến 2 chữ số sau dấu phẩy)
    monthlyBalance[month].value = Number((currentBalance / 1000000).toFixed(2));

    // Xử lý giao dịch trong tháng hiện tại
    const monthTransactions = sortedTransactions.filter((tx) => {
      return tx.date.getFullYear() === currentYear && tx.date.getMonth() === month;
    });

    for (const tx of monthTransactions) {
      if (tx.date <= currentDate) { // Chỉ xử lý giao dịch trước hoặc tại hiện tại
        if (tx.type === "in") {
          currentBalance += tx.amount;
        } else {
          currentBalance -= tx.amount;
        }
      }
    }

    // Cập nhật giá trị cho tháng tiếp theo (nếu có)
    if (month < currentMonth) {
      monthlyBalance[month + 1].value = Number((currentBalance / 1000000).toFixed(2));
    }
  }

  return (
    <div className="h-[350px] w-full p-4 bg-white rounded-lg shadow">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={monthlyBalance}
          margin={{
            top: 10,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
          <XAxis dataKey="name" tick={{ fill: "#666", fontSize: 12 }} />
          <YAxis
            tickFormatter={(value: number) => `${value}`}
            tick={{ fill: "#666", fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number) => `${value.toFixed(2)} ADA`}
            contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: "4px" }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--chart-1))"
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--chart-1))" }}
            activeDot={{ r: 6 }}
            fillOpacity={1}
            fill="url(#colorValue)"
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 