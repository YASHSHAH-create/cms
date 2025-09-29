/**
 * Live analytics data fetching layer - MongoDB only
 * No mock mode, no fallbacks - production-ready
 */

export type Summary = {
  totalVisitors: number;
  leads: number;
  chatbotEnquiries: number;
  pendingConversations: number;
  conversionRate: number; // percent
};

export type DailyPoint = { 
  date: string; 
  visitors: number; 
};

export type RecentItem = { 
  id: string; 
  name: string; 
  email?: string; 
  phone?: string; 
  messages: number; 
  tags?: string[]; 
  joinedAt?: string | null; 
};

/**
 * Safe fetch with no caching
 */
async function j<T>(u: string): Promise<T> {
  const r = await fetch(u, { cache: "no-store", credentials: "include" });
  if (!r.ok) throw new Error(`${u} ${r.status}`);
  return (await r.json()) as T;
}

/**
 * Fetch summary statistics from live MongoDB
 */
export const getSummary = () => j<Summary>("/api/analytics/summary");

/**
 * Fetch daily time series data from live MongoDB
 */
export const getDaily = () => j<DailyPoint[]>("/api/analytics/daily-visitors");

/**
 * Fetch recent conversations from live MongoDB
 */
export const getRecent = (limit: number = 5) => j<RecentItem[]>(`/api/analytics/recent-conversations?limit=${limit}`);

/**
 * Fetch active conversations from live MongoDB (last 48h)
 */
export const getActive = (limit: number = 5) => j<RecentItem[]>(`/api/analytics/active-conversations?limit=${limit}`);

/**
 * Refresh interval for real-time updates
 */
export const REFRESH_MS = 10000; // 10s polling