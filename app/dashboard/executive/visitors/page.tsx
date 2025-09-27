'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { getServiceDisplayName, getMainServices, SERVICE_SUBSERVICE_MAP } from '@/lib/utils/serviceMapping';
import PipelineFlowchart from '@/components/PipelineFlowchart';

type Visitor = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  region?: string;
  service: string;
  subservice?: string;
  enquiryDetails?: string;
  source: 'chatbot' | 'email' | 'calls' | 'website';
  createdAt: string;
  lastInteractionAt?: string;
  isConverted: boolean;
  status: string;
  agent?: string;
  agentName?: string;
  assignedAgent?: string;
  salesExecutive?: string;
  salesExecutiveName?: string;
  comments?: string;
  amount?: number;
  pipelineHistory?: Array<{
    status: string;
    changedAt: string;
    changedBy: string;
    notes?: string;
  }>;
};

// Pipeline stages for status filtering
const PIPELINE_STAGES = [
  { id: 'enquiry_required', name: 'Enquiry Received' },
  { id: 'contact_initiated', name: 'Contact Initiated' },
  { id: 'feasibility_check', name: 'Feasibility Check' },
  { id: 'qualified', name: 'Qualified' },
  { id: 'quotation_sent', name: 'Quotation Sent' },
  { id: 'negotiation_stage', name: 'Negotiation Stage' },
  { id: 'converted', name: 'Converted' },
  { id: 'payment_received', name: 'Payment Received' },
  { id: 'sample_received', name: 'Sample Received' },
  { id: 'handed_to_smc', name: 'Handed to SMC' },
  { id: 'informed_about_se', name: 'Informed about SE' },
  { id: 'provided_kyc_quotation_to_smc', name: 'Provided KYC & Quotation to SMC' },
  { id: 'process_initiated', name: 'Process Initiated' },
  { id: 'ongoing_process', name: 'Ongoing Process' },
  { id: 'report_generated', name: 'Report Generated' },
  { id: 'sent_to_client_via_mail', name: 'Sent to Client via Mail' },
  { id: 'report_hardcopy_sent', name: 'Report Hardcopy Sent' },
  { id: 'unqualified', name: 'Unqualified' }
];

// Time period options for filtering
const TIME_PERIODS = [
  { id: 'all', name: 'All Time' },
  { id: 'daily', name: 'Daily' },
  { id: 'weekly', name: 'Weekly' },
  { id: 'monthly', name: 'Monthly' }
];

// Months for month picker
const MONTHS = [
  { id: '01', name: 'January' },
  { id: '02', name: 'February' },
  { id: '03', name: 'March' },
  { id: '04', name: 'April' },
  { id: '05', name: 'May' },
  { id: '06', name: 'June' },
  { id: '07', name: 'July' },
  { id: '08', name: 'August' },
  { id: '09', name: 'September' },
  { id: '10', name: 'October' },
  { id: '11', name: 'November' },
  { id: '12', name: 'December' }
];



