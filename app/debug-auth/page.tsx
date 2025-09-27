'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function DebugAuthPage() {
  const { token, user, isAuthenticated } = useAuth();
  const [localStorageData, setLocalStorageData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    // Get localStorage data
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('ems_token');
      const user = localStorage.getItem('ems_user');
      setLocalStorageData({
        token: token ? 'Present' : 'Not found',
        user: user ? JSON.parse(user) : null
      });
    }
  }, []);

  const fetchProfile = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      } else {
        setProfileData({ error: 'Failed to fetch profile' });
      }
    } catch (error) {
      setProfileData({ error: 'Network error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* useAuth Hook Data */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">useAuth Hook Data</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
              <p><strong>Token:</strong> {token ? 'Present' : 'Not found'}</p>
              <p><strong>User:</strong></p>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </div>

          {/* localStorage Data */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">localStorage Data</h2>
            <div className="space-y-2 text-sm">
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                {JSON.stringify(localStorageData, null, 2)}
              </pre>
            </div>
          </div>

          {/* Profile API Data */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile API Data</h2>
            <button
              onClick={fetchProfile}
              className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Fetch Profile
            </button>
            <div className="space-y-2 text-sm">
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                {JSON.stringify(profileData, null, 2)}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => {
                  localStorage.removeItem('ems_token');
                  localStorage.removeItem('ems_user');
                  window.location.reload();
                }}
                className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Clear Auth Data & Reload
              </button>
              <button
                onClick={() => window.location.href = '/login'}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
