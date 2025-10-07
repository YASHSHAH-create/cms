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

  const hasData = data.length > 0;

  if (!hasData) {
    return (
      <div className="w-full min-h-[220px] flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-sm font-medium">No visitor activity in last 7 days</p>
          <p className="text-xs text-gray-400 mt-1">Data will appear here once visitors start using the system</p>
        </div>
      </div>
    );
  }

  // Calculate max value for better chart scaling
  const maxVisitors = Math.max(...data.map(item => item.visitors), 10);
  const yAxisMax = Math.ceil(maxVisitors * 1.2);

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            domain={[0, yAxisMax]}
            tickFormatter={(value) => Number.isInteger(value) ? value.toString() : ''}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
              color: '#fff'
            }}
            labelStyle={{ color: '#f3f4f6', fontWeight: 'bold', marginBottom: '4px' }}
            itemStyle={{ color: '#93c5fd' }}
          />
          <Line
            type="monotone"
            dataKey="visitors"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
