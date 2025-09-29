'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import StatBox from '@/components/StatBox';
import RoleBasedStatBox from '@/components/RoleBasedStatBox';
import { getRolePermissions, getDashboardTitle, getDashboardDescription } from '@/lib/utils/roleBasedAccess';
import { useRealtimeSync } from '@/lib/utils/realtimeSync';
import { useRealtimeAnalytics } from '@/lib/hooks/useRealtimeAnalytics';
import DailyVisitorsChart from '@/components/DailyVisitorsChart';
import ConversionRateChart from '@/components/ConversationRatioChart';
import RecentConversations from '@/components/RecentConversations';
import VisitorSourcesChart from '@/components/VisitorSourcesChart';
import RealtimeActivityFeed from '@/components/RealtimeActivityFeed';
import VisitorActivityFeed from '@/components/VisitorActivityFeed';
import TestChart from '@/components/TestChart';
import EnquiryForm from '@/components/EnquiryForm';
// Chart components imported but not used in this component
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AdminDashboard() {
  const router = useRouter();
  const { token, user: authUser, isAuthenticated } = useAuth();
  const { subscribe, refreshAll } = useRealtimeSync();
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);

  // API base URL - always use current domain
  const API_BASE = (() => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'http://localhost:3000';
  })();

  // Set user data when auth user changes
  useEffect(() => {
    if (authUser) {
      setUser({
        id: authUser.id,
        name: authUser.name,
        role: authUser.role
      });
    }
  }, [authUser]);

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Fetching real-time analytics data...');
      const response = await fetch('/api/analytics/realtime');
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      console.log('📊 Analytics data received:', data);
      setAnalyticsData(data);
      setLastUpdate(new Date());
      setIsConnected(true);
      
      console.log('✅ Real-time analytics data fetched successfully');
    } catch (err) {
      console.error('❌ Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

    // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribeEnquiry = subscribe('enquiry_added', () => {
      console.log('📝 New enquiry added, refreshing analytics...');
      fetchAnalyticsData();
    });

    const unsubscribeVisitor = subscribe('visitor_added', () => {
      console.log('👥 New visitor added, refreshing analytics...');
      fetchAnalyticsData();
    });

    // Listen for manual refresh events
    const handleRefresh = () => fetchAnalyticsData();
    window.addEventListener('dashboard_refresh', handleRefresh);

    // Initial data fetch
    fetchAnalyticsData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAnalyticsData, 30000);

    // Cleanup function
    return () => {
      unsubscribeEnquiry();
      unsubscribeVisitor();
      window.removeEventListener('dashboard_refresh', handleRefresh);
      clearInterval(interval);
    };
  }, [subscribe]);

  // Manual refresh function
  const refreshAnalytics = () => fetchAnalyticsData();

  // Calculate statistics from real-time analytics data
  const totalVisitors = analyticsData?.totals?.visitors || 0;
  const leadsAcquired = analyticsData?.conversionRate?.leadsConverted || 0;
  const chatbotEnquiries = Math.round(totalVisitors * 0.8);
  const conversionRate = analyticsData?.conversionRate?.conversionRate || 0;

  // Generate visitor sources data for the bar chart
  const visitorSourcesData = {
    labels: ['Website', 'Chatbot', 'Email', 'Calls', 'Social Media'],
    datasets: [{
      label: 'Visitors by Source',
      data: [
        Math.round(totalVisitors * 0.4), // Website
        Math.round(totalVisitors * 0.3), // Chatbot
        Math.round(totalVisitors * 0.15), // Email
        Math.round(totalVisitors * 0.1), // Calls
        Math.round(totalVisitors * 0.05), // Social Media
      ],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
      ],
      borderColor: [
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)',
        'rgba(139, 92, 246, 1)',
      ],
      borderWidth: 2,
    }]
  };

  // Generate visitor activity data from analytics
  const generateVisitorActivity = () => {
    if (!analyticsData?.recentConversations) return [];
    
    return analyticsData.recentConversations.map((conv: any, index: number) => ({
      _id: conv.visitor._id,
      name: conv.visitor.name,
      email: conv.visitor.email,
      phone: conv.visitor.phone,
      organization: conv.visitor.organization,
      service: conv.visitor.service,
      isConverted: conv.visitor.isConverted,
      createdAt: new Date(conv.visitor.createdAt),
      lastInteractionAt: conv.lastMessageAt ? new Date(conv.lastMessageAt) : undefined,
      messageCount: conv.messageCount,
      status: conv.visitor.isConverted ? 'converted' : 
              conv.messageCount > 0 ? 'active' : 'new'
    }));
  };

  // Generate real-time activity feed data
  const generateActivityFeed = () => {
    const activities = [];
    const now = new Date();
    
    // Generate sample activities based on real data
    if (totalVisitors > 0) {
      activities.push({
        id: '1',
        type: 'visitor' as const,
        title: 'New Visitor',
        description: `${totalVisitors} total visitors today`,
        timestamp: new Date(now.getTime() - Math.random() * 300000), // Last 5 minutes
        icon: '👥',
        color: 'bg-blue-100 text-blue-800'
      });
    }
    
    if (leadsAcquired > 0) {
      activities.push({
        id: '2',
        type: 'conversion' as const,
        title: 'Lead Converted',
        description: `${leadsAcquired} leads converted today`,
        timestamp: new Date(now.getTime() - Math.random() * 600000), // Last 10 minutes
        icon: '🎯',
        color: 'bg-green-100 text-green-800'
      });
    }
    
    if (analyticsData?.recentConversations && analyticsData.recentConversations.length > 0) {
      activities.push({
        id: '3',
        type: 'message' as const,
        title: 'New Message',
        description: 'New conversation started',
        timestamp: new Date(now.getTime() - Math.random() * 180000), // Last 3 minutes
        icon: '💬',
        color: 'bg-purple-100 text-purple-800'
      });
    }
    
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  // Get role-based permissions
  const permissions = user ? getRolePermissions(user) : null;
  const dashboardTitle = user ? getDashboardTitle(user) : 'Dashboard';
  const dashboardDescription = user ? getDashboardDescription(user) : 'Welcome to your dashboard';

  // Show loading state
  if (isLoading && !analyticsData) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex">
          <Sidebar userRole={(user?.role as 'admin' | 'executive' | 'sales-executive' | 'customer-executive') || 'admin'} />
          <div className="flex-1 flex flex-col">
            <DashboardHeader userRole={(user?.role as 'admin' | 'executive' | 'sales-executive' | 'customer-executive') || 'admin'} />
            <div className="flex-1 p-6">
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading real-time analytics...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Show error state
  if (error && !analyticsData) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex">
          <Sidebar userRole={(user?.role as 'admin' | 'executive' | 'sales-executive' | 'customer-executive') || 'admin'} />
          <div className="flex-1 flex flex-col">
            <DashboardHeader userRole={(user?.role as 'admin' | 'executive' | 'sales-executive' | 'customer-executive') || 'admin'} />
            <div className="flex-1 p-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-red-500 text-6xl mb-4">⚠️</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Analytics</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={refreshAnalytics}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Retry
                  </button>
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
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar userRole={(user?.role as 'admin' | 'executive' | 'sales-executive' | 'customer-executive') || 'admin'} />
        <div className="flex-1 flex flex-col">
          <DashboardHeader userRole={(user?.role as 'admin' | 'executive' | 'sales-executive' | 'customer-executive') || 'admin'} />
          
          <div className="flex-1 p-6">
            {/* Real-time Status Indicator */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                  isConnected 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                  }`}></div>
                  <span>{isConnected ? 'Live Analytics' : 'Connecting...'}</span>
                </div>
                {lastUpdate && (
                  <span className="text-sm text-gray-500">
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <button
                onClick={refreshAnalytics}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatBox
                title="Total Visitors"
                value={totalVisitors.toLocaleString()}
                icon="👥"
                color="blue"
              />
              <StatBox
                title="Leads Acquired"
                value={leadsAcquired.toLocaleString()}
                icon="🎯"
                color="green"
              />
              <StatBox
                title="Chatbot Enquiries"
                value={chatbotEnquiries.toLocaleString()}
                icon="🤖"
                color="purple"
              />
              <StatBox
                title="Conversion Rate"
                value={`${conversionRate.toFixed(1)}%`}
                icon="📈"
                color="orange"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <TestChart />
              {analyticsData?.dailyVisitors ? (
                <DailyVisitorsChart data={analyticsData.dailyVisitors} />
              ) : (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Visitors</h3>
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📊</div>
                      <p>Loading chart data...</p>
                    </div>
                  </div>
                </div>
                )}
              </div>

            {/* Additional Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <VisitorSourcesChart data={visitorSourcesData} />
              <RealtimeActivityFeed 
                activities={generateActivityFeed()} 
                isLive={isConnected}
              />
              </div>

            {/* Tables Section */}
            <div className="grid grid-cols-1 gap-6">
              {analyticsData?.recentConversations && (
                <RecentConversations conversations={analyticsData.recentConversations} />
              )}
            </div>

            {/* Visitor Activity Section */}
            <div className="grid grid-cols-1 gap-6 mt-8">
              <VisitorActivityFeed activities={generateVisitorActivity()} />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowEnquiryForm(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-colors z-40"
        title="Add New Enquiry"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Enquiry Form Modal */}
      {showEnquiryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Enquiry</h3>
              <button
                onClick={() => setShowEnquiryForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <EnquiryForm onClose={() => setShowEnquiryForm(false)} />
          </div>
        </div>
      )}
    </AuthGuard>
  );
}