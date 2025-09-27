'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClearAuthPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCleared, setIsCleared] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check current user data
    const userData = localStorage.getItem('ems_user');
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const handleClearAuth = () => {
    // Clear authentication data
    localStorage.removeItem('ems_token');
    localStorage.removeItem('ems_user');
    setIsCleared(true);
    
    // Redirect to login after a short delay
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Clear Authentication Data
        </h1>
        
        {currentUser && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Current User Data:</h3>
            <div className="text-sm text-yellow-700">
              <p><strong>Name:</strong> {currentUser.name}</p>
              <p><strong>Username:</strong> {currentUser.username}</p>
              <p><strong>Role:</strong> {currentUser.role}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
            </div>
          </div>
        )}

        {isCleared ? (
          <div className="text-center">
            <div className="text-green-600 text-lg font-semibold mb-4">
              ✅ Authentication data cleared successfully!
            </div>
            <p className="text-gray-600 mb-4">
              Redirecting to login page...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              This will clear your current authentication data and redirect you to the login page.
            </p>
            <button
              onClick={handleClearAuth}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Clear Authentication & Logout
            </button>
            <button
              onClick={() => router.back()}
              className="w-full mt-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
