'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserContext {
  localStorage: any;
  sessionStorage: any;
  cookies: string;
  token: string | null;
  decodedToken: any;
  serverValidation: any;
}

export default function DebugUserContextPage() {
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const debugUserContext = async () => {
      try {
        setLoading(true);
        
        // Get localStorage data
        const emsToken = localStorage.getItem('ems_token');
        const emsUser = localStorage.getItem('ems_user');
        
        // Get sessionStorage data
        const sessionData: any = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            sessionData[key] = sessionStorage.getItem(key);
          }
        }
        
        // Get cookies
        const cookies = document.cookie;
        
        // Decode JWT token if available
        let decodedToken = null;
        if (emsToken) {
          try {
            // Simple JWT decode (without verification)
            const payload = JSON.parse(atob(emsToken.split('.')[1]));
            decodedToken = payload;
          } catch (e) {
            console.error('Error decoding token:', e);
          }
        }
        
        // Validate with server
        let serverValidation = null;
        if (emsToken) {
          try {
            const response = await fetch('/api/auth/validate-session', {
              headers: {
                'Authorization': `Bearer ${emsToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              serverValidation = await response.json();
            } else {
              serverValidation = { error: 'Server validation failed', status: response.status };
            }
          } catch (e) {
            serverValidation = { error: 'Server validation error', details: e };
          }
        }
        
        setUserContext({
          localStorage: {
            ems_token: emsToken,
            ems_user: emsUser ? JSON.parse(emsUser) : null
          },
          sessionStorage: sessionData,
          cookies: cookies,
          token: emsToken,
          decodedToken: decodedToken,
          serverValidation: serverValidation
        });
        
      } catch (error) {
        console.error('Debug error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    debugUserContext();
  }, []);

  const clearAllData = async () => {
    try {
      // Clear all localStorage
      localStorage.clear();
      
      // Clear all sessionStorage
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });
      
      // Call server clear cache endpoint
      await fetch('/api/auth/clear-cache', { method: 'POST' });
      
      alert('All cached data cleared! Redirecting to login...');
      router.push('/login');
      
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Error clearing data. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Analyzing user context...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ Error: {error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🔍 User Context Debug</h1>
          
          <div className="mb-6">
            <button 
              onClick={clearAllData}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
            >
              🗑️ Clear All Cached Data & Redirect to Login
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* localStorage Data */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">📦 localStorage</h2>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-64">
                {JSON.stringify(userContext?.localStorage, null, 2)}
              </pre>
            </div>
            
            {/* sessionStorage Data */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">💾 sessionStorage</h2>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-64">
                {JSON.stringify(userContext?.sessionStorage, null, 2)}
              </pre>
            </div>
            
            {/* Cookies */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">🍪 Cookies</h2>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-64">
                {userContext?.cookies || 'No cookies found'}
              </pre>
            </div>
            
            {/* Decoded Token */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">🔑 Decoded JWT Token</h2>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-64">
                {JSON.stringify(userContext?.decodedToken, null, 2)}
              </pre>
            </div>
            
            {/* Server Validation */}
            <div className="bg-gray-50 p-4 rounded-lg lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">🖥️ Server Validation</h2>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-64">
                {JSON.stringify(userContext?.serverValidation, null, 2)}
              </pre>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Troubleshooting Steps:</h3>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Check if the JWT token contains the correct userId</li>
              <li>2. Verify that localStorage.ems_user has the correct user data</li>
              <li>3. Ensure server validation returns the correct user</li>
              <li>4. If data is inconsistent, click "Clear All Cached Data"</li>
              <li>5. Login again with admin credentials</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
