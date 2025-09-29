import React, { useState } from 'react';

interface VisitorData {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  enquiryDetails?: string;
  location?: string;
  createdAt: string;
}

interface EnquiryData {
  _id: string;
  subject?: string;
  message?: string;
  visitorName?: string;
  createdAt: string;
}

interface DailyAnalysisData {
  date: string;
  visitors: number;
  enquiries: number;
  messages: number;
  conversionRate: number;
  visitorsData?: VisitorData[];
  enquiriesData?: EnquiryData[];
}

interface DailyAnalysisTableProps {
  data: DailyAnalysisData[];
}

export default function DailyAnalysisTable({ data }: DailyAnalysisTableProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'details'>('overview');

  // Debug logging
  console.log('📊 DailyAnalysisTable received data:', data);

  const getConversionRateColor = (rate: number) => {
    if (rate >= 50) return 'text-green-600 bg-green-50';
    if (rate >= 20) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getActivityLevel = (visitors: number) => {
    if (visitors >= 5) return { color: 'bg-green-500', label: 'High' };
    if (visitors >= 2) return { color: 'bg-yellow-500', label: 'Medium' };
    if (visitors >= 1) return { color: 'bg-blue-500', label: 'Low' };
    return { color: 'bg-gray-300', label: 'None' };
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mr-4 shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Daily Analysis</h3>
              <p className="text-sm text-gray-500">Activity overview and insights</p>
            </div>
          </div>
          <div className="text-center text-gray-500 py-12">
            <div className="text-6xl mb-4">📊</div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">No Analysis Data Available</h4>
            <p className="text-sm">Data will appear here once visitors start interacting with your system.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300 group">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-white to-blue-50/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mr-4 group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-300 shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">Daily Analysis</h3>
              <p className="text-sm text-gray-500">Last 7 days activity overview</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                viewMode === 'overview'
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('details')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                viewMode === 'details'
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              Details
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'overview' ? (
        /* Overview Mode - Clean Cards */
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
            {data.map((item, index) => {
              const activity = getActivityLevel(item.visitors);
              const hasData = item.visitors > 0;
              
              return (
                <div
                  key={index}
                  className={`relative p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer group ${
                    hasData
                      ? 'border-gray-200 hover:border-blue-300 hover:shadow-lg bg-gradient-to-r from-white to-blue-50/30 hover:from-blue-50/50 hover:to-blue-100/30'
                      : 'border-gray-100 bg-gray-50/50'
                  }`}
                  onClick={() => hasData ? setSelectedDay(selectedDay === index ? null : index) : null}
                >
                  <div className="flex items-center justify-between">
                    {/* Date and Activity Indicator */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${activity.color}`}></div>
                        <span className="font-semibold text-gray-900">{item.date}</span>
                      </div>
                      {!hasData && (
                        <span className="text-xs text-gray-400 italic">No activity</span>
                      )}
                    </div>

                    {/* Quick Stats */}
                    {hasData && (
                      <div className="flex items-center space-x-6">
                        <div className="text-center bg-blue-50 rounded-lg px-3 py-2 group-hover:bg-blue-100 transition-colors">
                          <div className="text-lg font-bold text-blue-600">{item.visitors}</div>
                          <div className="text-xs text-gray-500">Visitors</div>
                        </div>
                        <div className="text-center bg-green-50 rounded-lg px-3 py-2 group-hover:bg-green-100 transition-colors">
                          <div className="text-lg font-bold text-green-600">{item.enquiries}</div>
                          <div className="text-xs text-gray-500">Enquiries</div>
                        </div>
                        <div className="text-center bg-purple-50 rounded-lg px-3 py-2 group-hover:bg-purple-100 transition-colors">
                          <div className="text-lg font-bold text-purple-600">{item.messages}</div>
                          <div className="text-xs text-gray-500">Messages</div>
                        </div>
                        <div className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm ${getConversionRateColor(item.conversionRate)}`}>
                          {item.conversionRate.toFixed(1)}% Conversion
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {selectedDay === index && hasData && (
                    <div className="mt-6 pt-6 border-t border-gray-200 bg-gradient-to-r from-gray-50/50 to-blue-50/30 rounded-lg p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Visitors */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <span className="w-3 h-3 bg-blue-500 rounded-full mr-3 shadow-sm"></span>
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                              {item.visitors} Visitors
                            </span>
                          </h4>
                          {item.visitorsData && item.visitorsData.length > 0 ? (
                            <div className="space-y-3">
                              {item.visitorsData.map((visitor) => (
                                <div key={visitor._id} className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition-all duration-200">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-900">{visitor.name}</p>
                                      {visitor.email && (
                                        <p className="text-sm text-blue-600 mt-1">{visitor.email}</p>
                                      )}
                                      {visitor.phone && (
                                        <p className="text-sm text-gray-600 mt-1">{visitor.phone}</p>
                                      )}
                                      {visitor.location && (
                                        <p className="text-xs text-gray-500 mt-2 flex items-center">
                                          <span className="mr-1">📍</span>
                                          {visitor.location}
                                        </p>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-400 whitespace-nowrap ml-3 bg-gray-100 px-2 py-1 rounded">
                                      {formatTime(visitor.createdAt)}
                                    </span>
                                  </div>
                                  {visitor.enquiryDetails && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                      <p className="text-sm text-gray-700">{visitor.enquiryDetails}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <div className="text-4xl mb-2">👥</div>
                              <p className="text-sm">No visitor details available</p>
                            </div>
                          )}
                        </div>

                        {/* Enquiries */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <span className="w-3 h-3 bg-green-500 rounded-full mr-3 shadow-sm"></span>
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                              {item.enquiries} Enquiries
                            </span>
                          </h4>
                          {item.enquiriesData && item.enquiriesData.length > 0 ? (
                            <div className="space-y-3">
                              {item.enquiriesData.map((enquiry) => (
                                <div key={enquiry._id} className="bg-white rounded-xl p-4 border border-green-100 shadow-sm hover:shadow-md transition-all duration-200">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-900">
                                        {enquiry.visitorName || 'Anonymous'}
                                      </p>
                                      {enquiry.subject && (
                                        <p className="text-sm font-medium text-green-700 mt-1">{enquiry.subject}</p>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-400 whitespace-nowrap ml-3 bg-gray-100 px-2 py-1 rounded">
                                      {formatTime(enquiry.createdAt)}
                                    </span>
                                  </div>
                                  {enquiry.message && (
                                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                      <p className="text-sm text-gray-700">{enquiry.message}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <div className="text-4xl mb-2">📝</div>
                              <p className="text-sm">No formal enquiries submitted</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Details Mode - Enhanced Table View */
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-blue-50/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Activity</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Visitors</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Enquiries</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Messages</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Conversion</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {data.map((item, index) => {
                const activity = getActivityLevel(item.visitors);
                return (
                  <tr key={index} className="hover:bg-blue-50/30 transition-all duration-200 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{item.date}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${activity.color} mr-3 shadow-sm`}></div>
                        <span className="text-sm font-medium text-gray-600">{activity.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-xl font-bold text-blue-600">{item.visitors}</span>
                        <span className="ml-2 text-xs text-gray-500">visitors</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-xl font-bold text-green-600">{item.enquiries}</span>
                        <span className="ml-2 text-xs text-gray-500">enquiries</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-xl font-bold text-purple-600">{item.messages}</span>
                        <span className="ml-2 text-xs text-gray-500">messages</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${getConversionRateColor(item.conversionRate)}`}>
                        {item.conversionRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}