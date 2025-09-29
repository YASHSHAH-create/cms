'use client';

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DailyVisitorsChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }[];
  };
}

export default function DailyVisitorsChart({ data }: DailyVisitorsChartProps) {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Debug logging
  console.log('📊 DailyVisitorsChart received data:', data);

  const handleTimeRangeChange = (newTimeRange: 'daily' | 'weekly' | 'monthly') => {
    setTimeRange(newTimeRange);
  };

  // Simple data transformation - just return the data as is for now
  const chartData = data || {
    labels: [],
    datasets: [{
      label: 'Daily Visitors',
      data: [],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
    }]
  };

  console.log('📊 DailyVisitorsChart chartData:', chartData);


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
        displayColors: false,
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
        type: 'category' as const,
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
  const dataValues = chartData.datasets[0]?.data || [];
  const total = dataValues.reduce((sum, value) => sum + value, 0);
  const average = dataValues.length > 0 ? (total / dataValues.length).toFixed(1) : 0;

  return (
    <div className="bg-gradient-to-br from-white to-blue-50/30 p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300 group h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
              Daily Visitors
            </h3>
            <p className="text-sm text-gray-500">Last 7 days</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">View:</span>
          <select
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value as 'daily' | 'weekly' | 'monthly')}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1 bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>
      
      {/* Chart */}
      <div className="flex-1 min-h-80 relative">
        {chartData && chartData.labels && chartData.labels.length > 0 && chartData.datasets && chartData.datasets[0] && chartData.datasets[0].data && chartData.datasets[0].data.length > 0 ? (
          <div className="h-80">
            <Line 
              key={`chart-${timeRange}-${JSON.stringify(chartData.datasets[0].data)}`}
              data={chartData} 
              options={chartOptions}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-80 text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">No Data Available</h4>
              <p className="text-sm">Chart data will appear here once visitors start using your system.</p>
              <div className="mt-4 text-xs text-gray-400">
                <p>Debug: Data received: {JSON.stringify(chartData)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Statistics */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3 bg-blue-50 rounded-lg px-4 py-2 hover:bg-blue-100 transition-colors">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Total {total}</span>
          </div>
          <div className="flex items-center space-x-3 bg-green-50 rounded-lg px-4 py-2 hover:bg-green-100 transition-colors">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Average {average}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">Last 7 days</span>
          </div>
        </div>
      </div>
    </div>
  );
}