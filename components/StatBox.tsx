import React from 'react';

interface StatBoxProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  change?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatBox({ title, value, icon, color, change }: StatBoxProps) {
  // Color classes not used in this component

  const iconColorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-2.5 hover:shadow-md transition-all hover:-translate-y-0.5 h-full">
      <div className="flex items-center">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColorClasses[color].bg}`}>
          <span className={`text-base ${iconColorClasses[color].text}`}>{icon}</span>
        </div>
        <div className="ml-2">
          <h3 className="text-xs font-medium text-gray-500">{title}</h3>
          <p className="text-base sm:text-lg font-bold text-gray-900">{(value || 0).toLocaleString()}</p>
        </div>
      </div>
      
      {change && (
        <div className="mt-1.5 flex items-center">
          <div className={`text-xs px-1 py-0.5 rounded ${change.isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {change.isPositive ? '+' : ''}{change.value}%
          </div>
          <span className="text-xs text-gray-500 ml-1 hidden sm:inline">from last month</span>
        </div>
      )}
    </div>
  );
}
