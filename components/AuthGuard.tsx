'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  role: string;
  email?: string;
  username?: string;
}

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
  allowedRoles?: string[];
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  requiredRole, 
  allowedRoles, 
  redirectTo 
}: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const validateSession = async () => {
      try {
        // Get token and user from localStorage
        const token = localStorage.getItem('ems_token');
        const userStr = localStorage.getItem('ems_user');

        if (!token || !userStr) {
          console.log('❌ No token or user data found');
          router.push('/login');
          return;
        }

        // Parse user data
        let userData: User;
        try {
          userData = JSON.parse(userStr);
        } catch (parseError) {
          console.error('❌ Error parsing user data:', parseError);
          localStorage.clear();
          router.push('/login');
          return;
        }

        // Validate session with server
        try {
          const response = await fetch('/api/auth/validate-session', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              // Update user data with server response
              const validatedUser = result.user;
              console.log('✅ Session validated:', validatedUser);
              
              // Update localStorage with validated data
              localStorage.setItem('ems_user', JSON.stringify(validatedUser));
              setUser(validatedUser);
              
              // Check role permissions
              if (requiredRole && validatedUser.role !== requiredRole) {
                console.log(`❌ Role mismatch: required ${requiredRole}, got ${validatedUser.role}`);
                setError(`Access denied. Required role: ${requiredRole}`);
                return;
              }
              
              if (allowedRoles && !allowedRoles.includes(validatedUser.role)) {
                console.log(`❌ Role not allowed: ${validatedUser.role}`);
                setError(`Access denied. Allowed roles: ${allowedRoles.join(', ')}`);
                return;
              }
              
              setLoading(false);
            } else {
              console.log('❌ Session validation failed:', result.message);
              localStorage.clear();
              router.push('/login');
            }
          } else {
            console.log('❌ Session validation request failed');
            localStorage.clear();
            router.push('/login');
          }
        } catch (fetchError) {
          console.error('❌ Session validation error:', fetchError);
          // Fallback to localStorage data if server is unavailable
          console.log('⚠️ Using localStorage data as fallback');
          setUser(userData);
          setLoading(false);
        }

      } catch (error) {
        console.error('❌ AuthGuard error:', error);
        setError('Authentication failed');
        setLoading(false);
      }
    };

    validateSession();
  }, [router, requiredRole, allowedRoles]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Validating session...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ {error}</div>
          <button 
            onClick={() => {
              localStorage.clear();
              router.push('/login');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Login Again
          </button>
        </div>
      </div>
    );
  }

  // Show children if authenticated and authorized
  return <>{children}</>;
}
