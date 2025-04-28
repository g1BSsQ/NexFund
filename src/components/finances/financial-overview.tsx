"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'T1', value: 1200 },
  { name: 'T2', value: 1350 },
  { name: 'T3', value: 1450 },
  { name: 'T4', value: 1320 },
  { name: 'T5', value: 1500 },
  { name: 'T6', value: 1750 },
  { name: 'T7', value: 1800 },
  { name: 'T8', value: 2000 },
  { name: 'T9', value: 2150 },
  { name: 'T10', value: 2300 },
  { name: 'T11', value: 2450 },
  { name: 'T12', value: 2456 },
];

export function FinancialOverview() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}