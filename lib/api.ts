// API utility for making requests to Next.js API routes
const API_BASE = (() => {
  // Always use current domain in browser
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for server-side
  return process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
})();

// Helper function to get auth headers
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('ems_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

// Helper function to handle API responses
async function handleResponse(response: Response) {
  console.log('API Response status:', response.status, response.statusText);
  console.log('API Response URL:', response.url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error response:', errorText);
    
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText || 'Network error' };
    }
    
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// API functions
export const api = {
  // Authentication
  auth: {
    login: async (credentials: { username: string; password: string }) => {
      console.log('Making login request to:', `${API_BASE}/api/auth/login`);
      console.log('Login credentials:', { username: credentials.username, password: '***' });
      
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const result = await handleResponse(response);
      console.log('Login result:', { success: result.success, user: result.user?.name });
      return result;
    },

    register: async (userData: any) => {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return handleResponse(response);
    },

    getProfile: async () => {
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    }
  },

  // Visitors
  visitors: {
    create: async (visitorData: any) => {
      const response = await fetch(`${API_BASE}/api/visitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitorData)
      });
      return handleResponse(response);
    },

    list: async (params?: { page?: number; limit?: number; q?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.q) searchParams.set('q', params.q);
      
      const response = await fetch(`${API_BASE}/api/visitors?${searchParams}`, {
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    }
  },

  // Analytics
  analytics: {
    getDashboard: async () => {
      const response = await fetch(`${API_BASE}/api/analytics/dashboard`, {
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    },

    getVisitorsManagement: async (params?: { page?: number; limit?: number; search?: string; status?: string; source?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.source) searchParams.set('source', params.source);
      
      const response = await fetch(`${API_BASE}/api/analytics/visitors-management?${searchParams}`, {
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    },

    addEnquiry: async (enquiryData: any) => {
      const response = await fetch(`${API_BASE}/api/analytics/add-enquiry`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(enquiryData)
      });
      return handleResponse(response);
    }
  },

  // Chat
  chat: {
    getMessages: async (visitorId: string, limit?: number) => {
      const searchParams = new URLSearchParams();
      if (limit) searchParams.set('limit', limit.toString());
      
      const response = await fetch(`${API_BASE}/api/chat/${visitorId}/messages?${searchParams}`, {
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    },

    sendMessage: async (visitorId: string, message: { sender: string; message: string }) => {
      const response = await fetch(`${API_BASE}/api/chat/${visitorId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      return handleResponse(response);
    }
  },

  // FAQs
  faqs: {
    list: async (params?: { category?: string; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.set('category', params.category);
      if (params?.search) searchParams.set('search', params.search);
      
      const response = await fetch(`${API_BASE}/api/faqs?${searchParams}`, {
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    },

    create: async (faqData: any) => {
      const response = await fetch(`${API_BASE}/api/faqs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(faqData)
      });
      return handleResponse(response);
    }
  },

  // Articles
  articles: {
    list: async (params?: { search?: string; tag?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set('search', params.search);
      if (params?.tag) searchParams.set('tag', params.tag);
      
      const response = await fetch(`${API_BASE}/api/articles?${searchParams}`, {
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    },

    create: async (articleData: any) => {
      const response = await fetch(`${API_BASE}/api/articles`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(articleData)
      });
      return handleResponse(response);
    }
  },

  // Executive Services
  executiveServices: {
    getServices: async () => {
      const response = await fetch(`${API_BASE}/api/executive-services/services`, {
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    },

    getExecutiveServices: async (executiveId: string) => {
      const response = await fetch(`${API_BASE}/api/executive-services/executive/${executiveId}`, {
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    },

    assignServices: async (assignmentData: { executiveId: string; services: string[] }) => {
      const response = await fetch(`${API_BASE}/api/executive-services/assign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(assignmentData)
      });
      return handleResponse(response);
    }
  },

  // Region Assignments
  regionAssignments: {
    list: async () => {
      const response = await fetch(`${API_BASE}/api/region-assignments`, {
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    },

    getByRegion: async (region: string) => {
      const response = await fetch(`${API_BASE}/api/region-assignments/${region}`, {
        headers: getAuthHeaders()
      });
      return handleResponse(response);
    }
  }
};

export default api;
