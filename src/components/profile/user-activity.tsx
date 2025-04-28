"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'T1', votes: 4, proposals: 1, contributions: 2 },
  { name: 'T2', votes: 5, proposals: 2, contributions: 3 },
  { name: 'T3', votes: 7, proposals: 1, contributions: 4 },
  { name: 'T4', votes: 3, proposals: 0, contributions: 2 },
  { name: 'T5', votes: 6, proposals: 2, contributions: 3 },
  { name: 'T6', votes: 10, proposals: 2, contributions: 5 },
];

export function UserActivity() {
  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="votes" stackId="a" fill="hsl(var(--chart-1))" name="Bỏ phiếu" />
          <Bar dataKey="proposals" stackId="a" fill="hsl(var(--chart-2))" name="Đề xuất" />
          <Bar dataKey="contributions" stackId="a" fill="hsl(var(--chart-3))" name="Đóng góp" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}