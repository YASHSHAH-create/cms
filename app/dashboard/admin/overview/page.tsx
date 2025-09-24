'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import StatBox from '@/components/StatBox';
import DailyVisitorsChart from '@/components/DailyVisitorsChart';
import ConversionRateChart from '@/components/ConversationRatioChart';
import DailyAnalysisTable from '@/components/DailyAnalysisTable';
import RecentConversations from '@/components/RecentConversations';
import { useAuth } from '@/lib/hooks/useAuth';

type DashboardTotals = {
  visitors: number;
  messages: number;
  faqs: number;
  articles: number;
};

type DashboardToday = {
  visitors: number;
  messages: number;
};

type DailyVisitorsData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
};

type ConversationRatioData = {
  visitors: number;
  leadsConverted: number;
  conversionRate: number;
};

type DailyAnalysisData = {
  id: string;
  visitor: string;
  agent: string;
  enquiry: string;
  dateTime: string;
  status: 'active' | 'completed' | 'pending';
};

type RecentConversationData = {
  id: string;
  visitor: string;
  lastMessage: string;
  timestamp: string;
  messages: {
    sender: 'visitor' | 'agent';
    message: string;
    timestamp: string;
  }[];
};

export default function OverviewPage() {
  const router = useRouter();
  const { token, user, isAuthenticated, refresh } = useAuth();
  const [totals, setTotals] = useState<DashboardTotals | null>(null);
  const [today, setToday] = useState<DashboardToday | null>(null);
  const [dailyVisitorsData, setDailyVisitorsData] = useState<DailyVisitorsData | null>(null);
  const [conversationRatioData, setConversationRatioData] = useState<ConversationRatioData | null>(null);
  const [dailyAnalysisData, setDailyAnalysisData] = useState<DailyAnalysisData[]>([]);
  const [recentConversationsData, setRecentConversationsData] = useState<RecentConversationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

  useEffect(() => {
    // Refresh auth state on component mount
    refresh();

    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    // Check if user has admin role, if not redirect to appropriate dashboard
    if (user && user.role !== 'admin') {
      console.warn(`User ${user.name} (${user.role}) attempted to access admin route`);
      if (user.role === 'executive') {
        router.push('/dashboard/executive');
      } else {
        router.push('/login');
      }
      return;
    }

    const loadData = async () => {
      if (!token) {
        // Set mock data when no token is available
        setTotals({ visitors: 38, messages: 15, faqs: 8, articles: 12 });
        setToday({ visitors: 5, messages: 3 });
        setDailyVisitorsData({
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Daily Visitors',
            data: [12, 19, 8, 15, 22, 18, 25],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4
          }]
        });
        setConversationRatioData({ leadsConverted: 8, totalVisitors: 38 });
        setDailyAnalysisData([
          { id: '1', visitor: 'John Doe', agent: 'Agent 1', enquiry: 'Service Inquiry', dateTime: '2024-01-15', status: 'active' },
          { id: '2', visitor: 'Jane Smith', agent: 'Agent 2', enquiry: 'Product Info', dateTime: '2024-01-15', status: 'completed' }
        ]);
        setRecentConversationsData([
          { id: '1', visitor: 'John Doe', lastMessage: 'Thank you for the information', timestamp: '2024-01-15T10:30:00Z', messages: [] }
        ]);
        setError('Demo data shown. Please login to see live data.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch all data in parallel
        const [
          dashboardRes,
          dailyVisitorsRes,
          conversationRatioRes,
          dailyAnalysisRes,
          recentConversationsRes
        ] = await Promise.all([
          fetch(`${API_BASE}/api/analytics/dashboard`, { headers }),
          fetch(`${API_BASE}/api/analytics/daily-visitors`, { headers }),
          fetch(`${API_BASE}/api/analytics/conversion-rate`, { headers }),
          fetch(`${API_BASE}/api/analytics/daily-analysis`, { headers }),
          fetch(`${API_BASE}/api/analytics/recent-conversations`, { headers })
        ]);

        // Process dashboard data
        if (dashboardRes.ok) {
          const dashboardData = await dashboardRes.json();
          setTotals(dashboardData.totals);
          setToday(dashboardData.today);
        }

        // Process daily visitors data
        if (dailyVisitorsRes.ok) {
          const dailyVisitors = await dailyVisitorsRes.json();
          setDailyVisitorsData(dailyVisitors);
        }

        // Process conversation ratio data
        if (conversationRatioRes.ok) {
          const conversationRatio = await conversationRatioRes.json();
          setConversationRatioData(conversationRatio);
        }

        // Process daily analysis data
        if (dailyAnalysisRes.ok) {
          const dailyAnalysis = await dailyAnalysisRes.json();
          setDailyAnalysisData(dailyAnalysis);
        }

        // Process recent conversations data
        if (recentConversationsRes.ok) {
          const recentConversations = await recentConversationsRes.json();
          setRecentConversationsData(recentConversations);
        }

      } catch (e) {
        console.error('Error loading dashboard data:', e);
        // Set fallback data when API calls fail
        setTotals({ visitors: 0, messages: 0, faqs: 0, articles: 0 });
        setToday({ visitors: 0, messages: 0 });
        setDailyVisitorsData({ labels: [], datasets: [] });
        setConversationRatioData({ leadsConverted: 0, totalVisitors: 0 });
        setDailyAnalysisData([]);
        setRecentConversationsData([]);
        setError('Unable to load live data. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [API_BASE, token, router, isAuthenticated, user, refresh]);

  // Calculate derived statistics
  const leadsAcquired = conversationRatioData?.leadsConverted || 0;
  const chatbotEnquiries = totals?.messages || 0;
  const pendingConversations = totals ? Math.max(0, totals.visitors - leadsAcquired) : 0;

  // Don't render if user is not admin
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole={user.role} userName={user.name} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userRole={user.role} userName={user.name} />
        
        <div className="flex-1 p-2 sm:p-2.5 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Page Header */}
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-gray-600">
                  Welcome back, {user?.name}! Here&apos;s your system overview.
                </p>
              </div>
            </div>
          </div>
          
          {/* Rest of the dashboard content */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <div className="text-gray-600">Loading dashboard...</div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-red-700 font-medium">{error}</div>
              </div>
            </div>
          )}
          
          {!loading && totals && today && (
            <>
              {/* Stat Boxes - First Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-2 sm:mb-3">
                <div className="group h-full">
                  <StatBox
                    title="Total Visitors"
                    value={totals.visitors}
                    icon="👥"
                    color="blue"
                    change={{ value: 12, isPositive: true }}
                  />
                </div>
                <div className="group h-full">
                  <StatBox
                    title="Leads Acquired"
                    value={leadsAcquired}
                    icon="🎯"
                    color="green"
                    change={{ value: 8, isPositive: true }}
                  />
                </div>
                <div className="group h-full">
                  <StatBox
                    title="Chatbot Enquiries"
                    value={chatbotEnquiries}
                    icon="🤖"
                    color="orange"
                    change={{ value: 15, isPositive: true }}
                  />
                </div>
                <div className="group h-full">
                  <StatBox
                    title="Pending Conversations"
                    value={pendingConversations}
                    icon="⏳"
                    color="red"
                    change={{ value: 5, isPositive: false }}
                  />
                </div>
              </div>

              {/* Charts - Second Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2 sm:mb-3">
                <div className="group h-full">
                  {dailyVisitorsData && (
                    <DailyVisitorsChart 
                      data={dailyVisitorsData} 
                    />
                  )}
                </div>
                <div className="group h-full">
                  {conversationRatioData && (
                    <ConversionRateChart 
                      visitors={conversationRatioData.visitors} 
                      leadsConverted={conversationRatioData.leadsConverted} 
                    />
                  )}
                </div>
              </div>

              {/* Tables - Third Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <div className="group">
                  <DailyAnalysisTable data={dailyAnalysisData} />
                </div>
                <div className="group">
                  <RecentConversations conversations={recentConversationsData} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

