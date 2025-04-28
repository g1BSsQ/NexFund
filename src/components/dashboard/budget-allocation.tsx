"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Phát triển', value: 45, color: '#3B82F6' },
  { name: 'Marketing', value: 25, color: '#10B981' },
  { name: 'Hoạt động', value: 20, color: '#F97316' },
  { name: 'Trả thưởng', value: 10, color: '#8B5CF6' },
];

const COLORS = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6'];

export function BudgetAllocation() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}