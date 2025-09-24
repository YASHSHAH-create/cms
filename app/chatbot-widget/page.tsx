'use client';

import React, { useState } from 'react';
import ChatbotWidget from '@/components/ChatbotWidget';

export default function ChatbotWidgetPage() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(true); // Always open for widget

  return (
    <div className="min-h-screen bg-transparent">
      {/* Widget-only page - no header, no footer, just the chatbot */}
      <ChatbotWidget 
        isOpen={isChatbotOpen} 
        onToggle={() => setIsChatbotOpen(!isChatbotOpen)} 
        isIframe={true}
      />
    </div>
  );
}
