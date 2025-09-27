'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClearSessionPage() {
  const [status, setStatus] = useState<string>('Clearing session...');
  const router = useRouter();

  useEffect(() => {
    const clearSession = async () => {
      try {
        // Clear all localStorage data
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear any cookies
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos) : c;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        });
        
        setStatus('Session cleared successfully!');
        
        // Wait a moment then redirect
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        
      } catch (error) {
        console.error('Error clearing session:', error);
        setStatus('Error clearing session. Please try again.');
      }
    };

    clearSession();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-gray-600 text-lg">{status}</div>
        <div className="text-gray-500 text-sm mt-2">Redirecting to login...</div>
      </div>
    </div>
  );
}
