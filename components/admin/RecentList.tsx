import React from 'react';
import { RecentItem } from '@/lib/analytics';

interface RecentListProps {
  items: RecentItem[];
  title: string;
}

export default function RecentList({ items, title }: RecentListProps) {
  const formatTime = (dateString?: string | null): string => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!items || items.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-sm font-medium">No recent activity</p>
            <p className="text-xs text-gray-400 mt-1">Data will appear here once users interact</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
      
      <div className="space-y-3">
        {items.slice(0, 5).map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-sm font-bold text-white">
                  {item.name.charAt(0).toUpperCase()}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {item.name}
                  </p>
                  {item.messages > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {item.messages} msgs
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                  {item.email && (
                    <span className="truncate">{item.email}</span>
                  )}
                  {item.phone && item.email && (
                    <span>•</span>
                  )}
                  {item.phone && (
                    <span>{item.phone}</span>
                  )}
                </div>
                
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.slice(0, 2).map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 2 && (
                      <span className="text-xs text-gray-400">
                        +{item.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">
              {formatTime(item.joinedAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
