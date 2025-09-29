'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface VisitorSourcesChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }[];
  };
}

export default function VisitorSourcesChart({ data }: VisitorSourcesChartProps) {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        borderColor: '#3B82F6',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        padding: 12,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(59, 130, 246, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
          padding: 8,
          stepSize: 1,
        },
        border: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
          padding: 8,
        },
        border: {
          display: false,
        },
      },
    },
  };

  // Calculate statistics
  const dataValues = data?.datasets?.[0]?.data || [];
  const total = dataValues.reduce((sum, value) => sum + value, 0);
  const maxValue = Math.max(...dataValues, 0);

  return (
    <div className="bg-gradient-to-br from-white to-purple-50/30 p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-purple-200 transition-all duration-300 group h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-900 transition-colors">
              Visitor Sources
            </h3>
            <p className="text-sm text-gray-500">Traffic by source</p>
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="flex-1 min-h-80 relative">
        {data && data.labels && data.labels.length > 0 && data.datasets && data.datasets[0] && data.datasets[0].data ? (
          <div className="h-80">
            <Bar 
              key={`sources-chart-${JSON.stringify(data.datasets[0].data)}`}
              data={data} 
              options={chartOptions}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-80 text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">No Data Available</h4>
              <p className="text-sm">Source data will appear here once visitors start using your system.</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Statistics */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3 bg-purple-50 rounded-lg px-4 py-2 hover:bg-purple-100 transition-colors">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Total {total}</span>
          </div>
          <div className="flex items-center space-x-3 bg-green-50 rounded-lg px-4 py-2 hover:bg-green-100 transition-colors">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Peak {maxValue}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
