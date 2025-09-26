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
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-600',
          border: 'hover:border-blue-200'
        };
      case 'green':
        return {
          bg: 'bg-green-100',
          text: 'text-green-600',
          border: 'hover:border-green-200'
        };
      case 'orange':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-600',
          border: 'hover:border-orange-200'
        };
      case 'red':
        return {
          bg: 'bg-red-100',
          text: 'text-red-600',
          border: 'hover:border-red-200'
        };
      case 'purple':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-600',
          border: 'hover:border-purple-200'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-600',
          border: 'hover:border-gray-200'
        };
    }
  };

  const colorClasses = getColorClasses(color);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-all hover:-translate-y-0.5 h-full ${colorClasses.border}`}>
      <div className="flex items-center">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses.bg}`}>
          <span className={`text-lg ${colorClasses.text}`}>{icon}</span>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{(value || 0).toLocaleString()}</p>
        </div>
      </div>
      
      {change && (
        <div className="mt-3 flex items-center">
          <div className={`text-xs px-2 py-1 rounded-full font-medium ${change.isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {change.isPositive ? '↗' : '↘'} {Math.abs(change.value)}%
          </div>
          <span className="text-xs text-gray-500 ml-2">from last month</span>
        </div>
      )}
    </div>
  );
}
