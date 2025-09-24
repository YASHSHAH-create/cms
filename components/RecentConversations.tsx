import React, { useState } from 'react';

interface Visitor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  service: string;
  isConverted: boolean;
  createdAt: string;
  lastInteractionAt?: string;
}

interface Message {
  _id: string;
  visitorId: string;
  sender: 'user' | 'bot';
  message: string;
  at: string;
}

interface Conversation {
  visitor: Visitor;
  messages: Message[];
  messageCount: number;
  lastMessageAt?: string;
}

interface RecentConversationsProps {
  conversations: Conversation[];
}

export default function RecentConversations({ conversations }: RecentConversationsProps) {
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!conversations || conversations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Conversations</h3>
          <div className="text-center text-gray-500 py-8">
            No conversations available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Conversations</h3>
        <div className="space-y-3">
          {conversations.map((conversation, index) => (
            <div
              key={conversation.visitor._id}
              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {conversation.visitor.name ? conversation.visitor.name.charAt(0).toUpperCase() : 'A'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {conversation.visitor.name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {conversation.visitor.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {conversation.lastMessageAt ? formatTime(conversation.lastMessageAt) : 'No messages'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {conversation.messageCount} messages
                  </p>
                </div>
              </div>
              
              {conversation.messages && conversation.messages.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => setExpandedConversation(
                      expandedConversation === conversation.visitor._id ? null : conversation.visitor._id
                    )}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {expandedConversation === conversation.visitor._id ? 'Hide messages' : 'Show messages'}
                  </button>
                  
                  {expandedConversation === conversation.visitor._id && (
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {conversation.messages.slice(-3).map((message) => (
                        <div
                          key={message._id}
                          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs px-3 py-2 rounded-lg text-xs ${
                              message.sender === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p>{message.message}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatMessageTime(message.at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}