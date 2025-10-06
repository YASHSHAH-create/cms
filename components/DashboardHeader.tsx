'use client';
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/lib/contexts/ThemeContext';

interface DashboardHeaderProps {
  userRole: 'admin' | 'executive' | 'sales-executive' | 'customer-executive';
  userName?: string;
}

export default function DashboardHeader({ userRole, userName }: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 px-3 py-2 sm:px-4 sm:py-3 md:mt-0 mt-12 transition-colors">
      <div className="flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
            Enquiry Management System
          </h1>
          {isClient && currentTime ? (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 truncate">
              {formatDate(currentTime)} • {formatTime(currentTime)}
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              Loading...
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
          {/* Theme Toggle Button - Only show after mount to prevent hydration mismatch */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          )}

          {/* Profile Menu */}
          <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs transition-colors"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
              {userName ? userName.charAt(0).toUpperCase() : userRole.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium truncate max-w-24">
              {userName || userRole}
            </span>
            <svg 
              className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    window.location.href = userRole === 'admin' 
                      ? '/dashboard/admin/settings' 
                      : '/dashboard/executive/profile';
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  ⚙️ Settings
                </button>
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={() => {
                    localStorage.removeItem('ems_token');
                    localStorage.removeItem('ems_user');
                    window.location.href = '/login';
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
