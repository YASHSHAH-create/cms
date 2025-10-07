import React, { useState } from 'react';

interface Visitor {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  service?: string;
  isConverted?: boolean;
  createdAt: Date;
  lastInteractionAt?: Date;
}

interface Message {
  content: string;
  timestamp: Date;
  sender: string;
}

interface Conversation {
  visitor: Visitor;
  messages: Message[];
  messageCount: number;
  lastMessageAt?: Date;
}

interface RecentConversationsProps {
  conversations: Conversation[];
}

export default function RecentConversations({ conversations }: RecentConversationsProps) {
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);

  const formatTime = (timestamp: Date | string) => {
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

  const formatMessageTime = (timestamp: Date | string) => {
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Visitors (Past Week)</h3>
          <span className="text-sm text-gray-500">{conversations.length} visitors</span>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {conversations.filter(conversation => conversation && conversation.visitor).map((conversation, index) => {
            // Safety check - skip if visitor is undefined
            if (!conversation || !conversation.visitor) {
              return null;
            }
            
            return (
            <div
              key={`conversation-${conversation.visitor._id}-${index}`}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {conversation.visitor?.name ? conversation.visitor.name.charAt(0).toUpperCase() : 'A'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {conversation.visitor?.name || 'Anonymous'}
                      </p>
                      {conversation.visitor?.isConverted && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Converted
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {conversation.visitor?.email || 'No email'}
                    </p>
                    {conversation.visitor?.phone && (
                      <p className="text-xs text-gray-500 mb-1">
                        📞 {conversation.visitor.phone}
                      </p>
                    )}
                    {conversation.visitor?.organization && (
                      <p className="text-xs text-gray-500 mb-1">
                        🏢 {conversation.visitor.organization}
                      </p>
                    )}
                    {conversation.visitor?.service && (
                      <p className="text-xs text-blue-600 mb-1">
                        🔧 {conversation.visitor.service}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      Joined: {conversation.visitor?.createdAt ? formatTime(conversation.visitor.createdAt) : 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xs text-gray-500">
                    {conversation.lastMessageAt ? formatTime(conversation.lastMessageAt) : 'No messages'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {conversation.messageCount || 0} messages
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
                      {conversation.messages.slice(-3).map((message, messageIndex) => (
                        <div
                          key={`message-${messageIndex}`}
                          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs px-3 py-2 rounded-lg text-xs ${
                              message.sender === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p>{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatMessageTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}