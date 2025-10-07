import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface DonutGaugeProps {
  value: number;
  label?: string;
  height?: number;
}

export default function DonutGauge({ value, label = "Conversion Rate", height = 200 }: DonutGaugeProps) {
  // Clamp value to 0-100 range and guard against NaN
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const normalizedValue = pct / 100;
  
  const data = [
    { name: 'Converted', value: normalizedValue, color: '#22c55e' },
    { name: 'Not Converted', value: 1 - normalizedValue, color: '#e5e7eb' }
  ];

  return (
    <div className="w-full">
      <div style={{ height: height + 40 }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={95}
              startAngle={90}
              endAngle={450}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
              {pct}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Converted
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          <span className="text-gray-700 dark:text-gray-300 font-medium">Converted</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 mr-2"></div>
          <span className="text-gray-700 dark:text-gray-300 font-medium">Remaining</span>
        </div>
      </div>
    </div>
  );
}
