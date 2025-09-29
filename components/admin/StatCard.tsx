import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  delta?: {
    value: number;
    direction: "up" | "down";
  };
  icon?: React.ReactNode;
  tooltip?: string;
}

export default function StatCard({ 
  title, 
  value, 
  delta, 
  icon, 
  tooltip 
}: StatCardProps) {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const formatDelta = (delta: { value: number; direction: "up" | "down" }): string => {
    const sign = delta.direction === 'up' ? '+' : '-';
    return `${sign}${Math.abs(delta.value)}%`;
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
      title={tooltip}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-600">{title}</h3>
        {icon && (
          <div className="text-slate-400">
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-baseline justify-between">
        <div className="text-3xl font-semibold text-slate-900">
          {formatValue(value)}
        </div>
        
        {delta && (
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            delta.direction === 'up' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <span className="mr-1">
              {delta.direction === 'up' ? '↗' : '↘'}
            </span>
            {formatDelta(delta)}
          </div>
        )}
      </div>
    </div>
  );
}
