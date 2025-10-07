'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

type Step =
  | 'ask_explore'
  | 'select_main_service'
  | 'select_water_type'
  | 'select_environmental_type'
  | 'select_food_category'
  | 'ask_elaborate'
  | 'end_confirm'
  | 'free_text';

const REPL_YES_NO = ['Yes', 'No'];

const MAIN_SERVICES = [
  'Water Testing',
  'Food Testing',
  'Environmental Testing',
  'Shelf-Life Study',
  'Others'
];

const WATER_TYPES = [
  'Drinking Water Testing',
  'FSSAI Compliance Water Testing',
  'Swimming Pool Water Testing',
  'Others'
];

const ENV_TYPES = [
  'ETP Water Testing',
  'STP Water Testing',
  'Ambient Air',
  'Stack Emission',
  'Workplace Monitoring',
  'IAQ [Indoor Air Quality]',
  'Noise Testing',
  'Illumination',
  'Others'
];

const FOOD_CATEGORIES = [
  'Dairy products and analogues',
  'Fats and oils, and fat emulsions',
  'Edible ices, including sherbet and sorbet',
  'Fruits, vegetables, seaweeds, nuts, and seeds',
  'Confectionery',
  'Cereals, grains, roots, tubers, pulses, and legumes',
  'Bakery products',
  'Meat and meat products including poultry',
  'Fish and fish products, including molluscs, crustaceans, and echinoderms',
  'Eggs and egg products',
  'Sweeteners, including honey',
  'Salts, spices, soups, sauces, salads, and protein products',
  'Foodstuffs for particular nutritional uses',
  'Beverages, excluding dairy products',
  'Ready-to-eat savouries',
  'Substances added to food',
  'Standardised Food Product',
  'Indian Sweets and Snacks',
  'Hemp Seeds and Seed Products',
  'Others'
];

const PAGE_SIZE = 6;

