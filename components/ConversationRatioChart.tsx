import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ConversationRatioChartProps {
  visitors: number;
  leadsConverted: number;
}

export default function ConversationRatioChart({ visitors, leadsConverted }: ConversationRatioChartProps) {
  // Fix the calculation - use actual numbers, not percentages for the chart data
  const conversionRate = visitors > 0 ? Math.round((leadsConverted / visitors) * 100) : 0;
  const remainingVisitors = Math.max(0, visitors - leadsConverted);
  
  // Handle edge cases
  const chartLeadsConverted = Math.max(0, leadsConverted);
  const chartRemainingVisitors = Math.max(0, remainingVisitors);
  
  console.log('📊 Conversion Rate Chart Data:', {
    visitors,
    leadsConverted: chartLeadsConverted,
    remainingVisitors: chartRemainingVisitors,
    conversionRate
  });

  const data = {
    labels: ['Leads Converted', 'Not Converted'],
    datasets: [
      {
        data: [chartLeadsConverted, chartRemainingVisitors],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // Green for converted
          'rgba(229, 231, 235, 0.8)', // Gray for remaining
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(229, 231, 235, 1)',
        ],
        borderWidth: 2,
        cutout: '70%',
        hoverBackgroundColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(229, 231, 235, 1)',
        ],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            weight: 'normal' as const,
          },
          color: '#6B7280',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        borderColor: '#34D399',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const percentage = visitors > 0 ? Math.round((value / visitors) * 100) : 0;
            return `${label}: ${value} visitors (${percentage}%)`;
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
    },
  };

  // Handle no data case
  if (visitors === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 group h-full flex flex-col">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Conversion Rate</h3>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p>No conversion data available</p>
            <p className="text-sm mt-1">Start getting visitors to see conversion metrics</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 group h-full flex flex-col">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Conversion Rate</h3>
      </div>
      
      <div className="relative flex-1 min-h-64 flex items-center justify-center">
        <Doughnut data={data} options={options} />
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-3xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">{conversionRate}%</div>
          <div className="text-sm text-gray-600">Conversion Rate</div>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors">
          <div className="text-2xl font-bold text-gray-900">{visitors}</div>
          <div className="text-sm text-gray-600">Total Visitors</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center hover:bg-green-100 transition-colors">
          <div className="text-2xl font-bold text-green-600">{chartLeadsConverted}</div>
          <div className="text-sm text-gray-600">Leads Converted</div>
        </div>
      </div>
    </div>
  );
}
