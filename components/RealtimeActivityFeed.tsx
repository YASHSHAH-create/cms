'use client';

import React, { useState, useEffect } from 'react';

interface ActivityItem {
  id: string;
  type: 'visitor' | 'enquiry' | 'message' | 'conversion';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  color: string;
}

interface RealtimeActivityFeedProps {
  activities: ActivityItem[];
  isLive?: boolean;
}

export default function RealtimeActivityFeed({ activities, isLive = true }: RealtimeActivityFeedProps) {
  const [displayedActivities, setDisplayedActivities] = useState<ActivityItem[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (activities && activities.length > 0) {
      setIsAnimating(true);
      setDisplayedActivities(activities.slice(0, 5)); // Show last 5 activities
      
      // Reset animation after a short delay
      setTimeout(() => setIsAnimating(false), 500);
    }
  }, [activities]);

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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'visitor': return '👥';
      case 'enquiry': return '📝';
      case 'message': return '💬';
      case 'conversion': return '🎯';
      default: return '📊';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'visitor': return 'bg-blue-100 text-blue-800';
      case 'enquiry': return 'bg-green-100 text-green-800';
      case 'message': return 'bg-purple-100 text-purple-800';
      case 'conversion': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Live Activity</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-gray-500">No activity</span>
            </div>
          </div>
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">📊</div>
            <p>No recent activity</p>
            <p className="text-sm mt-1">Activity will appear here as users interact with your system</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Live Activity</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-500">{isLive ? 'Live' : 'Offline'}</span>
          </div>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {displayedActivities.map((activity, index) => (
            <div
              key={activity.id}
              className={`flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all duration-300 ${
                isAnimating && index === 0 ? 'animate-pulse bg-blue-50' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    {formatTime(activity.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {activities.length > 5 && (
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all {activities.length} activities
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
