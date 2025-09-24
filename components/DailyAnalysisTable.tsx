import React from 'react';

interface DailyAnalysisData {
  date: string;
  visitors: number;
  enquiries: number;
  messages: number;
  conversionRate: number;
}

interface DailyAnalysisTableProps {
  data: DailyAnalysisData[];
}

export default function DailyAnalysisTable({ data }: DailyAnalysisTableProps) {
  const getConversionRateColor = (rate: number) => {
    if (rate >= 20) return 'bg-green-100 text-green-800';
    if (rate >= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Analysis</h3>
          <div className="text-center text-gray-500 py-8">
            No data available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Analysis</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visitors
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enquiries
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Messages
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((item, index) => (
                <tr
                  key={index}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="py-2 px-3">
                    <span className="font-medium text-gray-900 text-sm">{item.date || 'N/A'}</span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="text-gray-900 text-sm">{item.visitors || 0}</span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="text-gray-900 text-sm">{item.enquiries || 0}</span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="text-gray-900 text-sm">{item.messages || 0}</span>
                  </td>
                  <td className="py-2 px-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getConversionRateColor(item.conversionRate || 0)}`}>
                      {(item.conversionRate || 0).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}