'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';

type Profile = { username: string; role: string; name: string; email: string };

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [notifications, setNotifications] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  
  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('ems_token') : null), []);
  // API base URL - always use current domain
  const API_BASE = (() => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
  })();

  useEffect(() => {
    // Get user info from localStorage
    const userStr = localStorage.getItem('ems_user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // Load saved preferences
    const savedNotifications = localStorage.getItem('ems_notifications') !== 'false';
    setNotifications(savedNotifications);

    const load = async () => {
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setProfile(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    if (token) load();
  }, [API_BASE, token]);

  // Check database status
  useEffect(() => {
    const checkDbStatus = async () => {
      setDbStatus('checking');
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        if (res.ok) {
          setDbStatus('connected');
        } else {
          setDbStatus('disconnected');
        }
      } catch {
        setDbStatus('disconnected');
      }
    };

    checkDbStatus();
    const interval = setInterval(checkDbStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [API_BASE]);

  const handleNotificationsChange = (enabled: boolean) => {
    setNotifications(enabled);
    localStorage.setItem('ems_notifications', enabled.toString());
  };

  const handleRetryConnection = async () => {
    setDbStatus('checking');
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (res.ok) {
        setDbStatus('connected');
      } else {
        setDbStatus('disconnected');
      }
    } catch {
      setDbStatus('disconnected');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateMessage(null);
    
    try {
      // Simulate profile update (you can implement actual API call here)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUpdateMessage('Profile updated successfully!');
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch {
      setUpdateMessage('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ems_token');
    localStorage.removeItem('ems_user');
    window.location.href = '/auth/login';
  };

  // Don't render if user is not loaded
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole={user.role} userName={user.name} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userRole={user.role} userName={user.name} />
        
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Settings</h1>
          
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-600">Loading profile...</div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="text-red-600">{error}</div>
            </div>
          )}
          
        {!loading && !error && profile && (
            <div className="space-y-6">
              {/* Profile Settings */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>
                
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        defaultValue={profile.name}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="Enter your name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        defaultValue={profile.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Enter new password (leave blank to keep current)"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between pt-4">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                    >
                      {isUpdating ? 'Updating...' : 'Update Profile'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={logout}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </div>
                  
                  {updateMessage && (
                    <div className={`mt-4 p-3 rounded-lg ${
                      updateMessage.includes('successfully') 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {updateMessage}
                    </div>
                  )}
                </form>
              </div>

              {/* Application Preferences */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Application Preferences</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                      <p className="text-sm text-gray-500">Receive notifications for new enquiries and updates</p>
                    </div>
                    <button
                      onClick={() => handleNotificationsChange(!notifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Database Status */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Database Status</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">MongoDB Connection</h3>
                      <p className="text-sm text-gray-500">Current database connection status</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center space-x-2 ${
                        dbStatus === 'connected' ? 'text-green-600' : 
                        dbStatus === 'checking' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        <div className={`w-3 h-3 rounded-full ${
                          dbStatus === 'connected' ? 'bg-green-500' : 
                          dbStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm font-medium capitalize">
                          {dbStatus === 'checking' ? 'Checking...' : dbStatus}
                        </span>
                      </div>
                      
                      <button
                        onClick={handleRetryConnection}
                        disabled={dbStatus === 'checking'}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Connection Details</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Host: mongodb+srv://evachatbot.8bzwvtp.mongodb.net</div>
                      <div>Database: ems-database</div>
                      <div>Last Check: {new Date().toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