export default function ExecutiveVisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [salesExecutives, setSalesExecutives] = useState<Array<{_id: string, name: string, username: string, email: string}>>([]);
  const [showSalesExecutiveDropdown, setShowSalesExecutiveDropdown] = useState(false);
  const [salesExecutiveSearchTerm, setSalesExecutiveSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [showPipeline, setShowPipeline] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedSubservice, setSelectedSubservice] = useState<string>('');
  const [customSubservice, setCustomSubservice] = useState<string>('');
  const [showCustomSubservice, setShowCustomSubservice] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showTimeFilter, setShowTimeFilter] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [assignedServices, setAssignedServices] = useState<string[]>([]);
  const [agents, setAgents] = useState<{ _id: string; name: string; username: string; email: string; role: string }[]>([]);
  const [assigningAgent, setAssigningAgent] = useState<string | null>(null);
  const [assigningSalesExecutive, setAssigningSalesExecutive] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    timePeriod: 'all',
    selectedMonth: '',
    selectedYear: new Date().getFullYear()
  });
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    'Sr.no.': true,
    'Name of Client': true,
    'Agent': true,
    'Sales Executive': true,
    'Status': true,
    'Date & Time': true,
    'Service': true,
    'Sub-service': true,
    'Enquiry Details': true,
    'Source': true,
    'Contact no.': true,
    'Email id': true,
    'Organization': true,
    'Region': true,
    'Comments': true,
    'Amount': true,
    'Converted': true,
    'Actions': true
  });
  
  // Form state for editing
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    region: '',
    source: 'chatbot' as 'chatbot' | 'email' | 'calls' | 'website',
    enquiryDetails: '',
    status: 'new',
    assignedAgent: '',
    agentName: '',
    salesExecutive: '',
    salesExecutiveName: '',
    comments: '',
    amount: 0
  });

  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('ems_token') : null), []);
  // API base URL - always use current domain
  const API_BASE = (() => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
  })();

  // Debug logging for agents and sales executives
  useEffect(() => {
    console.log('🔍 Executive - Current agents state:', agents.length, agents);
    console.log('🔍 Executive - Current sales executives state:', salesExecutives.length, salesExecutives);
    console.log('🔍 Executive - Token available:', !!token);
    console.log('🔍 Executive - API Base:', API_BASE);
  }, [agents, salesExecutives, token, API_BASE]);

  // Real data will be fetched from the API

  // Fetch assigned services for the executive
  const fetchAssignedServices = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/executive-services/executive/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAssignedServices(data.assignedServices?.map((s: { serviceName: string }) => s.serviceName) || []);
      }
    } catch (error) {
      console.error('Error fetching assigned services:', error);
    }
  }, [API_BASE, token, user?.id]);

  // Fetch agents (executives) for display
  const fetchAgents = useCallback(async () => {
    try {
      console.log('🔄 Executive - Fetching agents...');
      console.log('🔑 Executive - Token:', token ? 'Present' : 'Missing');
      console.log('🌐 Executive - API Base:', API_BASE);
      
      if (!token) {
        console.error('❌ Executive - No token available for fetching agents');
        return;
      }
      
      const agentsResponse = await fetch(`${API_BASE}/api/auth/agents`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json();
        
        console.log('✅ Executive - Agents API response:', agentsData);
        
        if (agentsData.success && agentsData.agents) {
          const agents = agentsData.agents;
          
          console.log('🎯 Executive - Found agents:', agents.length);
          agents.forEach(agent => {
            console.log(`- ${agent.name || agent.username} (${agent.role})`);
          });
          
          setAgents(agents);
          console.log('✅ Executive - Agents set successfully:', agents.length);
          console.log('✅ Executive - Agents data:', agents);
        } else {
          console.error('❌ Executive - No agents found in API response');
          setAgents([]);
        }
      } else {
        const errorData = await agentsResponse.json().catch(() => ({}));
        console.error('❌ Executive - Failed to fetch agents:', {
          status: agentsResponse.status,
          error: errorData
        });
        setAgents([]);
      }
    } catch (error) {
      console.error('❌ Executive - Error fetching agents:', error);
      setAgents([]);
    }
  }, [API_BASE, token]);

  // Fetch sales executives for dropdown
  const fetchSalesExecutives = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/sales-executives`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (response.ok) {
        const data = await response.json();
        setSalesExecutives(data.salesExecutives || []);
      } else {
        console.error('Error fetching sales executives:', response.status);
      }
    } catch (error) {
      console.error('Error fetching sales executives:', error);
    }
  }, [API_BASE, token]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Define loadVisitors function outside useEffect
  const loadVisitors = useCallback(async (isRefresh = false) => {
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }
      
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      try {
        const headers = { Authorization: `Bearer ${token}` };
      
        // Build query parameters
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString()
        });
        if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
        if (filters.status) params.append('status', filters.status);

        const response = await fetch(`${API_BASE}/api/analytics/visitors-management?${params}`, { headers });

        if (response.status === 401) {
          console.error('❌ 401 Authentication failed. Response:', response);
          setError('Authentication failed. Please login again.');
          localStorage.removeItem('ems_token');
          localStorage.removeItem('ems_user');
          window.location.href = '/login';
          return;
        }

        if (!response.ok) {
          console.error('❌ API Error:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('❌ Error response:', errorText);
          setError(`API Error: ${response.status} - ${response.statusText}`);
          return;
        }

        const responseData = await response.json();
        console.log('📊 Executive visitors data received:', responseData.visitors);
        console.log('📊 Total visitors:', responseData.pagination?.total);
        console.log('📊 Full response data:', responseData);
        console.log('👤 Current user:', user);
        
        setVisitors(responseData.visitors || []);
        setPagination(responseData.pagination || {
          page: 1,
          limit: 50,
          total: 0,
          pages: 0
        });
        
        // Show update notification
        setShowUpdateNotification(true);
        setTimeout(() => setShowUpdateNotification(false), 3000);

      } catch (e: unknown) {
        console.error('Error loading visitors:', e);
        setError(e instanceof Error ? e.message : 'Failed to load visitors');
      } finally {
        if (isRefresh) {
          setIsRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    }, [API_BASE, token, pagination.page, pagination.limit, debouncedSearchTerm, filters.status]);

  useEffect(() => {
    // Check authentication first
    const token = localStorage.getItem('ems_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // Get user info from localStorage
    const userStr = localStorage.getItem('ems_user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        console.log('👤 User data loaded:', userData);
        setUser(userData);
      } catch (e) {
        console.error('Error parsing user data:', e);
        // Clear invalid data and redirect to login
        localStorage.removeItem('ems_token');
        localStorage.removeItem('ems_user');
        window.location.href = '/login';
        return;
      }
    } else {
      // No user data, redirect to login
      console.log('❌ No user data found in localStorage');
      localStorage.removeItem('ems_token');
      window.location.href = '/login';
      return;
    }

    loadVisitors();
    fetchAssignedServices();
    fetchAgents();
    fetchSalesExecutives();
  }, [API_BASE, pagination.page, pagination.limit, debouncedSearchTerm, filters.status, loadVisitors, fetchAgents, fetchAssignedServices, fetchSalesExecutives]);

  // Auto-refresh every 30 seconds to sync with admin changes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing visitor data...');
      loadVisitors(true); // Pass true to indicate this is a refresh
      setLastRefresh(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [API_BASE, token, user?.id, loadVisitors]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element;
      
      if (showExportDropdown && !target.closest('.export-dropdown')) {
          setShowExportDropdown(false);
        }
      
      if (showColumnFilter && !target.closest('.column-filter')) {
        setShowColumnFilter(false);
      }
      
      if (showStatusFilter && !target.closest('.status-filter')) {
        setShowStatusFilter(false);
      }
      
      if (showTimeFilter && !target.closest('.time-filter')) {
        setShowTimeFilter(false);
      }
      
      if (showSalesExecutiveDropdown && !target.closest('.sales-executive-dropdown')) {
        setShowSalesExecutiveDropdown(false);
      }
      
      if (showMonthPicker && !target.closest('.month-picker')) {
        setShowMonthPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown, showColumnFilter, showStatusFilter, showTimeFilter, showMonthPicker]);

  const updateVisitorStatus = async (visitorId: string, status: string, notes?: string) => {
    if (!token) return;

    console.log('🔄 updateVisitorStatus called with:', { visitorId, status, notes });

    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const requestBody = { visitorId, status, notes };
      console.log('📤 Sending request to backend:', requestBody);
      
      const response = await fetch(`${API_BASE}/api/analytics/update-visitor-status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        console.log('✅ Status updated successfully:', { visitorId, status, notes });
        
        // Get the updated visitor data from the response
        const updatedVisitor = await response.json();
    console.log('📥 Updated visitor data from backend:', updatedVisitor);
    console.log('📝 Pipeline history from backend:', updatedVisitor.pipelineHistory);
    
    // Debug: Check if notes are in the pipeline history
    if (updatedVisitor.pipelineHistory && updatedVisitor.pipelineHistory.length > 0) {
      const latestEntry = updatedVisitor.pipelineHistory[updatedVisitor.pipelineHistory.length - 1];
      console.log('🔍 Latest pipeline entry:', {
        status: latestEntry.status,
        notes: latestEntry.notes,
        hasNotes: !!latestEntry.notes,
        notesLength: latestEntry.notes?.length
      });
    }
        
        // Update local state with the complete updated visitor data
        setVisitors(prev => prev.map(v => 
          v._id === visitorId ? { ...v, ...updatedVisitor } : v
        ));
        
        // Update selectedVisitor if it's the same visitor
        if (selectedVisitor?._id === visitorId) {
          setSelectedVisitor(prev => {
            const updated = prev ? { ...prev, ...updatedVisitor } : null;
            console.log('🔄 Updated selectedVisitor:', updated);
            console.log('📝 SelectedVisitor pipeline history:', updated?.pipelineHistory);
            return updated;
          });
        }
        
        // Refresh data from server to ensure consistency
        await loadVisitors();
        console.log('✅ Visitor status updated successfully and data refreshed from server');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to update status:', response.status, response.statusText, errorData);
        
        // Show user-friendly error message for non-403 errors
        if (response.status !== 403) {
          alert(`Failed to update status: ${errorData.message || response.statusText}`);
        }
      }
    } catch (e) {
      console.error('Error updating visitor status:', e);
      alert('An error occurred while updating the visitor status. Please try again.');
    }
  };

  // Assign agent to visitor
  const assignAgentToVisitor = async (visitorId: string, agentId: string, agentName: string) => {
    try {
      console.log('🔄 Assigning agent:', { visitorId, agentId, agentName });
      
      if (!token) {
        setError('No authentication token found');
        return;
      }
      
      const response = await fetch(`${API_BASE}/api/analytics/assign-agent`, {
        method: 'POST',
        headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({ visitorId, agentId, agentName })
      });

      if (response.ok) {
        // Update the visitor in the local state
        setVisitors(prev => prev.map(visitor => 
          visitor._id === visitorId 
            ? { ...visitor, agent: agentName, agentName: agentName, assignedAgent: agentId }
            : visitor
        ));
        setAssigningAgent(null);
        
        // Show success notification
        console.log(`✅ Agent ${agentName} assigned to visitor ${visitorId}`);
        setError(null); // Clear any previous errors
      } else {
        let errorData = {};
        try {
          const responseText = await response.text();
          if (responseText) {
            errorData = JSON.parse(responseText);
          }
        } catch {
          errorData = { error: 'Failed to parse server response' };
        }
        
        console.error('❌ Error assigning agent:', errorData);
        setError((errorData as { error?: string; details?: string }).error || (errorData as { error?: string; details?: string }).details || `Server error (${response.status}): Failed to assign agent`);
      }
    } catch (error) {
      console.error('❌ Error assigning agent:', error);
      setError(`Failed to assign agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAssigningAgent(null);
    }
  };

  // Assign sales executive to visitor
  const assignSalesExecutiveToVisitor = async (visitorId: string, salesExecutiveId: string, salesExecutiveName: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/analytics/assign-sales-executive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          visitorId,
          salesExecutiveId,
          salesExecutiveName
        })
      });

      if (response.ok) {
        const updatedVisitor = await response.json();
        setVisitors(prev => prev.map(v => 
          v._id === visitorId ? { ...v, ...updatedVisitor } : v
        ));
        setAssigningSalesExecutive(null);
        console.log('Sales executive assigned successfully');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(`Failed to assign sales executive: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error assigning sales executive:', error);
      setError('Error assigning sales executive. Please try again.');
    }
  };

  const updateVisitorDetails = async (visitorData: Partial<Visitor>) => {
    if (!token || !editingVisitor) return;

    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Prepare the update data
      const updateData = {
        visitorId: editingVisitor._id,
        ...visitorData
      };

      console.log('Updating visitor with data:', updateData);

      const response = await fetch(`${API_BASE}/api/analytics/update-visitor-details`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedVisitor = await response.json();
        console.log('Visitor updated successfully:', updatedVisitor);
        console.log('Updated subservice:', updatedVisitor.subservice);
        
        // Update the visitor in the local state
        setVisitors(prev => prev.map(v => 
          v._id === editingVisitor._id ? { ...v, ...updatedVisitor } : v
        ));
        
        // Refresh data from server to ensure consistency
        await loadVisitors();
        
        // Close the form and reset state
        setShowEditForm(false);
        setEditingVisitor(null);
        setSelectedService('');
        setSelectedSubservice('');
        setCustomSubservice('');
        setShowCustomSubservice(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          organization: '',
          region: '',
          source: 'chatbot',
          enquiryDetails: '',
          status: 'new',
          assignedAgent: '',
          agentName: '',
          salesExecutive: '',
          salesExecutiveName: '',
          comments: '',
          amount: 0
        });
        
        // Show success message
        setError(null);
        // You could add a success notification here if you have a notification system
        console.log('✅ Visitor updated successfully and data refreshed from server');
      } else {
        const errorData = await response.json();
        console.error('Error updating visitor:', errorData);
        
        // Show more specific error messages
        if (errorData.errors && Array.isArray(errorData.errors)) {
          setError(`Validation failed: ${errorData.errors.join(', ')}`);
        } else {
          setError(errorData.message || 'Failed to update visitor details');
        }
      }
    } catch (e) {
      console.error('Error updating visitor details:', e);
      setError('Failed to update visitor details');
    }
  };


  // Define status hierarchy for filtering
  const getStatusHierarchy = () => {
    return {
      'enquiry_required': 1,
      'enquiry_received': 2,  // Added missing status
      'contact_initiated': 3,
      'feasibility_check': 4,
      'qualified': 5,
      'quotation_sent': 6,
      'negotiation_stage': 7,
      'converted': 8,
      'payment_received': 9,
      'sample_received': 10,
      'handed_to_smc': 11,
      'informed_about_se': 12,
      'provided_kyc_quotation_to_smc': 13,
      'process_initiated': 14,
      'ongoing_process': 15,
      'report_generated': 16,
      'sent_to_client_via_mail': 17,
      'report_hardcopy_sent': 18,
      'unqualified': 0 // Special case - end state
    };
  };

  // Check if visitor status is at or beyond the selected filter status
  const isStatusAtOrBeyond = (visitorStatus: string, filterStatus: string) => {
    const hierarchy = getStatusHierarchy();
    const visitorLevel = hierarchy[visitorStatus as keyof typeof hierarchy] || 0;
    const filterLevel = hierarchy[filterStatus as keyof typeof hierarchy] || 0;
    return visitorLevel >= filterLevel;
  };

  // Check if visitor is converted (crossed the "converted" stage)
  const isConverted = (visitorStatus: string) => {
    const hierarchy = getStatusHierarchy();
    const visitorLevel = hierarchy[visitorStatus as keyof typeof hierarchy] || 0;
    const convertedLevel = hierarchy['converted'] || 8;
    return visitorLevel >= convertedLevel;
  };

  const filteredVisitors = Array.isArray(visitors) ? visitors.filter(visitor => {
    const matchesSearch = !searchTerm || (
    visitor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.subservice?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.agentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.salesExecutiveName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.enquiryDetails?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.comments?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.source?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = !filters.status || isStatusAtOrBeyond(visitor.status, filters.status);
    
    // Time period filtering
    const matchesTimePeriod = (() => {
      if (filters.timePeriod === 'all') return true;
      
      const visitorDate = new Date(visitor.createdAt);
      const now = new Date();
      
      switch (filters.timePeriod) {
        case 'daily':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return visitorDate >= today;
        case 'weekly':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return visitorDate >= weekAgo;
        case 'monthly':
          if (filters.selectedMonth) {
            // Specific month selected
            const selectedMonth = parseInt(filters.selectedMonth) - 1; // JavaScript months are 0-indexed
            const selectedYear = filters.selectedYear;
            const startOfMonth = new Date(selectedYear, selectedMonth, 1);
            const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
            return visitorDate >= startOfMonth && visitorDate <= endOfMonth;
          } else {
            // Last 30 days
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return visitorDate >= monthAgo;
          }
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesTimePeriod;
  }) : [];

  const summaryStats = useMemo(() => {
    if (!Array.isArray(visitors)) return { chatbot: 0, email: 0, calls: 0, website: 0 };
    
    const chatbot = visitors.filter(v => v.source === 'chatbot').length;
    const email = visitors.filter(v => v.source === 'email').length;
    const calls = visitors.filter(v => v.source === 'calls').length;
    const website = visitors.filter(v => v.source === 'website').length;
    
    return { chatbot, email, calls, website };
  }, [visitors]);



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle service selection
  const handleServiceChange = (service: string) => {
    setSelectedService(service);
    setSelectedSubservice('');
    setCustomSubservice('');
    setShowCustomSubservice(false);
  };

  // Handle subservice selection
  const handleSubserviceChange = (subservice: string) => {
    if (subservice === 'custom') {
      setShowCustomSubservice(true);
      setSelectedSubservice('');
    } else {
      setSelectedSubservice(subservice);
      setShowCustomSubservice(false);
      setCustomSubservice('');
    }
  };

  // Handle form input changes
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleColumnVisibilityChange = (columnName: string, isVisible: boolean) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnName]: isVisible
    }));
  };

  // Initialize form when editing visitor
  const initializeEditForm = (visitor: Visitor) => {
    setEditingVisitor(visitor);
    setSelectedService(visitor.service || '');
    setSelectedSubservice(visitor.subservice || '');
    setCustomSubservice('');
    setShowCustomSubservice(false);
    
    // Initialize form data
    setFormData({
      name: visitor.name || '',
      email: visitor.email || '',
      phone: visitor.phone || '',
      organization: visitor.organization || '',
      region: visitor.region || '',
      source: visitor.source || 'chatbot',
      enquiryDetails: visitor.enquiryDetails || '',
      status: visitor.status || 'new',
      assignedAgent: visitor.assignedAgent || '',
      agentName: visitor.agentName || '',
      salesExecutive: visitor.salesExecutive || '',
      salesExecutiveName: visitor.salesExecutiveName || '',
      comments: visitor.comments || '',
      amount: visitor.amount || 0
    });
    
    setShowEditForm(true);
  };

  // Export functions
  const exportToCSV = () => {
    const csvData = filteredVisitors.map((visitor, index) => ({
      'Sr. No.': index + 1,
      'Name of Client': visitor.name || '',
      'Agent': visitor.agentName || visitor.assignedAgent || 'Unassigned',
      'Status': visitor.status || 'New',
      'Date & Time': new Date(visitor.createdAt).toLocaleString(),
      'Service': getServiceDisplayName(visitor.service) || visitor.service,
      'Sub-service': visitor.subservice || '',
      'Enquiry Details': visitor.enquiryDetails || '',
      'Source': visitor.source || '',
      'Contact no.': visitor.phone || '',
      'Email id': visitor.email || '',
      'Organization': visitor.organization || '',
      'Region': visitor.region || ''
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escape commas and quotes in CSV
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `visitors_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    // Create a simple HTML table for PDF generation
    const tableData = filteredVisitors.map((visitor, index) => [
      index + 1,
      visitor.name || '',
      visitor.agentName || visitor.assignedAgent || 'Unassigned',
      visitor.status || 'New',
      new Date(visitor.createdAt).toLocaleString(),
      getServiceDisplayName(visitor.service) || visitor.service,
      visitor.subservice || '',
      visitor.enquiryDetails || '',
      visitor.source || '',
      visitor.phone || '',
      visitor.email || '',
      visitor.organization || '',
      visitor.region || ''
    ]);

    const headers = [
      'Sr. No.', 'Name of Client', 'Agent', 'Status', 'Date & Time',
      'Service', 'Sub-service', 'Enquiry Details', 'Source', 'Contact no.',
      'Email id', 'Organization', 'Region'
    ];

    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Visitors Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            h1 { color: #333; text-align: center; }
            .export-info { margin-bottom: 20px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <h1>Visitors Report</h1>
          <div class="export-info">
            Export Date: ${new Date().toLocaleString()}<br>
            Total Records: ${filteredVisitors.length}
          </div>
          <table>
            <thead>
              <tr>
                ${headers.map(header => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${tableData.map(row => 
                `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
              ).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Open in new window for printing/saving as PDF
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      newWindow.focus();
      // Auto-print after a short delay
      setTimeout(() => {
        newWindow.print();
      }, 500);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar userRole="executive" userName={user?.name} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader userRole="executive" userName={user?.name} />
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="text-gray-600">Loading visitors...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar userRole="executive" userName={user?.name} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader userRole="executive" userName={user?.name} />
          <div className="flex-1 p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-600">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole="executive" userName={user?.name} />
      
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0 ml-0">
        <DashboardHeader userRole="executive" userName={user?.name} />
        
        <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Update Notification */}
          {showUpdateNotification && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center shadow-sm">
              <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-green-800 font-medium">Visitor data updated successfully!</span>
            </div>
          )}
          
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Visitors</h1>
                <p className="text-gray-600">Manage and track visitors assigned to you</p>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <div className="flex items-center space-x-3">
                <div className="relative export-dropdown">
                  <button
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showExportDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            exportToCSV();
                            setShowExportDropdown(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                        >
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export to Excel
                        </button>
                        <button
                          onClick={() => {
                            exportToPDF();
                            setShowExportDropdown(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Export to PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    console.log('🔄 Manual refresh triggered');
                    loadVisitors(true); // Pass true to indicate this is a refresh
                    setLastRefresh(new Date());
                  }}
                  disabled={isRefreshing}
                    className="flex items-center justify-center w-8 h-8 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isRefreshing ? 'Refreshing...' : 'Refresh'}
                >
                  {isRefreshing ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </button>
                </div>
                <div className="text-xs text-gray-400">
                  Updated: {lastRefresh.toLocaleTimeString()}
                </div>
              </div>
            </div>
            
            {/* Assigned Services Display */}
            {assignedServices.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-800">Your Assigned Services</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {assignedServices.map((service, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
          </div>

          {/* Summary Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Chatbot</p>
                  <p className="text-2xl font-semibold text-gray-900">{summaryStats.chatbot}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-2xl font-semibold text-gray-900">{summaryStats.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Calls</p>
                  <p className="text-2xl font-semibold text-gray-900">{summaryStats.calls}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Website</p>
                  <p className="text-2xl font-semibold text-gray-900">{summaryStats.website}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Enhanced Search Bar */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-black mb-2">Search Visitors</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, email, organization, or service..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter */}
              <div className="relative status-filter">
                <label className="block text-sm font-medium text-black mb-2">Status Filter</label>
                <button
                  onClick={() => setShowStatusFilter(!showStatusFilter)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 text-left flex items-center justify-between"
                >
                  <span>
                    {filters.status ? PIPELINE_STAGES.find(stage => stage.id === filters.status)?.name || 'Select Status' : 'All Statuses'}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showStatusFilter && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Select status to filter:</h3>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="radio"
                            name="status"
                            value=""
                            checked={filters.status === ''}
                            onChange={(e) => {
                              setFilters(prev => ({ ...prev, status: e.target.value }));
                              setShowStatusFilter(false);
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="text-sm text-gray-700">All Statuses</span>
                        </label>
                  {PIPELINE_STAGES.map(stage => (
                          <label key={stage.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="radio"
                              name="status"
                              value={stage.id}
                              checked={filters.status === stage.id}
                              onChange={(e) => {
                                setFilters(prev => ({ ...prev, status: e.target.value }));
                                setShowStatusFilter(false);
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="text-sm text-gray-700">{stage.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Time Period Filter */}
              <div className="relative time-filter">
                <label className="block text-sm font-medium text-black mb-2">Time Period</label>
                <button
                  onClick={() => setShowTimeFilter(!showTimeFilter)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 text-left flex items-center justify-between"
                >
                  <span>
                    {filters.timePeriod === 'monthly' && filters.selectedMonth 
                      ? `${MONTHS.find(m => m.id === filters.selectedMonth)?.name} ${filters.selectedYear}`
                      : TIME_PERIODS.find(period => period.id === filters.timePeriod)?.name || 'All Time'
                    }
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showTimeFilter && (
                  <div className="absolute z-50 w-96 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Select time period
                      </h3>
                      <div className="space-y-3">
                        {TIME_PERIODS.map(period => (
                          <div key={period.id}>
                            <label className="flex items-center space-x-3 cursor-pointer hover:bg-blue-50 p-3 rounded-lg transition-colors">
                              <input
                                type="radio"
                                name="timePeriod"
                                value={period.id}
                                checked={filters.timePeriod === period.id}
                                onChange={(e) => {
                                  setFilters(prev => ({ 
                                    ...prev, 
                                    timePeriod: e.target.value,
                                    selectedMonth: e.target.value === 'monthly' ? prev.selectedMonth : ''
                                  }));
                                  if (e.target.value !== 'monthly') {
                                    setShowTimeFilter(false);
                                  } else {
                                    setShowMonthPicker(true);
                                  }
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <span className={`text-sm font-medium ${filters.timePeriod === period.id ? 'text-blue-700' : 'text-gray-700'}`}>
                                {period.name}
                              </span>
                              {period.id === 'monthly' && (
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              )}
                            </label>
                            
                            {/* Month picker for monthly option - shows directly */}
                            {period.id === 'monthly' && filters.timePeriod === 'monthly' && showMonthPicker && (
                              <div className="mt-3">
                                <div className="month-picker bg-gray-50 border border-gray-200 rounded-lg p-4 w-full">
                                  <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-semibold text-gray-800">Select Month & Year</h4>
                                    <button
                                      onClick={() => {
                                        setShowMonthPicker(false);
                                        setShowTimeFilter(false);
                                      }}
                                      className="text-gray-400 hover:text-gray-600"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                  
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <label className="text-sm font-medium text-gray-700">Year:</label>
                <select
                                        value={filters.selectedYear}
                                        onChange={(e) => setFilters(prev => ({ ...prev, selectedYear: parseInt(e.target.value) }))}
                                        className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 w-20"
                                      >
                                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                                          <option key={year} value={year}>{year}</option>
                                        ))}
                </select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-700">Month:</label>
                                      <div className="grid grid-cols-3 gap-2">
                                        {MONTHS.map(month => (
                                          <button
                                            key={month.id}
                                            onClick={() => {
                                              setFilters(prev => ({ ...prev, selectedMonth: month.id }));
                                              setShowMonthPicker(false);
                                              setShowTimeFilter(false);
                                            }}
                                            className={`text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
                                              filters.selectedMonth === month.id 
                                                ? 'bg-blue-600 text-white shadow-md' 
                                                : 'bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-700 border border-gray-200 hover:border-blue-300'
                                            }`}
                                          >
                                            {month.name.substring(0, 3)}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    {filters.selectedMonth && (
                                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                        <span className="text-sm text-gray-600">
                                          Selected: <span className="font-semibold text-blue-600">
                                            {MONTHS.find(m => m.id === filters.selectedMonth)?.name} {filters.selectedYear}
                                          </span>
                                        </span>
                                        <button
                                          onClick={() => {
                                            setFilters(prev => ({ ...prev, selectedMonth: '' }));
                                          }}
                                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                                        >
                                          Clear
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Column Visibility Filter */}
              <div className="relative column-filter">
                <label className="block text-sm font-medium text-black mb-2">Show Columns</label>
                <button
                  onClick={() => setShowColumnFilter(!showColumnFilter)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white text-left flex items-center justify-between"
                >
                  <span>Select Columns</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showColumnFilter && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
                    <div className="p-3">
                      <div className="text-sm font-medium text-gray-700 mb-3">Select columns to display:</div>
                      <div className="space-y-2">
                        {Object.entries(visibleColumns).map(([columnName, isVisible]) => (
                          <label key={columnName} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={isVisible}
                              onChange={(e) => handleColumnVisibilityChange(columnName, e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{columnName}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => {
                            const allVisible = Object.keys(visibleColumns).reduce((acc, key) => ({ ...acc, [key]: true }), {} as typeof visibleColumns);
                            setVisibleColumns(allVisible);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 mr-3"
                        >
                          Show All
                        </button>
                        <button
                          onClick={() => {
                            const allHidden = Object.keys(visibleColumns).reduce((acc, key) => ({ ...acc, [key]: false }), {} as typeof visibleColumns);
                            setVisibleColumns(allHidden);
                          }}
                          className="text-xs text-gray-600 hover:text-gray-800"
                        >
                          Hide All
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Search Results Summary */}
            {(searchTerm || filters.status || filters.timePeriod !== 'all') && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-black">
                  Showing {filteredVisitors.length} of {visitors.length} visitors
                    <span className="ml-2">
                      (filtered by: {[
                        searchTerm && `"${searchTerm}"`,
                        filters.status && `status: ${filters.status}`,
                        filters.timePeriod !== 'all' && `time: ${TIME_PERIODS.find(t => t.id === filters.timePeriod)?.name}${filters.timePeriod === 'monthly' && filters.selectedMonth ? ` (${MONTHS.find(m => m.id === filters.selectedMonth)?.name} ${filters.selectedYear})` : ''}`
                      ].filter(Boolean).join(', ')})
                    </span>
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({ status: '', timePeriod: 'all', selectedMonth: '', selectedYear: new Date().getFullYear() });
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Visitors Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {visibleColumns['Sr.no.'] && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sr.no.
                    </th>
                    )}
                    {visibleColumns['Name of Client'] && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name of Client
                      </th>
                    )}
                    {visibleColumns['Agent'] && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent
                    </th>
                    )}
                    {visibleColumns['Sales Executive'] && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sales Executive
                      </th>
                    )}
                    {visibleColumns['Status'] && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                    </th>
                    )}
                    {visibleColumns['Date & Time'] && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    )}
                    {visibleColumns['Service'] && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                    </th>
                    )}
                    {visibleColumns['Sub-service'] && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sub-service
                    </th>
                    )}
                    {visibleColumns['Enquiry Details'] && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enquiry Details
                      </th>
                    )}
                    {visibleColumns['Source'] && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                    )}
                    {visibleColumns['Contact no.'] && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact no.
                      </th>
                    )}
                    {visibleColumns['Email id'] && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email id
                      </th>
                    )}
                    {visibleColumns['Organization'] && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Organization
                      </th>
                    )}
                    {visibleColumns['Region'] && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Region
                      </th>
                    )}
                    {visibleColumns['Comments'] && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comments
                      </th>
                    )}
                    {visibleColumns['Amount'] && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    )}
                    {visibleColumns['Converted'] && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Converted
                    </th>
                    )}
                    {visibleColumns['Actions'] && (
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                   {filteredVisitors.map((visitor, index) => (
                    <tr key={`visitor-${visitor._id || index}-${index}`} className="hover:bg-gray-50">
                       {/* Sr.no. */}
                       {visibleColumns['Sr.no.'] && (
                         <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                           {index + 1}
                         </td>
                       )}
                       
                       {/* Name of Client */}
                       {visibleColumns['Name of Client'] && (
                         <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-medium text-sm">
                              {visitor.name ? visitor.name.charAt(0).toUpperCase() : visitor.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                            <div className="text-sm font-medium text-gray-900">{visitor.name || 'Anonymous'}</div>
                        </div>
                      </td>
                       )}
                       
                       {/* Agent */}
                       {visibleColumns['Agent'] && (
                         <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                           <div className="relative">
                             <select
                               className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                               value={visitor.assignedAgent || ''}
                               onChange={(e) => {
                                 const selectedAgent = agents.find(agent => (agent._id || agent.id) === e.target.value);
                                 if (selectedAgent) {
                                   const agentId = selectedAgent._id || selectedAgent.id;
                                   const agentName = selectedAgent.name || selectedAgent.username;
                                   if (!agentId || !agentName) {
                                     setError('Invalid agent data selected');
                                     return;
                                   }
                                   assignAgentToVisitor(visitor._id, agentId, agentName);
                                 } else if (e.target.value === '') {
                                   assignAgentToVisitor(visitor._id, '', '');
                                 }
                               }}
                             >
                               <option value="">Unassigned</option>
                               {agents.length > 0 ? (
                                 agents.map(agent => {
                                   console.log('🎯 Executive - Rendering agent option:', agent);
                                   return (
                                     <option key={agent._id || agent.id} value={agent._id || agent.id}>
                                       {agent.name || agent.username || 'Unknown Agent'}
                                     </option>
                                   );
                                 })
                               ) : (
                                 <option value="" disabled>
                                   {agents.length === 0 ? 'Loading agents...' : 'No agents available'}
                                 </option>
                               )}
                             </select>
                           </div>
                         </td>
                       )}
                       
                       {/* Sales Executive */}
                       {visibleColumns['Sales Executive'] && (
                         <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                           <div className="relative">
                             <select
                               className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                               value={visitor.salesExecutive || ''}
                               onChange={(e) => {
                                 const selectedSalesExecutiveId = e.target.value;
                                 if (selectedSalesExecutiveId) {
                                   const selectedSalesExecutive = salesExecutives.find(se => (se._id || se.id) === selectedSalesExecutiveId);
                                   if (selectedSalesExecutive) {
                                     const salesExecutiveId = selectedSalesExecutive._id || selectedSalesExecutive.id;
                                     const salesExecutiveName = selectedSalesExecutive.name || selectedSalesExecutive.username;
                                     
                                     if (!salesExecutiveId || !salesExecutiveName) {
                                       setError('Invalid sales executive data selected');
                                       return;
                                     }
                                     
                                     assignSalesExecutiveToVisitor(visitor._id, salesExecutiveId, salesExecutiveName);
                                   } else {
                                     setError('Selected sales executive not found');
                                   }
                                 } else if (e.target.value === '') {
                                   // Handle unassigning
                                   assignSalesExecutiveToVisitor(visitor._id, '', '');
                                 }
                               }}
                             >
                               <option value="">Unassigned</option>
                               {salesExecutives.length > 0 ? (
                                 salesExecutives.map(salesExecutive => (
                                   <option key={salesExecutive._id || salesExecutive.id} value={salesExecutive._id || salesExecutive.id}>
                                     {salesExecutive.name || salesExecutive.username || 'Unknown Sales Executive'}
                                   </option>
                                 ))
                               ) : (
                                 <option value="" disabled>Loading sales executives...</option>
                               )}
                             </select>
                           </div>
                         </td>
                       )}
                       
                       {/* Status */}
                       {visibleColumns['Status'] && (
                         <td className="px-3 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedVisitor(visitor);
                            setShowPipeline(true);
                          }}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                                                     {visitor.status || 'Unknown'}
                        </button>
                      </td>
                       )}
                       
                       {/* Date & Time */}
                       {visibleColumns['Date & Time'] && (
                         <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                         {formatDate(visitor.createdAt)}
                       </td>
                       )}
                       
                       {/* Service */}
                       {visibleColumns['Service'] && (
                         <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                         {getServiceDisplayName(visitor.service || 'General Inquiry')}
                       </td>
                       )}
                       
                       {/* Sub-service */}
                       {visibleColumns['Sub-service'] && (
                         <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                           {visitor.subservice || '-'}
                         </td>
                       )}
                       
                       {/* Enquiry Details */}
                       {visibleColumns['Enquiry Details'] && (
                         <td className="px-3 py-4 text-sm text-gray-900 max-w-xs">
                           <div className="truncate" title={visitor.enquiryDetails || 'No details provided'}>
                             {visitor.enquiryDetails || '-'}
                           </div>
                         </td>
                       )}
                       
                       {/* Source */}
                       {visibleColumns['Source'] && (
                         <td className="px-3 py-4 whitespace-nowrap">
                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                             visitor.source === 'chatbot' ? 'bg-blue-100 text-blue-800' :
                             visitor.source === 'email' ? 'bg-green-100 text-green-800' :
                             visitor.source === 'calls' ? 'bg-purple-100 text-purple-800' :
                             'bg-orange-100 text-orange-800'
                           }`}>
                             {visitor.source?.charAt(0).toUpperCase() + visitor.source?.slice(1) || 'Unknown'}
                           </span>
                         </td>
                       )}
                       
                       {/* Contact no. */}
                       {visibleColumns['Contact no.'] && (
                         <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                           {visitor.phone || '-'}
                         </td>
                       )}
                       
                       {/* Email id */}
                       {visibleColumns['Email id'] && (
                         <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                           {visitor.email}
                         </td>
                       )}
                       
                       {/* Organization */}
                       {visibleColumns['Organization'] && (
                         <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                           {visitor.organization || '-'}
                         </td>
                       )}
                       
                       {/* Region */}
                       {visibleColumns['Region'] && (
                         <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                           {visitor.region || '-'}
                         </td>
                       )}
                       
                       {/* Comments */}
                       {visibleColumns['Comments'] && (
                         <td className="px-3 py-4 text-sm text-gray-900 max-w-xs">
                           <div className="truncate" title={visitor.comments || 'No comments'}>
                             {visitor.comments || '-'}
                           </div>
                         </td>
                       )}
                       
                       {/* Amount */}
                       {visibleColumns['Amount'] && (
                         <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                           {visitor.amount ? `₹${visitor.amount.toLocaleString()}` : '-'}
                         </td>
                       )}
                       
                       {/* Converted */}
                       {visibleColumns['Converted'] && (
                         <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        <input
                          type="checkbox"
                          checked={isConverted(visitor.status)}
                          readOnly
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          title={`Converted: ${isConverted(visitor.status) ? 'Yes' : 'No'}`}
                        />
                      </td>
                       )}
                       
                       {/* Actions */}
                       {visibleColumns['Actions'] && (
                         <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                             onClick={() => initializeEditForm(visitor)}
                             className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                      </td>
                       )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredVisitors.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">No visitors found</div>
            </div>
          )}
        </div>
      </div>

             {/* Pipeline Modal */}
       {showPipeline && selectedVisitor && (
         <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
           <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[80vh] overflow-y-auto">
             <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 rounded-t-xl">
               <div className="flex items-center justify-between">
                 <h3 className="text-xl font-bold text-gray-900">
                   Pipeline Tracking: {selectedVisitor.name || 'Anonymous'}
                 </h3>
                 <button
                   onClick={() => setShowPipeline(false)}
                   className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
             </div>
             
             <div className="p-5">

                             {/* New Pipeline Flowchart */}
                             <div className="mb-6">
                               <PipelineFlowchart
                                 key={`pipeline-${selectedVisitor._id}-${selectedVisitor.status}`}
                                 currentStatus={selectedVisitor.status}
                                 onStatusChange={(status, notes) => updateVisitorStatus(selectedVisitor._id, status, notes)}
                                 className="w-full"
                                 pipelineHistory={selectedVisitor.pipelineHistory}
                               />
                             </div>

                             {/* Action Buttons */}
                             <div className="mt-8 flex justify-end space-x-4">
                               <button
                                 onClick={() => setShowPipeline(false)}
                                 className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                               >
                                 Close
                               </button>
                               <button
                                 onClick={() => {
                                   // This button is now handled by the PipelineFlowchart component
                                   // Users can click directly on stages in the flowchart
                                 }}
                                 className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                               >
                                 Move to Next Stage
                               </button>
                             </div>
             </div>
           </div>
         </div>
       )}

      {/* Edit Visitor Modal */}
      {showEditForm && editingVisitor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-medium text-gray-900">Edit Visitor Details</h3>
                 <button
                   onClick={() => {
                     setShowEditForm(false);
                     setEditingVisitor(null);
                     setSelectedService('');
                     setSelectedSubservice('');
                     setCustomSubservice('');
                     setShowCustomSubservice(false);
                     setFormData({
                       name: '',
                       email: '',
                       phone: '',
                       organization: '',
                       region: '',
                       source: 'chatbot',
                       enquiryDetails: '',
                       status: 'new',
                       assignedAgent: '',
                       agentName: '',
                       salesExecutive: '',
                       salesExecutiveName: '',
                       comments: '',
                       amount: 0
                     });
                   }}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                 
                 // Determine the final subservice value
                 const finalSubservice = showCustomSubservice ? customSubservice : selectedSubservice;
                 
                 // Validate custom subservice
                 if (showCustomSubservice && (!customSubservice || customSubservice.trim() === '')) {
                   alert('Please enter a custom sub-service name');
                   return;
                 }
                 
                 console.log('Form submission - finalSubservice:', finalSubservice);
                 console.log('Form submission - selectedSubservice:', selectedSubservice);
                 console.log('Form submission - customSubservice:', customSubservice);
                 console.log('Form submission - showCustomSubservice:', showCustomSubservice);
                 
                updateVisitorDetails({
                   name: formData.name,
                   email: formData.email,
                   phone: formData.phone,
                   organization: formData.organization,
                   region: formData.region,
                   service: selectedService,
                   subservice: finalSubservice,
                   enquiryDetails: formData.enquiryDetails,
                   source: formData.source,
                   status: formData.status,
                   assignedAgent: formData.assignedAgent,
                   agentName: formData.agentName,
                   salesExecutive: formData.salesExecutive,
                   salesExecutiveName: formData.salesExecutiveName,
                   comments: formData.comments,
                   amount: formData.amount
                });
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {/* Name */}
                  <div>
                     <label className="block text-sm font-medium text-black mb-1">Name *</label>
                    <input
                      type="text"
                       value={formData.name}
                       onChange={(e) => handleFormChange('name', e.target.value)}
                       required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  </div>
                   
                   {/* Email */}
                  <div>
                     <label className="block text-sm font-medium text-black mb-1">Email *</label>
                    <input
                      type="email"
                       value={formData.email}
                       onChange={(e) => handleFormChange('email', e.target.value)}
                       required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  </div>
                   
                   {/* Phone */}
                  <div>
                     <label className="block text-sm font-medium text-black mb-1">Contact Number</label>
                    <input
                      type="text"
                       value={formData.phone}
                       onChange={(e) => handleFormChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  </div>
                   
                   {/* Organization */}
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Organization</label>
                    <input
                      type="text"
                       value={formData.organization}
                       onChange={(e) => handleFormChange('organization', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  </div>
                   
                   {/* Region */}
                  <div>
                     <label className="block text-sm font-medium text-black mb-1">Region</label>
                    <input
                      type="text"
                       value={formData.region}
                       onChange={(e) => handleFormChange('region', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  </div>
                   
                   {/* Source */}
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Source</label>
                    <select
                       value={formData.source}
                       onChange={(e) => handleFormChange('source', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    >
                      <option value="chatbot">Chatbot</option>
                      <option value="email">Email</option>
                      <option value="calls">Calls</option>
                      <option value="website">Website</option>
                    </select>
                  </div>

                   {/* Status */}
                  <div>
                     <label className="block text-sm font-medium text-black mb-1">Status</label>
                    <select
                       value={formData.status}
                       onChange={(e) => handleFormChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="proposal_sent">Proposal Sent</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="converted">Converted</option>
                      <option value="report_generated">Report Generated</option>
                      <option value="sample_received">Sample Received</option>
                      <option value="project_completed">Project Completed</option>
                      <option value="closed">Closed</option>
                    </select>
                </div>

                   {/* Agent */}
                  <div>
                     <label className="block text-sm font-medium text-black mb-1">Assigned Agent</label>
                    <select
                       value={formData.assignedAgent}
                       onChange={(e) => {
                         const selectedAgent = agents.find(agent => (agent._id || agent.id) === e.target.value);
                         if (selectedAgent) {
                           handleFormChange('assignedAgent', e.target.value);
                           handleFormChange('agentName', selectedAgent.name || selectedAgent.username || '');
                         }
                       }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    >
                      <option value="">Unassigned</option>
                      {agents.map(agent => (
                        <option key={agent._id || agent.id} value={agent._id || agent.id}>
                          {agent.name || agent.username || 'Unknown Agent'}
                        </option>
                      ))}
                    </select>
                  </div>
                   
                   {/* Sales Executive */}
                   <div className="relative sales-executive-dropdown">
                     <label className="block text-sm font-medium text-black mb-1">Sales Executive</label>
                     <div className="relative">
                       <input
                         type="text"
                         value={formData.salesExecutiveName}
                         onChange={(e) => {
                           const value = e.target.value;
                           handleFormChange('salesExecutiveName', value);
                           setSalesExecutiveSearchTerm(value);
                           setShowSalesExecutiveDropdown(true);
                           // Clear the salesExecutive ID when typing manually
                           handleFormChange('salesExecutive', '');
                         }}
                         onFocus={() => setShowSalesExecutiveDropdown(true)}
                         placeholder="Type to search or enter new name"
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                       />
                       
                       {/* Dropdown Arrow */}
                       <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                         <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                         </svg>
                       </div>
                       
                       {/* Dropdown List */}
                       {showSalesExecutiveDropdown && (
                         <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                           {/* Filtered sales executives */}
                           {salesExecutives
                             .filter(exec => 
                               exec.name.toLowerCase().includes(salesExecutiveSearchTerm.toLowerCase()) ||
                               exec.username.toLowerCase().includes(salesExecutiveSearchTerm.toLowerCase())
                             )
                             .filter(exec => exec.role === 'sales-executive') // Only show actual sales executives
                             .map((exec, index) => (
                               <div
                                 key={`exec-${exec._id || index}-${index}`}
                                 className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-black"
                                 onClick={() => {
                                   handleFormChange('salesExecutiveName', exec.name);
                                   handleFormChange('salesExecutive', exec._id);
                                   setSalesExecutiveSearchTerm(exec.name);
                                   setShowSalesExecutiveDropdown(false);
                                 }}
                               >
                                 <div className="font-medium">{exec.name}</div>
                                 <div className="text-sm text-gray-500">{exec.email}</div>
                               </div>
                             ))}
                           
                           {/* Show "Create new" option if no exact match */}
                           {salesExecutiveSearchTerm && 
                            !salesExecutives.some(exec => 
                              exec.name.toLowerCase() === salesExecutiveSearchTerm.toLowerCase()
                            ) && (
                             <div
                               className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-blue-600 border-t border-gray-200"
                               onClick={() => {
                                 handleFormChange('salesExecutiveName', salesExecutiveSearchTerm);
                                 handleFormChange('salesExecutive', ''); // No ID for new executives
                                 setShowSalesExecutiveDropdown(false);
                               }}
                             >
                               <div className="font-medium">Create new: "{salesExecutiveSearchTerm}"</div>
                               <div className="text-sm text-gray-500">This will create a new sales executive</div>
                             </div>
                           )}
                           
                           {/* No results */}
                           {salesExecutiveSearchTerm && 
                            salesExecutives.filter(exec => 
                              exec.name.toLowerCase().includes(salesExecutiveSearchTerm.toLowerCase()) ||
                              exec.username.toLowerCase().includes(salesExecutiveSearchTerm.toLowerCase())
                            ).length === 0 && (
                             <div className="px-3 py-2 text-gray-500 text-sm">
                               No existing sales executives found
                             </div>
                           )}
                         </div>
                       )}
                     </div>
                   </div>
                   
                   {/* Service */}
                   <div>
                     <label className="block text-sm font-medium text-black mb-1">Service *</label>
                     <select
                       value={selectedService}
                       onChange={(e) => handleServiceChange(e.target.value)}
                       required
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                     >
                       <option value="">Select Service</option>
                       {getMainServices().map(service => (
                         <option key={service} value={service}>{service}</option>
                       ))}
                     </select>
                </div>

                   {/* Sub-service */}
                   <div>
                     <label className="block text-sm font-medium text-black mb-1">Sub-service</label>
                     {selectedService ? (
                       <div>
                         <select
                           value={showCustomSubservice ? 'custom' : selectedSubservice}
                           onChange={(e) => handleSubserviceChange(e.target.value)}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                         >
                           <option value="">Select Sub-service</option>
                           {SERVICE_SUBSERVICE_MAP[selectedService]?.map(subservice => (
                             <option key={subservice} value={subservice}>{subservice}</option>
                           ))}
                           <option value="custom">+ Add Custom Sub-service</option>
                         </select>
                         
                         {showCustomSubservice && (
                           <input
                             type="text"
                             value={customSubservice}
                             onChange={(e) => setCustomSubservice(e.target.value)}
                             placeholder="Enter custom sub-service"
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2 text-black"
                           />
                         )}
                       </div>
                     ) : (
                       <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-black">
                         Please select a service first
                       </div>
                     )}
                   </div>
                   
                   {/* Enquiry Details */}
                   <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-black mb-1">Enquiry Details</label>
                     <textarea
                       value={formData.enquiryDetails}
                       onChange={(e) => handleFormChange('enquiryDetails', e.target.value)}
                       rows={4}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                       placeholder="Enter detailed enquiry information..."
                     />
                   </div>

                   {/* Comments */}
                   <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-black mb-1">Comments</label>
                     <textarea
                       value={formData.comments}
                       onChange={(e) => handleFormChange('comments', e.target.value)}
                       rows={3}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                       placeholder="Add comments or notes..."
                     />
                   </div>

                   {/* Amount */}
                   <div>
                     <label className="block text-sm font-medium text-black mb-1">Amount (₹)</label>
                     <input
                       type="number"
                       value={formData.amount}
                       onChange={(e) => handleFormChange('amount', e.target.value)}
                       min="0"
                       step="0.01"
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                       placeholder="Enter amount"
                     />
                   </div>
                 </div>

                 <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingVisitor(null);
                       setSelectedService('');
                       setSelectedSubservice('');
                       setCustomSubservice('');
                       setShowCustomSubservice(false);
                       setFormData({
                         name: '',
                         email: '',
                         phone: '',
                         organization: '',
                         region: '',
                         source: 'chatbot',
                         enquiryDetails: '',
                         status: 'new',
                         assignedAgent: '',
                         agentName: '',
                         salesExecutive: '',
                         salesExecutiveName: '',
                         comments: '',
                         amount: 0
                       });
                     }}
                     className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                     className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
                  >
                     Update Visitor
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
