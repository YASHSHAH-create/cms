'use client';
import { useState } from 'react';

export default function TestLogin() {
  const [credentials, setCredentials] = useState({ username: 'admin', password: 'admin123' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      setResult({ status: response.status, data });
    } catch (error) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  const testUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-login');
      const data = await response.json();
      setResult({ status: response.status, data });
    } catch (error) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Login Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Username:</label>
          <input
            type="text"
            value={credentials.username}
            onChange={(e) => setCredentials({...credentials, username: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Password:</label>
          <input
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="space-x-4">
          <button
            onClick={testLogin}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Login'}
          </button>
          
          <button
            onClick={testUsers}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Check Users'}
          </button>
        </div>
        
        {result && (
          <div className="mt-6 p-4 bg-gray-100 rounded">
            <h3 className="font-bold mb-2">Result:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
