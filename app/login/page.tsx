'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use the login endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();

      if (data.success) {
        // Store token and user data
        localStorage.setItem('ems_token', data.token);
        localStorage.setItem('ems_user', JSON.stringify(data.user));
        
        // Redirect based on role
        if (data.user.role === 'admin') {
          router.push('/dashboard/admin');
        } else if (data.user.role === 'sales-executive') {
          router.push('/dashboard/executive'); // Sales executives use executive dashboard
        } else if (data.user.role === 'customer-executive') {
          router.push('/dashboard/customer-executive'); // Customer executives use customer dashboard
        } else {
          // Fallback for legacy 'executive' role
          router.push('/dashboard/executive');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      // More detailed error handling
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error. Please check your connection.');
      } else if (err.message) {
        setError(`Error: ${err.message}`);
      } else {
        setError('Server error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-[#2d4891] p-6 flex items-center justify-center">
          <Image src="/envirocare-logo.png" alt="Envirocare Labs" width={220} height={56} style={{ height: 'auto' }} />
        </div>
        <div className="bg-green-600 text-white text-center py-4 text-xl font-semibold">Login</div>

        <div className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Please enter the username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d4891] text-gray-900 placeholder-gray-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Please enter the password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d4891] text-gray-900 placeholder-gray-400"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <div className="mt-3 text-center text-sm">
            <Link href="/" className="text-blue-600 hover:text-blue-800">Back to site</Link>
          </div>
        </div>
      </div>
    </div>
  );
}


