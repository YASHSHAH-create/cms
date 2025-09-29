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
  // Format data for recharts with day names
  const chartData = data.map(item => {
    const date = new Date(item.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = date.getDate();
    return {
      ...item,
      date: `${dayName} ${dayNumber}`,
      fullDate: item.date
    };
  });

  const hasData = data.length > 0 && data.some(item => item.visitors > 0);

  if (!hasData) {
    return (
      <div className="w-full min-h-[220px] flex items-center justify-center text-slate-500">
        <div className="text-center">
          <div className="text-3xl mb-2">📊</div>
          <p className="text-sm">No visitor activity in last 7 days</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeOpacity={0.2} />
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
            domain={[0, 'dataMax+1']}
            tickFormatter={(value) => Number.isInteger(value) ? value.toString() : ''}
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
  );
}
