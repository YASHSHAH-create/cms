// Real-time analytics system for live dashboard updates

export interface AnalyticsData {
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
  totalVisitors: number;
  totalEnquiries: number;
  totalMessages: number;
  lastUpdated: Date;
}

export interface RealtimeAnalyticsEvent {
  type: 'analytics_updated' | 'visitor_added' | 'enquiry_added' | 'message_added' | 'conversion_updated';
  data: any;
  timestamp: Date;
}

class RealtimeAnalytics {
  private listeners: Map<string, Function[]> = new Map();
  private analyticsCache: AnalyticsData | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private isUpdating = false;

  constructor() {
    // Start periodic analytics updates
    this.startPeriodicUpdates();
  }

  // Subscribe to real-time analytics updates
  subscribe(eventType: string, callback: Function): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Emit analytics update event
  private emit(eventType: string, data: any) {
    const event: RealtimeAnalyticsEvent = {
      type: eventType as any,
      data,
      timestamp: new Date()
    };

    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event.data, event.timestamp);
        } catch (error) {
          console.error('Error in analytics callback:', error);
        }
      });
    }
  }

  // Start periodic updates every 30 seconds
  private startPeriodicUpdates() {
    this.updateInterval = setInterval(async () => {
      if (!this.isUpdating) {
        await this.updateAnalytics();
      }
    }, 30000); // Update every 30 seconds
  }

  // Update analytics data
  async updateAnalytics(): Promise<void> {
    if (this.isUpdating) return;
    
    this.isUpdating = true;
    
    try {
      console.log('🔄 Updating real-time analytics...');
      
      // Get the base URL for server-side requests
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      // Fetch fresh analytics data
      const [dailyVisitorsRes, conversionRateRes, recentConversationsRes] = await Promise.all([
        fetch(`${baseUrl}/api/analytics/daily-visitors`),
        fetch(`${baseUrl}/api/analytics/conversion-rate`),
        fetch(`${baseUrl}/api/analytics/recent-conversations`)
      ]);

      const dailyVisitors = dailyVisitorsRes.ok ? await dailyVisitorsRes.json() : null;
      const conversionRate = conversionRateRes.ok ? await conversionRateRes.json() : null;
      const recentConversations = recentConversationsRes.ok ? await recentConversationsRes.json() : null;

      // Update cache
      this.analyticsCache = {
        dailyVisitors: dailyVisitors || this.analyticsCache?.dailyVisitors || {
          labels: [],
          datasets: [{ label: 'Daily Visitors', data: [], borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.1)' }]
        },
        conversionRate: conversionRate || this.analyticsCache?.conversionRate || { visitors: 0, leadsConverted: 0, conversionRate: 0 },
        recentConversations: recentConversations || this.analyticsCache?.recentConversations || [],
        totalVisitors: this.calculateTotalVisitors(dailyVisitors),
        totalEnquiries: this.calculateTotalEnquiries(conversionRate),
        totalMessages: this.calculateTotalMessages(recentConversations),
        lastUpdated: new Date()
      };

      // Emit update event
      this.emit('analytics_updated', this.analyticsCache);
      
      console.log('✅ Real-time analytics updated');
    } catch (error) {
      console.error('❌ Error updating analytics:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  // Calculate total visitors from daily data
  private calculateTotalVisitors(dailyVisitors: any): number {
    if (!dailyVisitors?.datasets?.[0]?.data) return 0;
    return dailyVisitors.datasets[0].data.reduce((sum: number, count: number) => sum + count, 0);
  }

  // Calculate total enquiries from conversion data
  private calculateTotalEnquiries(conversionRate: any): number {
    if (!conversionRate) return 0;
    return conversionRate.leadsConverted || 0;
  }

  // Calculate total messages from conversations
  private calculateTotalMessages(recentConversations: any): number {
    if (!Array.isArray(recentConversations)) return 0;
    return recentConversations.reduce((total, conv) => {
      return total + (conv.messages?.length || 0);
    }, 0);
  }

  // Get cached analytics data
  getCachedAnalytics(): AnalyticsData | null {
    return this.analyticsCache;
  }

  // Force immediate update
  async forceUpdate(): Promise<void> {
    await this.updateAnalytics();
  }

  // Handle visitor addition
  async onVisitorAdded(visitorData: any): Promise<void> {
    console.log('👤 Visitor added, updating analytics...');
    await this.updateAnalytics();
    this.emit('visitor_added', visitorData);
  }

  // Handle enquiry addition
  async onEnquiryAdded(enquiryData: any): Promise<void> {
    console.log('📝 Enquiry added, updating analytics...');
    await this.updateAnalytics();
    this.emit('enquiry_added', enquiryData);
  }

  // Handle message addition
  async onMessageAdded(messageData: any): Promise<void> {
    console.log('💬 Message added, updating analytics...');
    await this.updateAnalytics();
    this.emit('message_added', messageData);
  }

  // Handle conversion update
  async onConversionUpdated(conversionData: any): Promise<void> {
    console.log('📈 Conversion updated, updating analytics...');
    await this.updateAnalytics();
    this.emit('conversion_updated', conversionData);
  }

  // Cleanup
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.listeners.clear();
  }
}

// Create singleton instance
export const realtimeAnalytics = new RealtimeAnalytics();

// Hook for React components to use real-time analytics
export function useRealtimeAnalytics() {
  return {
    subscribe: (eventType: string, callback: Function) => realtimeAnalytics.subscribe(eventType, callback),
    getCachedData: () => realtimeAnalytics.getCachedAnalytics(),
    forceUpdate: () => realtimeAnalytics.forceUpdate(),
    onVisitorAdded: (data: any) => realtimeAnalytics.onVisitorAdded(data),
    onEnquiryAdded: (data: any) => realtimeAnalytics.onEnquiryAdded(data),
    onMessageAdded: (data: any) => realtimeAnalytics.onMessageAdded(data),
    onConversionUpdated: (data: any) => realtimeAnalytics.onConversionUpdated(data)
  };
}

export default realtimeAnalytics;
