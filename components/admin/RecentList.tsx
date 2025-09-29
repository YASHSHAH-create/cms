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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-32 text-slate-500">
          <div className="text-center">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-sm">No recent activity</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      
      <div className="space-y-3">
        {items.slice(0, 5).map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-slate-600">
                  {item.name.charAt(0).toUpperCase()}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {item.name}
                  </p>
                  {item.messages > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.messages} msgs
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  {item.email && (
                    <span className="truncate">{item.email}</span>
                  )}
                  {item.phone && (
                    <span>• {item.phone}</span>
                  )}
                </div>
                
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.tags.slice(0, 2).map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 2 && (
                      <span className="text-xs text-slate-400">
                        +{item.tags.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-xs text-slate-400 ml-2">
              {formatTime(item.joinedAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
