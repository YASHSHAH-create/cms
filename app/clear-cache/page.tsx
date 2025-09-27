'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClearCachePage() {
  const router = useRouter();

  useEffect(() => {
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          caches.delete(cacheName);
        });
      });
    }

    // Clear localStorage
    localStorage.clear();

    // Clear sessionStorage
    sessionStorage.clear();

    // Force reload after clearing
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Clearing Cache...</h2>
        <p className="text-gray-600">Please wait while we clear all cached data and reload the application.</p>
      </div>
    </div>
  );
}
