// Comprehensive API wrapper with error handling and fallbacks
import { NextRequest } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Enhanced API wrapper with comprehensive error handling
export class ApiWrapper {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Get authentication headers
  private getAuthHeaders(): HeadersInit {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('ems_token');
      return {
        ...this.defaultHeaders,
        ...(token && { 'Authorization': `Bearer ${token}` })
      };
    }
    return this.defaultHeaders;
  }

  // Enhanced fetch with comprehensive error handling
  private async enhancedFetch<T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      console.log(`📊 API Response: ${response.status} ${response.statusText}`);

      // Handle different response types
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorData: any = null;

        try {
          const errorText = await response.text();
          if (errorText) {
            errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }

        console.error(`❌ API Error: ${errorMessage}`, errorData);
        
        return {
          success: false,
          error: errorMessage,
          message: errorMessage
        };
      }

      // Parse successful response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`✅ API Success: ${url}`, data);
        return {
          success: true,
          data,
          message: data.message || 'Success'
        };
      } else {
        const text = await response.text();
        return {
          success: true,
          data: text,
          message: 'Success'
        };
      }

    } catch (error) {
      console.error(`❌ Network Error: ${url}`, error);
      
      let errorMessage = 'Network error occurred';
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        message: errorMessage
      };
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }
    
    return this.enhancedFetch<T>(url.toString());
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.enhancedFetch<T>(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.enhancedFetch<T>(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.enhancedFetch<T>(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
    });
  }
}

// Create default API wrapper instance
const API_BASE = (() => {
  // Always use current domain in browser
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for server-side
  return process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
})();
export const apiWrapper = new ApiWrapper(API_BASE);

// Enhanced API functions with fallbacks
export const enhancedApi = {
  // Authentication
  auth: {
    login: async (credentials: { username: string; password: string }) => {
      return apiWrapper.post('/api/auth/login', credentials);
    },
    
    getProfile: async () => {
      return apiWrapper.get('/api/auth/profile');
    },
    
    register: async (userData: any) => {
      return apiWrapper.post('/api/auth/register', userData);
    }
  },

  // Analytics with fallbacks
  analytics: {
    getDashboard: async () => {
      const response = await apiWrapper.get('/api/analytics/dashboard');
      if (!response.success) {
        // Return fallback dashboard data
        return {
          success: true,
          data: {
            totalVisitors: 0,
            totalEnquiries: 0,
            conversionRate: 0,
            activeAgents: 0
          }
        };
      }
      return response;
    },

    getVisitorsManagement: async (params?: any) => {
      const response = await apiWrapper.get('/api/analytics/visitors-management', params);
      if (!response.success) {
        return {
          success: true,
          data: {
            visitors: [],
            count: 0,
            page: 1,
            totalPages: 1
          }
        };
      }
      return response;
    },

    getExecutiveEnquiries: async (params?: any) => {
      const response = await apiWrapper.get('/api/analytics/executive-enquiries-management', params);
      if (!response.success) {
        return {
          success: true,
          data: {
            enquiries: [],
            count: 0,
            page: 1,
            totalPages: 1
          }
        };
      }
      return response;
    },

    addEnquiry: async (enquiryData: any) => {
      return apiWrapper.post('/api/analytics/add-enquiry', enquiryData);
    },

    getDailyAnalysis: async (params?: any) => {
      const response = await apiWrapper.get('/api/analytics/daily-analysis', params);
      if (!response.success) {
        return {
          success: true,
          data: []
        };
      }
      return response;
    },

    getRecentConversations: async (params?: any) => {
      const response = await apiWrapper.get('/api/analytics/recent-conversations', params);
      if (!response.success) {
        return {
          success: true,
          data: []
        };
      }
      return response;
    }
  },

  // Visitors
  visitors: {
    list: async (params?: any) => {
      const response = await apiWrapper.get('/api/visitors', params);
      if (!response.success) {
        return {
          success: true,
          data: {
            visitors: [],
            count: 0,
            page: 1,
            totalPages: 1
          }
        };
      }
      return response;
    },

    create: async (visitorData: any) => {
      return apiWrapper.post('/api/visitors', visitorData);
    }
  }
};

export default enhancedApi;
