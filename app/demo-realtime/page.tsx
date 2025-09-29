'use client';

import React, { useState } from 'react';

export default function DemoRealtimePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const triggerUpdate = async (action: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/analytics/demo-realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          data: {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            message: `Demo ${action} event`
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        setLastUpdate(result.timestamp);
        console.log('✅ Real-time update triggered:', result.message);
      }
    } catch (error) {
      console.error('❌ Error triggering update:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔄 Real-Time Analytics Demo
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Live Dashboard Updates</h2>
          <p className="text-gray-600 mb-6">
            Click the buttons below to simulate real-time events and see how the analytics dashboard updates automatically.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => triggerUpdate('visitor_added')}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              👥 Add Visitor
            </button>
            
            <button
              onClick={() => triggerUpdate('enquiry_added')}
              disabled={isLoading}
              className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              📝 Add Enquiry
            </button>
            
            <button
              onClick={() => triggerUpdate('message_added')}
              disabled={isLoading}
              className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              💬 Add Message
            </button>
            
            <button
              onClick={() => triggerUpdate('conversion_updated')}
              disabled={isLoading}
              className="bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              📈 Update Conversion
            </button>
          </div>
          
          {lastUpdate && (
            <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
              <p className="text-green-800">
                ✅ Last update: {new Date(lastUpdate).toLocaleString()}
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">1</div>
              <div>
                <h3 className="font-medium">Event Trigger</h3>
                <p className="text-gray-600">Click any button to simulate a real-time event (visitor added, enquiry created, etc.)</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">2</div>
              <div>
                <h3 className="font-medium">Analytics Update</h3>
                <p className="text-gray-600">The real-time analytics system automatically fetches fresh data from the database</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">3</div>
              <div>
                <h3 className="font-medium">Dashboard Refresh</h3>
                <p className="text-gray-600">All connected dashboard components receive the update and refresh automatically</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">4</div>
              <div>
                <h3 className="font-medium">Live Updates</h3>
                <p className="text-gray-600">Charts, statistics, and tables update in real-time without page refresh</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a 
            href="/dashboard/admin" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🚀 Open Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
