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
  const conversionRate = visitors > 0 ? Math.round((leadsConverted / visitors) * 100) : 0;
  const remaining = 100 - conversionRate;

  const data = {
    labels: ['Leads Converted', 'Remaining'],
    datasets: [
      {
        data: [conversionRate, remaining],
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
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: { label: string; parsed: number }) {
            return `${context.label}: ${context.parsed}%`;
          },
        },
      },
    },
  };

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
            <div className="absolute inset-0 flex flex-col items-center justify-center">
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
          <div className="text-2xl font-bold text-green-600">{leadsConverted}</div>
          <div className="text-sm text-gray-600">Leads Converted</div>
        </div>
      </div>
    </div>
  );
}