// Country codes for phone number dropdown
const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
  { code: '+975', country: 'Bhutan', flag: '🇧🇹' },
  { code: '+93', country: 'Afghanistan', flag: '🇦🇫' },
  { code: '+98', country: 'Iran', flag: '🇮🇷' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+212', country: 'Morocco', flag: '🇲🇦' },
  { code: '+213', country: 'Algeria', flag: '🇩🇿' },
  { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
  { code: '+218', country: 'Libya', flag: '🇱🇾' },
  { code: '+249', country: 'Sudan', flag: '🇸🇩' },
  { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
  { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+250', country: 'Rwanda', flag: '🇷🇼' },
  { code: '+257', country: 'Burundi', flag: '🇧🇮' },
  { code: '+258', country: 'Mozambique', flag: '🇲🇿' },
  { code: '+260', country: 'Zambia', flag: '🇿🇲' },
  { code: '+263', country: 'Zimbabwe', flag: '🇿🇼' },
  { code: '+267', country: 'Botswana', flag: '🇧🇼' },
  { code: '+268', country: 'Eswatini', flag: '🇸🇿' },
  { code: '+266', country: 'Lesotho', flag: '🇱🇸' },
  { code: '+264', country: 'Namibia', flag: '🇳🇦' },
  { code: '+265', country: 'Malawi', flag: '🇲🇼' },
  { code: '+261', country: 'Madagascar', flag: '🇲🇬' },
  { code: '+230', country: 'Mauritius', flag: '🇲🇺' },
  { code: '+248', country: 'Seychelles', flag: '🇸🇨' },
  { code: '+269', country: 'Comoros', flag: '🇰🇲' },
  { code: '+262', country: 'Réunion', flag: '🇷🇪' },
  { code: '+590', country: 'Guadeloupe', flag: '🇬🇵' },
  { code: '+596', country: 'Martinique', flag: '🇲🇶' },
  { code: '+594', country: 'French Guiana', flag: '🇬🇫' },
  { code: '+508', country: 'Saint Pierre and Miquelon', flag: '🇵🇲' },
  { code: '+687', country: 'New Caledonia', flag: '🇳🇨' },
  { code: '+689', country: 'French Polynesia', flag: '🇵🇫' },
  { code: '+681', country: 'Saint Martin', flag: '🇲🇫' }
];

interface VisitorData {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
}

interface BackendMessage {
  sender: 'user' | 'bot';
  message: string;
  timestamp: string;
}

interface Message {
  id: string;
  message: string;
  is_visitor: boolean;
  timestamp: string;
}

interface ChatbotWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
  isIframe?: boolean;
}

export default function ChatbotWidget({ isOpen, onToggle, isIframe = false }: ChatbotWidgetProps) {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'faq' | 'articles'>('home');
  const [showVisitorForm, setShowVisitorForm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showArticles, setShowArticles] = useState(false);
  const [conversationStep, setConversationStep] = useState<Step>('ask_explore');
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);
  const [quickReplyPage, setQuickReplyPage] = useState(0);
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [articlesSearchQuery, setArticlesSearchQuery] = useState('');
  const [isChatEnded, setIsChatEnded] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState('+91');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<VisitorData>();

  // FAQ Data with categories
  const faqData = [
    {
      id: 1,
      question: 'How do I schedule an environmental assessment?',
      answer: 'You can schedule an environmental assessment by contacting our team at info@envirocarelabs.com or calling +1-555-0123. We offer flexible scheduling including emergency assessments.',
      category: 'Scheduling',
      tags: ['assessment', 'environmental', 'scheduling', 'contact']
    },
    {
      id: 2,
      question: 'What are your laboratory testing services?',
      answer: 'We offer comprehensive testing services including water quality analysis, food safety testing, environmental monitoring, air quality assessment, and soil contamination testing.',
      category: 'Services',
      tags: ['testing', 'laboratory', 'water', 'food', 'environmental', 'air', 'soil']
    },
    {
      id: 3,
      question: 'How can I contact the support team?',
      answer: 'Our support team is available via email at support@envirocarelabs.com, phone at +1-555-0123, or through our live chat system. We respond within 2 hours during business hours.',
      category: 'Support',
      tags: ['contact', 'support', 'email', 'phone', 'chat']
    },
    {
      id: 4,
      question: 'What are your testing turnaround times?',
      answer: 'Standard tests typically take 3-5 business days. Rush services are available for urgent cases with results in 24-48 hours. Custom analysis may take 1-2 weeks.',
      category: 'Timing',
      tags: ['turnaround', 'timing', 'rush', 'urgent', 'custom']
    },
    {
      id: 5,
      question: 'Do you provide emergency response services?',
      answer: 'Yes, we offer 24/7 emergency response for environmental incidents, contamination events, and urgent testing needs. Call our emergency hotline for immediate assistance.',
      category: 'Emergency',
      tags: ['emergency', '24/7', 'urgent', 'incident', 'contamination']
    },
    {
      id: 6,
      question: 'What certifications do your laboratories have?',
      answer: 'Our laboratories are ISO 17025 accredited, NELAP certified, and EPA approved. We maintain strict quality control standards and participate in proficiency testing programs.',
      category: 'Certification',
      tags: ['certification', 'ISO', 'NELAP', 'EPA', 'accreditation', 'quality']
    }
  ];

  // Articles Data with categories
  const articlesData = [
    {
      id: 1,
      title: 'Guide to Environmental Sampling Best Practices',
      excerpt: 'Learn the essential techniques for proper environmental sample collection, preservation, and transportation to ensure accurate laboratory results.',
      category: 'Sampling',
      tags: ['sampling', 'environmental', 'best practices', 'collection', 'preservation'],
      readTime: '8 min read'
    },
    {
      id: 2,
      title: 'Understanding Water Quality Parameters',
      excerpt: 'A comprehensive overview of key water quality indicators including pH, dissolved oxygen, turbidity, and their significance in environmental assessment.',
      category: 'Water Quality',
      tags: ['water', 'quality', 'pH', 'dissolved oxygen', 'turbidity', 'parameters'],
      readTime: '12 min read'
    },
    {
      id: 3,
      title: 'Air Pollution Monitoring: A Practical Overview',
      excerpt: 'Explore modern air quality monitoring techniques, equipment selection, and data interpretation for environmental compliance and public health protection.',
      category: 'Air Quality',
      tags: ['air', 'pollution', 'monitoring', 'quality', 'compliance', 'health'],
      readTime: '15 min read'
    },
    {
      id: 4,
      title: 'Food Safety Testing: From Farm to Table',
      excerpt: 'Discover the critical testing protocols that ensure food safety throughout the supply chain, from agricultural production to consumer consumption.',
      category: 'Food Safety',
      tags: ['food', 'safety', 'testing', 'supply chain', 'agriculture', 'consumption'],
      readTime: '10 min read'
    },
    {
      id: 5,
      title: 'Soil Contamination Assessment Methods',
      excerpt: 'An in-depth look at soil sampling strategies, analytical methods, and risk assessment protocols for contaminated site investigation.',
      category: 'Soil Analysis',
      tags: ['soil', 'contamination', 'sampling', 'analysis', 'risk assessment', 'investigation'],
      readTime: '14 min read'
    },
    {
      id: 6,
      title: 'Environmental Compliance Reporting',
      excerpt: 'Navigate the complex world of environmental regulations and learn how to prepare comprehensive compliance reports for regulatory agencies.',
      category: 'Compliance',
      tags: ['compliance', 'regulations', 'reporting', 'environmental', 'regulatory', 'agencies'],
      readTime: '18 min read'
    }
  ];

  // Filtered FAQ data based on search
  const filteredFaqs = faqData.filter(faq => 
    faq.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
    faq.tags.some(tag => tag.toLowerCase().includes(faqSearchQuery.toLowerCase()))
  );

  // Filtered Articles data based on search
  const filteredArticles = articlesData.filter(article => 
    article.title.toLowerCase().includes(articlesSearchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(articlesSearchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(articlesSearchQuery.toLowerCase()) ||
    article.tags.some(tag => tag.toLowerCase().includes(articlesSearchQuery.toLowerCase()))
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, quickReplies]);

  useEffect(() => {
    if (conversationStep === 'select_food_category') {
      const start = quickReplyPage * PAGE_SIZE;
      const paginated = FOOD_CATEGORIES.slice(start, start + PAGE_SIZE);
      let replies = [...paginated];
      if (quickReplyPage > 0) replies = ['Previous', ...replies];
      if (start + PAGE_SIZE < FOOD_CATEGORIES.length) replies = [...replies, 'Next'];
      replies.push('Back');
      setQuickReplies(replies);
    }
  }, [conversationStep, quickReplyPage]);

  useEffect(() => {
    const storedVisitorId = localStorage.getItem('envirocareVisitorId');
    if (storedVisitorId) {
      setVisitorId(storedVisitorId);
      setIsRegistered(true);
      setShowVisitorForm(false);
      setShowChat(true);
      setConversationStep('free_text');
      setIsFetchingMessages(true);
      fetchMessages(storedVisitorId)
        .then((fetchedMessages) => {
          setMessages(fetchedMessages);
          if (fetchedMessages.length === 0) {
            const greeting = `Welcome back to Envirocare Labs, ${localStorage.getItem('envirocareVisitorName') || 'friend'}! I'm Eva, your Virtual Assistant. How can I assist you today? 😊`;
            const newMessage: Message = {
              id: crypto.randomUUID(),
              message: greeting,
              is_visitor: false,
              timestamp: new Date().toISOString()
            };
            setMessages([newMessage]);
            appendMessage(storedVisitorId, 'bot', greeting).catch((err) => {
              console.error('Failed to append greeting:', err);
              alert('Failed to save welcome message. Please try again.');
            });
          }
        })
        .catch((error) => {
          console.error('Error fetching messages:', error);
          const fallbackMessage: Message = {
            id: crypto.randomUUID(),
            message: 'Welcome back! I couldn’t load your previous chat. How can I assist you today?',
            is_visitor: false,
            timestamp: new Date().toISOString()
          };
          setMessages([fallbackMessage]);
          appendMessage(storedVisitorId, 'bot', fallbackMessage.message).catch((err) => {
            console.error('Failed to append fallback message:', err);
          });
        })
        .finally(() => setIsFetchingMessages(false));
    }
  }, []);

  // Close country dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCountryDropdown) {
        const target = event.target as Element;
        if (!target.closest('.country-dropdown')) {
          setShowCountryDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCountryDropdown]);

  async function upsertVisitor(data: VisitorData): Promise<string> {
    setIsLoading(true);
    try {
      // Get service and subservice from localStorage
      const service = localStorage.getItem('envirocareCurrentService') || 'General Inquiry';
      const subservice = localStorage.getItem('envirocareCurrentSubservice') || '';
      
      console.log(`👤 Creating/updating visitor:`, { name: data.name, email: data.email, service, subservice });
      
      const res = await fetch(`${API_BASE}/api/visitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          service: service,
          subservice: subservice,
          source: 'chatbot',
          meta: { widget: 'site', consent: true }
        })
      });
      
      console.log(`📡 Visitor creation response status: ${res.status} ${res.statusText}`);
      
      const out = await res.json();
      console.log(`📦 Visitor creation response:`, out);
      
      if (!res.ok) {
        console.error(`❌ Failed to create visitor - HTTP ${res.status}:`, out);
        // Provide more specific error messages
        if (res.status === 400) {
          throw new Error(`Invalid data: ${out.message || 'Please check your information'}`);
        } else if (res.status === 500) {
          throw new Error(`Server error: ${out.message || 'Please try again later'}`);
        } else {
          throw new Error(`Error ${res.status}: ${out.message || 'Failed to save visitor'}`);
        }
      }
      
      // Check for correct response format: {success: true, visitor: {_id: ...}}
      if (!out.success || !out.visitor || !out.visitor._id) {
        console.error(`❌ Invalid visitor creation response:`, out);
        throw new Error(out.message || 'Failed to save visitor');
      }
      
      console.log(`✅ Visitor created/updated successfully with ID: ${out.visitor._id}`);
      return out.visitor._id as string;
    } catch (error) {
      console.error(`❌ Error creating/updating visitor:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function appendMessage(visitorId: string, sender: 'user' | 'bot', message: string): Promise<void> {
    try {
      // Validate visitor ID format
      if (!visitorId || !isValidObjectId(visitorId)) {
        console.warn(`⚠️ Invalid visitor ID format: ${visitorId}`);
        return; // Don't make API call for invalid IDs
      }
      
      console.log(`💬 Appending ${sender} message for visitor: ${visitorId}`);
      
      const res = await fetch(`${API_BASE}/api/chat/${visitorId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender, message })
      });
      
      console.log(`📡 Save message response status: ${res.status} ${res.statusText}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(`❌ Failed to save message - HTTP ${res.status}:`, errorData);
        
        if (res.status === 404) {
          console.warn(`⚠️ Visitor ${visitorId} not found - message will be lost`);
          return; // Don't throw, just log and continue
        }
        
        // For other errors, don't throw to prevent UI crashes
        console.warn(`⚠️ Message not saved due to server error, but continuing...`);
        return;
      }
      
      console.log(`✅ Message saved successfully`);
    } catch (error) {
      console.error(`❌ Error appending message for visitor ${visitorId}:`, error);
      // Don't throw error to prevent UI crashes, just log it
    }
  }


  async function createEnquiry(visitorData: { name: string; email: string; phone: string; organization?: string; region?: string; location?: string }, service: string, enquiryDetails: string): Promise<void> {
    try {
      const subservice = localStorage.getItem('envirocareCurrentSubservice') || '';
      const res = await fetch(`${API_BASE}/api/analytics/chatbot-enquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: visitorData.name,
          email: visitorData.email,
          phone: visitorData.phone,
          organization: visitorData.organization || '',
          service,
          subservice,
          enquiryDetails,
          location: visitorData.location || ''
        })
      });
      if (!res.ok) {
        console.warn('⚠️ Failed to create enquiry - continuing without enquiry');
        return; // Don't throw error, just log and continue
      }
      console.log('✅ Enquiry created successfully');
    } catch (error) {
      console.warn('⚠️ Error creating enquiry - continuing without enquiry:', error);
      // Don't throw error to prevent chat interruption
    }
  }

  // Helper function to validate MongoDB ObjectId format
  function isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  async function fetchMessages(visitorId: string): Promise<Message[]> {
    setIsFetchingMessages(true);
    try {
      // Validate visitor ID format
      if (!visitorId || !isValidObjectId(visitorId)) {
        console.warn(`⚠️ Invalid visitor ID format: ${visitorId}`);
        return []; // Return empty array for invalid IDs
      }
      
      console.log(`🔍 Fetching messages for visitor: ${visitorId}`);
      
      const res = await fetch(`${API_BASE}/api/chat/${visitorId}/messages/public`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`📡 Response status: ${res.status} ${res.statusText}`);
      
      const out = await res.json();
      console.log(`📦 Response data:`, out);
      
      if (!res.ok) {
        console.error(`❌ HTTP Error ${res.status}:`, out);
        if (res.status === 404) {
          console.warn(`⚠️ Visitor ${visitorId} not found - this might be a new visitor`);
          return []; // Return empty array for new visitors
        }
        // For other errors, return empty array instead of throwing
        console.warn(`⚠️ Could not fetch messages due to server error, returning empty array`);
        return [];
      }
      
      if (!out.ok) {
        console.error(`❌ API Error:`, out);
        throw new Error(out.message || 'Failed to fetch messages');
      }
      
      const messages = out.messages.map((msg: BackendMessage) => ({
        id: crypto.randomUUID(),
        message: msg.message,
        is_visitor: msg.sender === 'user',
        timestamp: msg.timestamp
      }));
      
      console.log(`✅ Successfully fetched ${messages.length} messages`);
      return messages;
    } catch (error) {
      console.error(`❌ Error fetching messages for visitor ${visitorId}:`, error);
      // Don't throw error, just return empty array to prevent UI crashes
      return [];
    } finally {
      setIsFetchingMessages(false);
    }
  }

  const resetChat = () => {
    localStorage.removeItem('envirocareVisitorId');
    localStorage.removeItem('envirocareVisitorName');
    setVisitorId(null);
    setIsRegistered(false);
    setMessages([]);
    setShowVisitorForm(true);
    setShowChat(false);
    setConversationStep('ask_explore');
    setQuickReplies([]);
    setQuickReplyPage(0);
    setIsChatEnded(false);
  };

  const onSubmitVisitorData = async (data: VisitorData) => {
    setIsLoading(true);
    try {
      console.log(`🚀 Starting chat for visitor:`, data.name);
      
      // Combine country code with phone number
      const visitorDataWithCountryCode = {
        ...data,
        phone: data.phone ? `${selectedCountryCode}${data.phone}` : '',
        countryCode: selectedCountryCode
      };
      
      const id = await upsertVisitor(visitorDataWithCountryCode);
      console.log(`✅ Visitor created with ID: ${id}`);
      
      setVisitorId(id);
      localStorage.setItem('envirocareVisitorId', id);
      localStorage.setItem('envirocareVisitorName', data.name);
      localStorage.setItem('envirocareVisitorEmail', data.email);
      localStorage.setItem('envirocareVisitorPhone', data.phone || '');
      setIsRegistered(true);
      reset();
      setShowVisitorForm(false);
      setShowChat(true);

      const greeting = `Hello ${data.name}! 👋 Welcome to *Envirocare Labs*! I'm Eva, your Virtual Assistant. Would you like to explore our services or have a specific question?`;
      const botMsg = greeting;

      setMessages([
        { id: crypto.randomUUID(), message: botMsg, is_visitor: false, timestamp: new Date().toISOString() }
      ]);
      
      // Try to save the greeting message, but don't fail if it doesn't work
      try {
        await appendMessage(id, 'bot', botMsg);
      } catch (error) {
        console.warn(`⚠️ Could not save greeting message:`, error);
        // Continue anyway - the message is already displayed in the UI
      }

      // Automatically create an enquiry for every new visitor (non-blocking)
      createEnquiry(data, 'Initial Contact', `New visitor ${data.name} started a conversation`)
        .then(() => console.log(`✅ Enquiry created for visitor: ${data.name}`))
        .catch((error) => console.warn(`⚠️ Could not create enquiry for visitor:`, error));

      setConversationStep('ask_explore');
      setQuickReplies([...REPL_YES_NO, 'Ask a question']);
      setIsChatEnded(false);
      
      console.log(`🎉 Chat started successfully for ${data.name}`);
    } catch (err) {
      console.error('❌ Error saving visitor:', err);
      alert('Failed to start chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = async (choice: string) => {
    if (!visitorId || isLoading) return;

    const pushUser = async (text: string) => {
      const m = { id: crypto.randomUUID(), message: text, is_visitor: true, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, m]);
      try { 
        await appendMessage(visitorId, 'user', text); 
      } catch (error) {
        console.warn(`⚠️ Could not save user message:`, error);
        // Message is already displayed in UI, so continue
      }
    };

    const pushBot = async (text: string) => {
      const m = { id: crypto.randomUUID(), message: text, is_visitor: false, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, m]);
      try { 
        await appendMessage(visitorId, 'bot', text); 
      } catch (error) {
        console.warn(`⚠️ Could not save bot message:`, error);
        // Message is already displayed in UI, so continue
      }
    };

    setQuickReplies([]);
    if (choice === 'Previous' || choice === 'Next') {
      const delta = choice === 'Next' ? 1 : -1;
      setQuickReplyPage(prev => Math.max(0, prev + delta));
      return;
    }

    if (choice === 'Back') {
      let botMsg = '';
      let nextStep: Step = 'ask_explore';
      let nextReplies: string[] = [...REPL_YES_NO, 'Ask a question'];

      if (conversationStep === 'select_main_service') {
        botMsg = `Would you like to explore our services or have a specific question?`;
      } else if (['select_water_type', 'select_environmental_type', 'select_food_category'].includes(conversationStep)) {
        botMsg = 'Envirocare Labs offers a wide range of services! Which one are you interested in?';
        nextStep = 'select_main_service';
        nextReplies = [...MAIN_SERVICES, 'Back'];
      } else if (conversationStep === 'ask_elaborate') {
        botMsg = 'Envirocare Labs offers a wide range of services! Which one are you interested in?';
        nextStep = 'select_main_service';
        nextReplies = [...MAIN_SERVICES, 'Back'];
      } else {
        return;
      }

      await pushUser('Back');
      await pushBot(botMsg);
      setConversationStep(nextStep);
      setQuickReplyPage(0);
      setQuickReplies(nextReplies);
      return;
    }

    setIsLoading(true);
    await pushUser(choice);

    try {
      switch (conversationStep) {
        case 'ask_explore': {
          if (choice.toLowerCase() === 'yes') {
            await pushBot('Envirocare Labs offers a wide range of services! Which one are you interested in?');
            setConversationStep('select_main_service');
            setQuickReplies([...MAIN_SERVICES, 'Back']);
          } else if (choice === 'Ask a question') {
            await pushBot('Go ahead and ask me anything! 😊');
            setConversationStep('free_text');
          } else {
            await pushBot('No problem! Is there something specific I can help you with?');
            setConversationStep('free_text');
          }
          break;
        }

        case 'select_main_service': {
          if (choice === 'Water Testing') {
            localStorage.setItem('envirocareCurrentService', choice);
            await pushBot('Awesome! 💧 Water Testing is one of our specialties. What type of water testing are you interested in?');
            setConversationStep('select_water_type');
            setQuickReplies([...WATER_TYPES, 'Back']);
          } else if (choice === 'Environmental Testing') {
            localStorage.setItem('envirocareCurrentService', choice);
            await pushBot('Great choice! 🌱 Environmental Testing is key to sustainability. What specific environmental service do you need?');
            setConversationStep('select_environmental_type');
            setQuickReplies([...ENV_TYPES, 'Back']);
          } else if (choice === 'Food Testing') {
            localStorage.setItem('envirocareCurrentService', choice);
            await pushBot('Perfect! 🥫 Food Testing ensures safety and quality. Please select a food category:');
            setConversationStep('select_food_category');
            setQuickReplyPage(0);
          } else if (choice === 'Shelf-Life Study') {
            localStorage.setItem('envirocareCurrentService', choice);
            await pushBot('Interesting! Shelf-Life Studies help optimize product longevity. Would you like to provide more details about your needs?');
            setConversationStep('ask_elaborate');
            setQuickReplies([...REPL_YES_NO, 'Back']);
          } else {
            await pushBot('Could you specify what kind of service you’re looking for? I’m here to help! 🤔');
            setConversationStep('free_text');
          }
          break;
        }

        case 'select_water_type': {
          localStorage.setItem('envirocareCurrentSubservice', choice);
          await pushBot(`Got it! You selected ${choice}. Would you like to share more details about your water testing needs?`);
          setConversationStep('ask_elaborate');
          setQuickReplies([...REPL_YES_NO, 'Back']);
          break;
        }

        case 'select_environmental_type': {
          localStorage.setItem('envirocareCurrentSubservice', choice);
          await pushBot(`Nice! You chose ${choice}. Want to dive deeper into your environmental testing requirements?`);
          setConversationStep('ask_elaborate');
          setQuickReplies([...REPL_YES_NO, 'Back']);
          break;
        }

        case 'select_food_category': {
          localStorage.setItem('envirocareCurrentSubservice', choice);
          await pushBot(`You selected ${choice}. Would you like to elaborate on your food testing needs?`);
          setConversationStep('ask_elaborate');
          setQuickReplies([...REPL_YES_NO, 'Back']);
          break;
        }

        case 'ask_elaborate': {
          if (choice.toLowerCase() === 'yes') {
            await pushBot('Great! Please share more details, and I\'ll assist you further. 😊');
            // Set flag to indicate we're waiting for elaboration
            localStorage.setItem('envirocareWaitingForElaboration', 'true');
            setConversationStep('free_text');
          } else {
            // Create enquiry when visitor shows interest but doesn't want to elaborate
            try {
              const visitorData = {
                name: localStorage.getItem('envirocareVisitorName') || '',
                email: localStorage.getItem('envirocareVisitorEmail') || '',
                phone: localStorage.getItem('envirocareVisitorPhone') || '',
                organization: localStorage.getItem('envirocareVisitorOrg') || ''
              };
              
              // Get the service from conversation context
              const service = localStorage.getItem('envirocareCurrentService') || 'General Inquiry';
              const enquiryDetails = `Interest in ${service} - Visitor chose not to elaborate further`;
              
              // Create enquiry without blocking the chat flow
              createEnquiry(visitorData, service, enquiryDetails)
                .then(() => console.log('✅ Enquiry created successfully'))
                .catch((error) => console.warn('⚠️ Could not create enquiry:', error));
              
              await pushBot('Perfect! I\'ve created an enquiry for you. Our team will reach out soon to assist you. Have a great day! 😇');
            } catch (error) {
              console.error('Error in end_confirm:', error);
              await pushBot('Thank you for your interest! Our team will reach out soon to assist you. Have a great day! 😇');
            }
            await pushBot('Is there anything else I can help you with today?');
            setConversationStep('end_confirm');
            setQuickReplies(['Continue chat', 'End chat']);
          }
          break;
        }

        case 'end_confirm': {
          if (choice === 'Continue chat') {
            await pushBot('Awesome, let’s keep going! What’s on your mind?');
            setConversationStep('free_text');
          } else {
            await pushBot('Thanks for chatting with Envirocare Labs! Feel free to reach out anytime. 😊');
            setConversationStep('free_text');
            setQuickReplies([]);
            setIsChatEnded(true);
          }
          break;
        }

        default:
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !visitorId || isLoading) return;

    const visitorMessage: Message = {
      id: crypto.randomUUID(),
      message: newMessage,
      is_visitor: true,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, visitorMessage]);
    try {
      await appendMessage(visitorId, 'user', visitorMessage.message);
    } catch (error) {
      console.error('Error saving user message:', error);
      alert('Failed to save your message. Please try again.');
    }
    setNewMessage('');
    setIsLoading(true);

    try {
      // Check if we're in elaboration mode (user said "yes" to elaborate)
      if (conversationStep === 'free_text' && localStorage.getItem('envirocareWaitingForElaboration') === 'true') {
        console.log('🔄 Customer is elaborating, updating enquiry details...');
        
        try {
          // Update the enquiry details with the customer's elaboration
          const response = await fetch(`${API_BASE}/api/visitors/${visitorId}/enquiry-details`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              enquiryDetails: newMessage.trim()
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log('✅ Enquiry details updated successfully:', result);
            
            // Clear the elaboration flag
            localStorage.removeItem('envirocareWaitingForElaboration');
            
            // Create the enquiry with the elaborated details
            const visitorData = {
              name: localStorage.getItem('envirocareVisitorName') || '',
              email: localStorage.getItem('envirocareVisitorEmail') || '',
              phone: localStorage.getItem('envirocareVisitorPhone') || '',
              organization: localStorage.getItem('envirocareVisitorOrg') || ''
            };
            
            const service = localStorage.getItem('envirocareCurrentService') || 'General Inquiry';
            const enquiryDetails = newMessage.trim();
            
            // Create enquiry with elaborated details
            createEnquiry(visitorData, service, enquiryDetails)
              .then(() => console.log('✅ Enquiry created with elaborated details'))
              .catch((error) => console.warn('⚠️ Could not create enquiry:', error));
            
            const botResponse = 'Thank you for providing those details! I\'ve created a detailed enquiry for you. Our team will reach out soon to assist you with your specific needs. Have a great day! 😊';
            
            const botMessage: Message = {
              id: crypto.randomUUID(),
              message: botResponse,
              is_visitor: false,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, botMessage]);
            
            try {
              await appendMessage(visitorId, 'bot', botResponse);
            } catch (error) {
              console.error('Error saving bot response:', error);
            }
            
            setConversationStep('end_confirm');
            setQuickReplies(['Continue chat', 'End chat']);
            setIsLoading(false);
            return;
          } else {
            console.error('❌ Failed to update enquiry details:', response.status);
          }
        } catch (error) {
          console.error('❌ Error updating enquiry details:', error);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      let botResponse = '';
      const lowerMessage = newMessage.toLowerCase();

      if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        botResponse = `Hi there! I'm Eva from Envirocare Labs. What's on your mind today? 😊`;
      } else if (lowerMessage.includes('help') || lowerMessage.includes('assist')) {
        botResponse = `I’m here to help with:\n• Exploring our services (Water, Food, Environmental Testing, etc.)\n• Answering questions about our lab\n• Scheduling assessments\n• Contact info\nWhat would you like to dive into?`;
      } else if (lowerMessage.includes('contact') || lowerMessage.includes('email') || lowerMessage.includes('phone')) {
        botResponse = `You can reach us at:\n📧 info@envirocarelabs.com\n📞 +1-555-0123\nWe're open Monday-Friday, 9AM-6PM EST. Want to explore our services too?`;
        setQuickReplies([...REPL_YES_NO, 'Ask another question']);
        setConversationStep('ask_explore');
      } else if (lowerMessage.includes('hours') || lowerMessage.includes('time') || lowerMessage.includes('open')) {
        botResponse = `Our hours are:\n🕘 Monday-Friday: 9AM-6PM EST\n🕘 Saturday: 10AM-4PM EST\n🕘 Sunday: Closed\nWe also offer 24/7 emergency support for urgent environmental issues. Anything else I can assist with?`;
        setQuickReplies(['Continue chat', 'End chat']);
        setConversationStep('end_confirm');
      } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing')) {
        botResponse = `Pricing depends on your needs:\n• Basic Assessment: $299\n• Comprehensive Analysis: $599\n• Custom Solutions: Contact us for a quote\nWould you like to discuss a specific service?`;
        setQuickReplies([...REPL_YES_NO, 'Ask another question']);
        setConversationStep('ask_explore');
      } else {
        botResponse = `I'd be happy to help you with our services, contact information, or any other questions you might have! 😊`;
        setQuickReplies(['Explore services', 'Ask another question']);
        setConversationStep('ask_explore');
      }

      const botMessage: Message = {
        id: crypto.randomUUID(),
        message: botResponse,
        is_visitor: false,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMessage]);
      try {
        await appendMessage(visitorId, 'bot', botResponse);
      } catch (error) {
        console.error('Error saving bot response:', error);
        alert('Failed to save bot response. Please try again.');
      }

      if (conversationStep === 'free_text' && !['contact', 'email', 'phone', 'hours', 'time', 'open', 'price', 'cost', 'pricing'].some(keyword => lowerMessage.includes(keyword))) {
        await appendMessage(visitorId, 'bot', 'Is there anything else I can help you with today?');
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          message: 'Is there anything else I can help you with today?',
          is_visitor: false,
          timestamp: new Date().toISOString()
        }]);
        setConversationStep('end_confirm');
        setQuickReplies(['Continue chat', 'End chat']);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        message: 'Sorry, I encountered an error. Please try again.',
        is_visitor: false,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      try {
        await appendMessage(visitorId, 'bot', errorMessage.message);
      } catch (err) {
        console.error('Failed to save error message:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && conversationStep === 'free_text') {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTabChange = (tab: 'home' | 'chat' | 'faq' | 'articles') => {
    setActiveTab(tab);
    if (tab === 'home') {
      setShowVisitorForm(false);
      setShowChat(false);
      setShowFAQ(false);
      setShowArticles(false);
    } else if (tab === 'chat') {
      const storedVisitorId = localStorage.getItem('envirocareVisitorId');
      if (!isRegistered && !storedVisitorId) {
        setShowVisitorForm(true);
        setShowChat(false);
      } else if (storedVisitorId && !isRegistered) {
        setVisitorId(storedVisitorId);
        setIsRegistered(true);
        setShowVisitorForm(false);
        setShowChat(true);
        setConversationStep('free_text');
        setIsFetchingMessages(true);
        fetchMessages(storedVisitorId)
          .then((fetchedMessages) => {
            setMessages(fetchedMessages);
            if (fetchedMessages.length === 0) {
              const greeting = `Welcome back to Envirocare Labs, ${localStorage.getItem('envirocareVisitorName') || 'friend'}! I'm Eva, your Virtual Assistant. How can I assist you today? 😊`;
              const newMessage: Message = {
                id: crypto.randomUUID(),
                message: greeting,
                is_visitor: false,
                timestamp: new Date().toISOString()
              };
              setMessages([newMessage]);
              appendMessage(storedVisitorId, 'bot', greeting).catch((err) => {
                console.error('Failed to append greeting:', err);
                alert('Failed to save welcome message. Please try again.');
              });
            }
          })
          .catch((error) => {
            console.error('Error fetching messages:', error);
            const fallbackMessage: Message = {
              id: crypto.randomUUID(),
              message: 'Welcome back! I couldn’t load your previous chat. How can I assist you today?',
              is_visitor: false,
              timestamp: new Date().toISOString()
            };
            setMessages([fallbackMessage]);
            appendMessage(storedVisitorId, 'bot', fallbackMessage.message).catch((err) => {
              console.error('Failed to append fallback message:', err);
            });
          })
          .finally(() => setIsFetchingMessages(false));
      } else {
        setShowChat(true);
      }
      setShowFAQ(false);
      setShowArticles(false);
    } else if (tab === 'faq') {
      setShowFAQ(true);
      setShowVisitorForm(false);
      setShowChat(false);
      setShowArticles(false);
    } else if (tab === 'articles') {
      setShowArticles(true);
      setShowFAQ(false);
      setShowVisitorForm(false);
      setShowChat(false);
    }
  };

  if (!isOpen) return null;

  // Iframe mode: fixed dimensions with border and shadow
  const containerClasses = isIframe 
    ? "w-full h-full bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col font-poppins overflow-hidden"
    : "fixed top-20 bottom-20 right-6 w-96 h-[500px] bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden font-poppins flex flex-col backdrop-blur-sm bg-white/95";

  return (
    <div className={containerClasses}>
      {/* Enhanced Header */}
      <div className={`text-white p-5 bg-gradient-to-r from-[#2d4891] to-[#1e3a8a] ${isIframe ? 'rounded-t-2xl' : 'rounded-t-3xl'}`}>
        <div className="flex items-center justify-between">
          <button className="text-white/80 hover:text-white transition-colors duration-200 p-1 rounded-lg hover:bg-white/10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center justify-center flex-1">
            <Image src="/envirocare-logo.png" alt="Envirocare Labs" width={160} height={40} className="drop-shadow-sm" />
          </div>
          {!isIframe && (
            <button
              onClick={onToggle}
              className="text-white/80 hover:text-white transition-colors duration-200 p-1 rounded-lg hover:bg-white/10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Content Area */}
      <div className="flex-1 p-5 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
        {activeTab === 'home' && !showVisitorForm && !showChat && !showFAQ && (
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-700 leading-relaxed">
                Hey! How can we help you today?
              </h2>
              <p className="text-gray-600 text-base font-medium">I&apos;m Eva, your AI assistant. Let&apos;s get started!</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleTabChange('chat')}
                className="w-full bg-gradient-to-r from-[#2d4891] to-[#1e3a8a] text-white py-4 px-6 rounded-xl hover:from-[#1e3a8a] hover:to-[#1e3a8a] transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="font-semibold">Chat with Eva now</span>
              </button>
              <button className="w-full bg-white text-gray-700 py-4 px-6 rounded-xl hover:bg-gray-50 transition-all duration-200 border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md">
                <span className="font-medium">Blogs / Events</span>
              </button>
            </div>
          </div>
        )}

        {showVisitorForm && (
          <div className="space-y-5">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Welcome to Envirocare Labs!</h3>
              <p className="text-gray-600 text-sm">Please provide your details to start the conversation!</p>
            </div>
            <form onSubmit={handleSubmit(onSubmitVisitorData)} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d4891] focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-900"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-2">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d4891] focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-900"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-2">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <div className="flex items-stretch">
                  {/* Country Code Dropdown */}
                  <div className="relative country-dropdown">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="flex items-center justify-center px-3 py-3 border-2 border-r-0 border-gray-200 rounded-l-xl bg-white/80 backdrop-blur-sm text-gray-900 hover:bg-gray-50 transition-all duration-200 w-24 h-12 focus:outline-none focus:ring-2 focus:ring-[#2d4891] focus:border-transparent"
                    >
                      <span className="text-sm font-medium flex items-center">
                        <span className="mr-1">{COUNTRY_CODES.find(c => c.code === selectedCountryCode)?.flag}</span>
                        <span>{selectedCountryCode}</span>
                      </span>
                      <svg className="w-3 h-3 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showCountryDropdown && (
                      <div className="absolute top-full left-0 z-50 w-72 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl mt-1">
                        <div className="p-1">
                          <div className="text-xs font-medium text-gray-500 mb-1 px-3 py-2 border-b border-gray-100">Select Country</div>
                          {COUNTRY_CODES.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => {
                                setSelectedCountryCode(country.code);
                                setShowCountryDropdown(false);
                              }}
                              className={`w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50 rounded transition-colors ${
                                selectedCountryCode === country.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                              }`}
                            >
                              <span className="mr-3 text-base">{country.flag}</span>
                              <span className="font-medium mr-3 w-12 text-left">{country.code}</span>
                              <span className="text-gray-600 truncate">{country.country}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Phone Number Input */}
                  <input
                    {...register('phone', {
                      pattern: {
                        value: /^[0-9]{7,15}$/,
                        message: 'Please enter a valid phone number (7-15 digits)'
                      }
                    })}
                    placeholder="Enter your phone number"
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-[#2d4891] focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-900 h-12"
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-2">{errors.phone.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#2d4891] to-[#1e3a8a] text-white py-3 px-6 rounded-xl hover:from-[#1e3a8a] hover:to-[#1e3a8a] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Starting Chat...</span>
                  </div>
                ) : (
                  'Start Chat'
                )}
              </button>
            </form>
          </div>
        )}

        {showChat && isRegistered && (
          <div className="space-y-4">
            <div className="flex justify-end mb-3">
              <button
                onClick={resetChat}
                className="text-sm text-[#2d4891] hover:text-[#1e3a8a] hover:underline transition-colors duration-200 px-3 py-1 rounded-lg hover:bg-blue-50"
              >
                Start New Chat
              </button>
            </div>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.is_visitor ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-3 rounded-2xl ${
                    message.is_visitor
                      ? 'bg-gradient-to-r from-[#2d4891] to-[#1e3a8a] text-white shadow-lg'
                      : 'bg-white text-gray-800 shadow-md border border-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line leading-relaxed">{message.message}</p>
                  <p className={`text-xs mt-2 ${message.is_visitor ? 'text-blue-100' : 'text-gray-700'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {(isLoading || isFetchingMessages) && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl shadow-md border border-gray-100">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            {quickReplies.length > 0 && !isLoading && !isFetchingMessages && (
              <div className="flex justify-start mt-4">
                <div className="grid grid-cols-2 gap-2 w-full">
                  {quickReplies.map((reply, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickReply(reply)}
                      disabled={isLoading}
                      className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 shadow-sm text-sm font-medium text-center ${
                        ['Previous', 'Next', 'Back'].includes(reply) 
                          ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-gray-400' 
                          : 'bg-white text-[#2d4891] border-[#2d4891] hover:bg-[#2d4891] hover:text-white hover:shadow-md'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {showFAQ && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-r from-[#2d4891] to-[#1e3a8a] rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800 text-lg">Search FAQ</h3>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search FAQs..."
                value={faqSearchQuery}
                onChange={(e) => setFaqSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d4891] focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-900"
              />
            </div>

            {/* Search Results Count */}
            {faqSearchQuery && (
              <div className="text-sm text-gray-800 text-center py-2">
                Found {filteredFaqs.length} FAQ{filteredFaqs.length !== 1 ? 's' : ''} for &quot;{faqSearchQuery}&quot;
              </div>
            )}

            {/* FAQ List */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq) => (
                  <div key={faq.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
                    <div className="p-4 cursor-pointer group" onClick={() => {
                      const element = document.getElementById(`faq-answer-${faq.id}`);
                      if (element) {
                        element.classList.toggle('hidden');
                      }
                    }}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-800 group-hover:text-[#2d4891] transition-colors duration-200">
                            {faq.question}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-[#2d4891]">
                              {faq.category}
                            </span>
                            <span className="text-xs text-gray-700">{faq.tags.slice(0, 2).join(', ')}</span>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2d4891] transition-colors duration-200 transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <div id={`faq-answer-${faq.id}`} className="hidden px-4 pb-4">
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-sm text-gray-700 leading-relaxed">{faq.answer}</p>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {faq.tags.map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : faqSearchQuery ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                    </svg>
                  </div>
                  <p className="text-gray-700 text-sm">No FAQs found for &quot;{faqSearchQuery}&quot;</p>
                  <p className="text-gray-600 text-xs mt-1">Try different keywords or browse all FAQs</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-700 text-sm">Type in the search bar above to find FAQs</p>
                </div>
              )}
            </div>
          </div>
        )}

        {showArticles && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-r from-[#2d4891] to-[#1e3a8a] rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9M12 4h9M3 8h18M3 16h18" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800 text-lg">Search Articles</h3>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search articles..."
                value={articlesSearchQuery}
                onChange={(e) => setArticlesSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d4891] focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-900"
              />
            </div>

            {/* Search Results Count */}
            {articlesSearchQuery && (
              <div className="text-sm text-gray-800 text-center py-2">
                Found {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} for &quot;{articlesSearchQuery}&quot;
              </div>
            )}

            {/* Articles List */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article) => (
                  <div key={article.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
                    <div className="p-4 cursor-pointer group" onClick={() => {
                      const element = document.getElementById(`article-excerpt-${article.id}`);
                      if (element) {
                        element.classList.toggle('hidden');
                      }
                    }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-800 group-hover:text-[#2d4891] transition-colors duration-200 leading-tight">
                            {article.title}
                          </h4>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-[#2d4891]">
                              {article.category}
                            </span>
                            <span className="text-xs text-gray-700">{article.readTime}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {article.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                #{tag}
                              </span>
                            ))}
                            {article.tags.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-600">
                                +{article.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2d4891] transition-colors duration-200 transform group-hover:rotate-180 ml-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <div id={`article-excerpt-${article.id}`} className="hidden px-4 pb-4">
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">{article.excerpt}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {article.tags.map((tag, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                #{tag}
                              </span>
                            ))}
                          </div>
                          <button className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2d4891] text-white hover:bg-[#1e3a8a] transition-colors duration-200">
                            Read Full Article
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : articlesSearchQuery ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                    </svg>
                  </div>
                  <p className="text-gray-700 text-sm">No articles found for &quot;{articlesSearchQuery}&quot;</p>
                  <p className="text-gray-400 text-xs mt-1">Try different keywords or browse all articles</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-700 text-sm">Type in the search bar above to find articles</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Chat Input */}
      {showChat && isRegistered && (
        <div className="p-4 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
          {conversationStep === 'free_text' && !isChatEnded && (
            <div className="flex space-x-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d4891] focus:border-transparent transition-all duration-200 bg-white/90 backdrop-blur-sm text-black"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isLoading}
                className="bg-gradient-to-r from-[#2d4891] to-[#1e3a8a] text-white px-6 py-3 rounded-xl hover:from-[#1e3a8a] hover:to-[#1e3a8a] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none font-semibold"
              >
                Send
              </button>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Bottom Navigation */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-gray-100 p-4">
        <div className="flex justify-around">
          {[
            { key: 'home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Home' },
            { key: 'chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Chat' },
            { key: 'faq', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'FAQ' },
            { key: 'articles', icon: 'M12 20h9M12 4h9M3 8h18M3 16h18', label: 'Articles' }
          ].map(({ key, icon, label }) => (
          <button
              key={key}
              onClick={() => handleTabChange(key as 'home' | 'chat' | 'faq' | 'articles')}
              className={`flex flex-col items-center space-y-2 p-2 rounded-xl transition-all duration-200 ${
                activeTab === key 
                  ? 'text-[#2d4891] bg-blue-50' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
            </svg>
              <span className="text-xs font-medium">{label}</span>
          </button>
          ))}
        </div>
      </div>
    </div>
  );
}