"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'T1', votes: 0, proposals: 0, contributions: 0 },
  { name: 'T2', votes: 0, proposals: 0, contributions: 0 },
  { name: 'T3', votes: 0, proposals: 0, contributions: 0 },
  { name: 'T4', votes: 0, proposals: 0, contributions: 0 },
  { name: 'T5', votes: 0, proposals: 0, contributions: 0 },
  { name: 'T6', votes: 0, proposals: 0, contributions: 0 },
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