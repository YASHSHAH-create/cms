'use client';

import { useState } from 'react';
import ChatbotWidget from '@/components/ChatbotWidget';

export default function IframeChatbotPage() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(true);

  return (
    <div className="min-h-screen w-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Chatbot Widget - Fixed dimensions for iframe */}
      <div className="w-full h-full max-w-md" style={{ height: '700px', maxHeight: '90vh' }}>
        <ChatbotWidget 
          isOpen={isChatbotOpen} 
          onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
          isIframe={true}
        />
      </div>
    </div>
  );
}

