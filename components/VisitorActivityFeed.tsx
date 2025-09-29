'use client';

import React, { useState } from 'react';

interface VisitorActivity {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  service?: string;
  isConverted?: boolean;
  createdAt: Date;
  lastInteractionAt?: Date;
  messageCount: number;
  status: 'new' | 'active' | 'converted' | 'inactive';
}

interface VisitorActivityFeedProps {
  activities: VisitorActivity[];
}

export default function VisitorActivityFeed({ activities }: VisitorActivityFeedProps) {
  const [filter, setFilter] = useState<'all' | 'new' | 'active' | 'converted'>('all');

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return '🆕';
      case 'active': return '🟢';
      case 'converted': return '✅';
      case 'inactive': return '⏸️';
      default: return '👤';
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.status === filter;
  });

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Visitor Activity</h3>
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">👥</div>
            <p>No visitor activity in the past week</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Visitor Activity (Past Week)</h3>
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              <option value="all">All ({activities.length})</option>
              <option value="new">New ({activities.filter(a => a.status === 'new').length})</option>
              <option value="active">Active ({activities.filter(a => a.status === 'active').length})</option>
              <option value="converted">Converted ({activities.filter(a => a.status === 'converted').length})</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredActivities.map((activity, index) => (
            <div
              key={`activity-${activity._id}-${index}`}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {activity.name ? activity.name.charAt(0).toUpperCase() : 'A'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {activity.name || 'Anonymous'}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {getStatusIcon(activity.status)} {activity.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {activity.email}
                    </p>
                    {activity.phone && (
                      <p className="text-xs text-gray-500 mb-1">
                        📞 {activity.phone}
                      </p>
                    )}
                    {activity.organization && (
                      <p className="text-xs text-gray-500 mb-1">
                        🏢 {activity.organization}
                      </p>
                    )}
                    {activity.service && (
                      <p className="text-xs text-blue-600 mb-1">
                        🔧 {activity.service}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      <p className="text-xs text-gray-400">
                        Joined: {formatTime(activity.createdAt)}
                      </p>
                      {activity.lastInteractionAt && (
                        <p className="text-xs text-gray-400">
                          Last activity: {formatTime(activity.lastInteractionAt)}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {activity.messageCount} messages
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xs text-gray-500">
                    {activity.lastInteractionAt ? formatTime(activity.lastInteractionAt) : 'No activity'}
                  </p>
                  {activity.isConverted && (
                    <p className="text-xs text-green-600 font-medium">
                      ✅ Converted
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredActivities.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">🔍</div>
            <p>No visitors found for the selected filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
