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
    { name: 'Converted', value: normalizedValue, color: '#64aa53' },
    { name: 'Not Converted', value: 1 - normalizedValue, color: '#e2e8f0' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">{label}</h3>
        <p className="text-sm text-slate-600">Overall performance</p>
      </div>
      
      <div style={{ height }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
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
            <div className="text-xl font-bold text-slate-900">
              {pct}%
            </div>
            <div className="text-xs text-slate-500">
              converted
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-center space-x-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          <span className="text-slate-600">Converted</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-slate-200 mr-2"></div>
          <span className="text-slate-600">Not Converted</span>
        </div>
      </div>
    </div>
  );
}
