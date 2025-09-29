import { useState, useEffect, useCallback } from 'react';
import { useRealtimeAnalytics } from '@/lib/utils/realtimeAnalytics';

export interface RealtimeAnalyticsData {
  dailyVisitors: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }[];
  };
  conversionRate: {
    visitors: number;
    leadsConverted: number;
    conversionRate: number;
  };
  recentConversations: Array<{
    visitor: {
      _id: string;
      name: string;
      email: string;
    };
    messages: Array<{
      content: string;
      timestamp: Date;
      sender: string;
    }>;
  }>;
  totals: {
    visitors: number;
    enquiries: number;
    messages: number;
  };
  lastUpdated: string;
  timestamp: string;
}

export function useRealtimeAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<RealtimeAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { subscribe, getCachedData, forceUpdate } = useRealtimeAnalytics();

  // Fetch initial analytics data
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Fetching real-time analytics data...');
      
      const response = await fetch('/api/analytics/realtime');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
      setLastUpdate(new Date());
      
      console.log('✅ Real-time analytics data fetched successfully');
    } catch (err) {
      console.error('❌ Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Try to get cached data as fallback
      const cachedData = getCachedData();
      if (cachedData) {
        setAnalyticsData(cachedData as any);
        console.log('📦 Using cached analytics data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [getCachedData]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribe('analytics_updated', (data: RealtimeAnalyticsData) => {
      console.log('🔄 Real-time analytics update received');
      setAnalyticsData(data);
      setLastUpdate(new Date());
    });

    return unsubscribe;
  }, [subscribe]);

  // Subscribe to specific events
  useEffect(() => {
    const unsubscribeVisitor = subscribe('visitor_added', () => {
      console.log('👤 Visitor added - refreshing analytics');
      fetchAnalyticsData();
    });

    const unsubscribeEnquiry = subscribe('enquiry_added', () => {
      console.log('📝 Enquiry added - refreshing analytics');
      fetchAnalyticsData();
    });

    const unsubscribeMessage = subscribe('message_added', () => {
      console.log('💬 Message added - refreshing analytics');
      fetchAnalyticsData();
    });

    const unsubscribeConversion = subscribe('conversion_updated', () => {
      console.log('📈 Conversion updated - refreshing analytics');
      fetchAnalyticsData();
    });

    return () => {
      unsubscribeVisitor();
      unsubscribeEnquiry();
      unsubscribeMessage();
      unsubscribeConversion();
    };
  }, [subscribe, fetchAnalyticsData]);

  // Initial data fetch
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalyticsData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAnalyticsData]);

  // Manual refresh function
  const refreshAnalytics = useCallback(async () => {
    await forceUpdate();
    await fetchAnalyticsData();
  }, [forceUpdate, fetchAnalyticsData]);

  return {
    analyticsData,
    isLoading,
    error,
    lastUpdate,
    refreshAnalytics,
    isConnected: analyticsData !== null
  };
}

export default useRealtimeAnalytics;
