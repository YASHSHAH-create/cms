'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  department?: string;
  joinDate?: string;
  avatar?: string;
}

export default function ExecutiveProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: ''
  });
  // API_BASE not used in this component

  useEffect(() => {
    // Mock profile data - replace with API call
    const mockProfile: UserProfile = {
      id: '1',
      username: 'executive1',
      email: 'executive1@envirocarelabs.com',
      name: 'Customer Experience Executive 1',
      role: 'executive',
      phone: '+1-555-0123',
      department: 'Customer Experience',
      joinDate: '2024-01-15',
      avatar: '/api/placeholder/150/150'
    };

    setTimeout(() => {
      setProfile(mockProfile);
      setFormData({
        name: mockProfile.name,
        email: mockProfile.email,
        phone: mockProfile.phone || '',
        department: mockProfile.department || ''
      });
      setLoading(false);
    }, 1000);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (profile) {
        setProfile({
          ...profile,
          ...formData
        });
      }
      setIsEditing(false);
    } catch {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        department: profile.department || ''
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="w-64 bg-blue-900 text-white p-4">
          <h2 className="text-xl font-bold mb-4">Envirocare Labs</h2>
          <ul>
            <li className="mb-2">
              <Link href="/dashboard/executive" className="block px-3 py-2 rounded hover:bg-blue-800">
                Dashboard
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/dashboard/executive/enquiries" className="block px-3 py-2 rounded hover:bg-blue-800">
                Enquiries
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/dashboard/executive/chats" className="block px-3 py-2 rounded hover:bg-blue-800">
                Chat History
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/dashboard/executive/analytics" className="block px-3 py-2 rounded hover:bg-blue-800">
                Analytics
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/dashboard/executive/profile" className="block px-3 py-2 rounded bg-blue-800">
                Profile
              </Link>
            </li>
          </ul>
        </div>
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="w-64 bg-blue-900 text-white p-4">
          <h2 className="text-xl font-bold mb-4">Envirocare Labs</h2>
          <ul>
            <li className="mb-2">
              <Link href="/dashboard/executive" className="block px-3 py-2 rounded hover:bg-blue-800">
                Dashboard
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/dashboard/executive/enquiries" className="block px-3 py-2 rounded hover:bg-blue-800">
                Enquiries
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/dashboard/executive/chats" className="block px-3 py-2 rounded hover:bg-blue-800">
                Chat History
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/dashboard/executive/analytics" className="block px-3 py-2 rounded hover:bg-blue-800">
                Analytics
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/dashboard/executive/profile" className="block px-3 py-2 rounded bg-blue-800">
                Profile
              </Link>
            </li>
          </ul>
        </div>
        <div className="flex-1 p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-900 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Envirocare Labs</h2>
        <ul>
          <li className="mb-2">
            <Link href="/dashboard/executive" className="block px-3 py-2 rounded hover:bg-blue-800">
              Dashboard
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/dashboard/executive/enquiries" className="block px-3 py-2 rounded hover:bg-blue-800">
              Enquiries
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/dashboard/executive/chats" className="block px-3 py-2 rounded hover:bg-blue-800">
              Chat History
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/dashboard/executive/analytics" className="block px-3 py-2 rounded hover:bg-blue-800">
              Analytics
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/dashboard/executive/profile" className="block px-3 py-2 rounded bg-blue-800">
              Profile
            </Link>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Profile</h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Edit Profile
              </button>
            )}
          </div>

          {profile && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">{profile.name}</h2>
                    <p className="text-gray-500 capitalize">{profile.role}</p>
                    <p className="text-sm text-gray-400 mt-2">Member since {profile.joinDate ? new Date(profile.joinDate).toLocaleDateString() : 'N/A'}</p>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-600">{profile.email}</span>
                    </div>
                    {profile.phone && (
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-gray-600">{profile.phone}</span>
                      </div>
                    )}
                    {profile.department && (
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="text-gray-600">{profile.department}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Form */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {isEditing ? 'Edit Profile Information' : 'Profile Information'}
                  </h3>

                  {isEditing ? (
                    <form className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-black mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Department
                        </label>
                        <input
                          type="text"
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        />
                      </div>

                      <div className="flex space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={loading}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-black mb-1">
                          Full Name
                        </label>
                        <p className="text-gray-900">{profile.name}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-1">
                          Email
                        </label>
                        <p className="text-gray-900">{profile.email}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-1">
                          Phone Number
                        </label>
                        <p className="text-gray-900">{profile.phone || 'Not provided'}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Department
                        </label>
                        <p className="text-gray-900">{profile.department || 'Not specified'}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Role
                        </label>
                        <p className="text-gray-900 capitalize">{profile.role}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Username
                        </label>
                        <p className="text-gray-900">{profile.username}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Settings */}
                <div className="bg-white rounded-lg shadow p-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
                  <div className="space-y-4">
                    <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Change Password</p>
                          <p className="text-sm text-gray-500">Update your account password</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>

                    <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Notification Preferences</p>
                          <p className="text-sm text-gray-500">Manage your notification settings</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>

                    <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Privacy Settings</p>
                          <p className="text-sm text-gray-500">Control your privacy and data</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
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
