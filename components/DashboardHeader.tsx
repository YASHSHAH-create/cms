import React, { useState, useEffect } from 'react';

interface DashboardHeaderProps {
  userRole: 'admin' | 'executive' | 'sales-executive' | 'customer-executive';
  userName?: string;
}

export default function DashboardHeader({ userRole, userName }: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    // Set isClient to true after hydration
    setIsClient(true);
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    if (!currentTime) return 'Welcome';
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-3 py-2 sm:px-4 sm:py-3 md:mt-0 mt-12">
      <div className="flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">
            Enquiry Management System
          </h1>
          {isClient && currentTime ? (
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">
              {formatDate(currentTime)} • {formatTime(currentTime)}
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              Loading...
            </p>
          )}
        </div>

        <div className="relative flex-shrink-0 ml-2">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs transition-colors"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
              {userName ? userName.charAt(0).toUpperCase() : userRole.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline text-xs sm:text-sm text-gray-700 font-medium truncate max-w-24">
              {userName || userRole}
            </span>
            <svg 
              className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    window.location.href = userRole === 'admin' 
                      ? '/dashboard/admin/settings' 
                      : '/dashboard/executive/profile';
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  👤 View Profile
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    window.location.href = userRole === 'admin' 
                      ? '/dashboard/admin/settings' 
                      : '/dashboard/executive/profile';
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  ⚙️ Settings
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    localStorage.removeItem('ems_token');
                    localStorage.removeItem('ems_user');
                    window.location.href = '/auth/login';
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
