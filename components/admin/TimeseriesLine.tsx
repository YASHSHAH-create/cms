import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TimeseriesLineProps {
  data: Array<{
    date: string;
    visitors: number;
    enquiries?: number;
    messages?: number;
    conversions?: number;
  }>;
  height?: number;
}

export default function TimeseriesLine({ data, height = 300 }: TimeseriesLineProps) {
  // Format data for recharts
  const chartData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short' 
    })
  }));

  const hasData = data.length > 0 && data.some(item => item.visitors > 0);

  if (!hasData) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-center h-64 text-slate-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-sm">No data for selected range</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Daily Visitors</h3>
        <p className="text-sm text-slate-600">Last 7 days</p>
      </div>
      
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              labelStyle={{ color: '#334155' }}
            />
            <Line
              type="monotone"
              dataKey="visitors"
              stroke="#2d4891"
              strokeWidth={2}
              dot={{ fill: '#2d4891', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#2d4891', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
