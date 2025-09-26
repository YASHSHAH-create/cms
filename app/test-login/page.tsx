'use client';

import React, { useState } from 'react';

export default function TestLoginPage() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testDirectFetch = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      console.log('Testing direct fetch...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setResult(`✅ SUCCESS: Logged in as ${data.user.name} (${data.user.role})`);
      } else {
        setResult(`❌ FAILED: ${data.message}`);
      }
    } catch (error) {
      console.error('Test error:', error);
      setResult(`❌ ERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testWithAPI = async () => {
    setLoading(true);
    setResult('Testing with API helper...');
    
    try {
      const api = await import('@/lib/api');
      const data = await api.api.auth.login({ username: 'admin', password: 'admin123' });
      
      if (data.success) {
        setResult(`✅ API SUCCESS: Logged in as ${data.user.name} (${data.user.role})`);
      } else {
        setResult(`❌ API FAILED: ${data.message}`);
      }
    } catch (error) {
      console.error('API test error:', error);
      setResult(`❌ API ERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Login Debug Test</h1>
        
        <div className="space-y-4">
          <button
            onClick={testDirectFetch}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Test Direct Fetch
          </button>
          
          <button
            onClick={testWithAPI}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 ml-4"
          >
            Test with API Helper
          </button>
        </div>
        
        {result && (
          <div className="mt-8 p-4 bg-white rounded-lg shadow">
            <h3 className="font-bold mb-2">Result:</h3>
            <pre className="whitespace-pre-wrap">{result}</pre>
          </div>
        )}
        
        <div className="mt-8">
          <a href="/login" className="text-blue-600 hover:underline">
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}