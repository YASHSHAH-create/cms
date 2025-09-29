'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { getRolePermissions, getDashboardTitle, getDashboardDescription } from '@/lib/utils/roleBasedAccess';

// Analytics data layer
import { getSummary, getDaily, getRecent, Summary, DailyPoint, RecentItem } from '@/lib/analytics';

// Real-time hooks
import { useRealtime, useRealtimeListener } from '@/hooks/useRealtime';

// Admin components
import StatCard from '@/components/admin/StatCard';
import TimeseriesLine from '@/components/admin/TimeseriesLine';
import DonutGauge from '@/components/admin/DonutGauge';
import RecentList from '@/components/admin/RecentList';
import DateRangePicker from '@/components/admin/DateRangePicker';

export default function AdminDashboard() {
  const router = useRouter();
  const { token, user: authUser, isAuthenticated } = useAuth();
  
  // State management
  const [summary, setSummary] = useState<Summary | null>(null);
  const [dailyData, setDailyData] = useState<DailyPoint[]>([]);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("7d");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);

  // Set user data when authUser changes
  useEffect(() => {
    if (authUser) {
      setUser({
        id: authUser.id,
        name: authUser.name,
        role: authUser.role
      });
    }
  }, [authUser]);

  // Data fetching function
  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const [summaryData, dailyDataResult, recentData] = await Promise.all([
        getSummary(dateRange),
        getDaily(dateRange),
        getRecent(5)
      ]);

      setSummary(summaryData);
      setDailyData(dailyDataResult);
      setRecentItems(recentData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [token, dateRange]);

  // Real-time event handler
  const handleRealtimeEvent = useCallback((event: string, data?: any) => {
    console.log('Real-time event received:', event, data);
    // Refetch data when real-time events occur
    fetchData();
  }, [fetchData]);

  // Set up real-time connections
  useRealtime(handleRealtimeEvent);
  useRealtimeListener(handleRealtimeEvent);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get role-based permissions
  const permissions = user ? getRolePermissions(user) : null;
  const dashboardTitle = user ? getDashboardTitle(user) : 'Dashboard';
  const dashboardDescription = user ? getDashboardDescription(user) : 'Welcome to your dashboard';

  // Format last updated time in IST
  const formatLastUpdated = (date: Date): string => {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // Loading state
  if (loading && !summary) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-slate-50 flex">
          <Sidebar userRole={(user?.role as 'admin' | 'executive' | 'sales-executive' | 'customer-executive') || 'admin'} />
          <div className="flex-1 flex flex-col">
            <DashboardHeader userRole={(user?.role as 'admin' | 'executive' | 'sales-executive' | 'customer-executive') || 'admin'} />
            <div className="flex-1 p-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading dashboard...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar userRole={(user?.role as 'admin' | 'executive' | 'sales-executive' | 'customer-executive') || 'admin'} />
        <div className="flex-1 flex flex-col">
          <DashboardHeader userRole={(user?.role as 'admin' | 'executive' | 'sales-executive' | 'customer-executive') || 'admin'} />
          <div className="flex-1 p-6">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{dashboardTitle}</h1>
                  <p className="text-slate-600 mt-2">{dashboardDescription}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <DateRangePicker value={dateRange} onChange={setDateRange} />
                  <div className="text-sm text-slate-500">
                    Last updated: {formatLastUpdated(lastUpdated)}
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Visitors"
                value={summary?.totalVisitors || 0}
                icon="👥"
                delta={summary?.totalVisitors ? { value: 12, direction: "up" } : undefined}
              />
              <StatCard
                title="Leads Acquired"
                value={summary?.leads || 0}
                icon="🎯"
                delta={summary?.leads ? { value: 8, direction: "up" } : undefined}
              />
              <StatCard
                title="Chatbot Enquiries"
                value={summary?.chatbotEnquiries || 0}
                icon="🤖"
                delta={summary?.chatbotEnquiries ? { value: 15, direction: "up" } : undefined}
              />
              <StatCard
                title="Pending Conversations"
                value={summary?.pendingConversations || 0}
                icon="💬"
                delta={summary?.pendingConversations ? { value: -3, direction: "down" } : undefined}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <TimeseriesLine data={dailyData} height={300} />
              </div>
              <div className="lg:col-span-1">
                <DonutGauge 
                  value={summary?.conversionRate || 0} 
                  label="Conversion Rate"
                  height={300}
                />
              </div>
            </div>

            {/* Recent Activity Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentList 
                  items={recentItems} 
                  title="Recent Visitors" 
                />
              </div>
              <div className="lg:col-span-1">
                <RecentList 
                  items={recentItems.filter(item => item.messages > 0)} 
                  title="Active Conversations" 
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-red-500 mr-3">⚠️</div>
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Error Loading Data</h4>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                    <button
                      onClick={fetchData}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}