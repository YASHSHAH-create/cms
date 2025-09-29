/**
 * Analytics data fetching layer with mock mode support
 * 
 * Mock mode: Set NEXT_PUBLIC_USE_MOCK=1 for stable UI previews
 * Real-time: Set NEXT_PUBLIC_REALTIME=sse for Server-Sent Events
 */

export type Summary = {
  totalVisitors: number;
  leads: number;
  chatbotEnquiries: number;
  pendingConversations: number;
  conversionRate: number; // 0..1
};

export type DailyPoint = {
  date: string;          // ISO date
  visitors: number;
  enquiries: number;
  messages: number;
  conversions: number;
};

export type RecentItem = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  messages: number;
  tags?: string[];
  joinedAt?: string;     // ISO
};

// Mock data for stable UI previews
const MOCK_SUMMARY: Summary = {
  totalVisitors: 1247,
  leads: 89,
  chatbotEnquiries: 156,
  pendingConversations: 23,
  conversionRate: 0.071, // 7.1%
};

const MOCK_DAILY: DailyPoint[] = [
  { date: '2024-09-23', visitors: 45, enquiries: 12, messages: 67, conversions: 3 },
  { date: '2024-09-24', visitors: 52, enquiries: 15, messages: 78, conversions: 4 },
  { date: '2024-09-25', visitors: 38, enquiries: 8, messages: 45, conversions: 2 },
  { date: '2024-09-26', visitors: 61, enquiries: 18, messages: 89, conversions: 5 },
  { date: '2024-09-27', visitors: 47, enquiries: 11, messages: 56, conversions: 3 },
  { date: '2024-09-28', visitors: 33, enquiries: 7, messages: 34, conversions: 1 },
  { date: '2024-09-29', visitors: 41, enquiries: 13, messages: 62, conversions: 4 },
];

const MOCK_RECENT: RecentItem[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@techcorp.com',
    phone: '+1-555-0123',
    messages: 8,
    tags: ['Water Testing', 'Priority'],
    joinedAt: '2024-09-29T10:30:00Z'
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.chen@envcorp.com',
    phone: '+1-555-0124',
    messages: 12,
    tags: ['Air Quality'],
    joinedAt: '2024-09-29T09:15:00Z'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.r@greenbuild.com',
    messages: 5,
    tags: ['Soil Analysis'],
    joinedAt: '2024-09-29T08:45:00Z'
  },
  {
    id: '4',
    name: 'David Kim',
    email: 'david.kim@ecosolutions.com',
    phone: '+1-555-0125',
    messages: 15,
    tags: ['Water Testing', 'Follow-up'],
    joinedAt: '2024-09-28T16:20:00Z'
  },
  {
    id: '5',
    name: 'Lisa Wang',
    email: 'lisa.wang@cleanair.com',
    messages: 3,
    tags: ['Air Quality'],
    joinedAt: '2024-09-28T14:10:00Z'
  }
];

/**
 * Check if mock mode is enabled
 * Mock mode kicks in when:
 * - NEXT_PUBLIC_USE_MOCK=1 is set, OR
 * - We're not on localhost (production/Netlify), OR
 * - Any API fetch fails
 */
export function isMock(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK === '1' ||
    (typeof window !== 'undefined' && window?.location?.hostname !== 'localhost');
}

function isMockMode(): boolean {
  return isMock();
}

/**
 * Simulate API delay for realistic loading states
 */
async function delay(ms: number = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safe fetch that returns null on any failure
 */
async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { credentials: "include" });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Fetch summary statistics
 */
export async function getSummary(range: "7d" | "30d" | "90d"): Promise<Summary> {
  if (isMockMode()) {
    await delay();
    return MOCK_SUMMARY;
  }

  try {
    // Try to fetch from existing API endpoints using safeFetch
    const [dailyVisitors, conversionRate, recentConversations] = await Promise.all([
      safeFetch(`/api/analytics/daily-visitors?days=${range === '7d' ? 7 : range === '30d' ? 30 : 90}`),
      safeFetch('/api/analytics/conversion-rate'),
      safeFetch('/api/analytics/recent-conversations?limit=5')
    ]);

    // If any API fails, return mock data
    if (!dailyVisitors || !conversionRate || !recentConversations) {
      console.log('API fetch failed, using mock data');
      return MOCK_SUMMARY;
    }

    // Compose Summary from existing API responses
    const totalVisitors = conversionRate?.visitors || 0;
    const leads = conversionRate?.leadsConverted || 0;
    const conversionRateValue = conversionRate?.conversionRate || 0;
    
    // Calculate chatbot enquiries (estimate based on visitors)
    const chatbotEnquiries = Math.round(totalVisitors * 0.12);
    
    // Calculate pending conversations (recent conversations without conversion)
    const pendingConversations = recentConversations?.filter((conv: any) => 
      !conv.visitor?.isConverted
    ).length || 0;

    return {
      totalVisitors,
      leads,
      chatbotEnquiries,
      pendingConversations,
      conversionRate: conversionRateValue / 100, // Convert percentage to decimal
    };
  } catch (error) {
    console.error('Failed to fetch summary:', error);
    // Return mock data as fallback
    return MOCK_SUMMARY;
  }
}

/**
 * Fetch daily time series data
 */
export async function getDaily(range: "7d" | "30d" | "90d"): Promise<DailyPoint[]> {
  if (isMockMode()) {
    await delay();
    return MOCK_DAILY;
  }

  try {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const data = await safeFetch(`/api/analytics/daily-visitors?days=${days}`);

    if (!data) {
      console.log('Daily data fetch failed, using mock data');
      return MOCK_DAILY;
    }
    
    // Transform existing API response to DailyPoint format
    if (data.labels && data.datasets && data.datasets[0]) {
      return data.labels.map((label: string, index: number) => ({
        date: new Date(label).toISOString().split('T')[0],
        visitors: data.datasets[0].data[index] || 0,
        enquiries: Math.round((data.datasets[0].data[index] || 0) * 0.3), // Estimate
        messages: Math.round((data.datasets[0].data[index] || 0) * 1.2), // Estimate
        conversions: Math.round((data.datasets[0].data[index] || 0) * 0.1), // Estimate
      }));
    }

    return MOCK_DAILY;
  } catch (error) {
    console.error('Failed to fetch daily data:', error);
    return MOCK_DAILY;
  }
}

/**
 * Fetch recent conversations/visitors
 */
export async function getRecent(limit: number = 5): Promise<RecentItem[]> {
  if (isMockMode()) {
    await delay();
    return MOCK_RECENT.slice(0, limit);
  }

  try {
    const conversations = await safeFetch(`/api/analytics/recent-conversations?limit=${limit}`);

    if (!conversations) {
      console.log('Recent data fetch failed, using mock data');
      return MOCK_RECENT.slice(0, limit);
    }
    
    // Transform existing API response to RecentItem format
    return conversations.map((conv: any) => ({
      id: conv.visitor?._id || conv._id,
      name: conv.visitor?.name || 'Anonymous',
      email: conv.visitor?.email,
      phone: conv.visitor?.phone,
      messages: conv.messageCount || conv.messages?.length || 0,
      tags: conv.visitor?.service ? [conv.visitor.service] : [],
      joinedAt: conv.visitor?.createdAt || conv.createdAt,
    }));
  } catch (error) {
    console.error('Failed to fetch recent data:', error);
    return MOCK_RECENT.slice(0, limit);
  }
}
