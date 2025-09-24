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



export default function AdminVisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
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
  const [agents, setAgents] = useState<any[]>([
    { _id: '1', name: 'Admin', email: 'admin@envirocare.com', role: 'admin' },
    { _id: '2', name: 'Sanjana Pawar', email: 'sanjana@envirocare.com', role: 'executive' }
  ]);
  const [salesExecutives, setSalesExecutives] = useState<any[]>([
    { _id: '1', name: 'Sales Executive 1', email: 'sales1@envirocare.com', role: 'sales' },
    { _id: '2', name: 'Sales Executive 2', email: 'sales2@envirocare.com', role: 'sales' }
  ]);
  const [assigningAgent, setAssigningAgent] = useState<string | null>(null);
  const [assigningSalesExecutive, setAssigningSalesExecutive] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSalesExecutiveDropdown, setShowSalesExecutiveDropdown] = useState(false);
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

  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('ems_token') : null), []);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

  // Debug logging for agents and sales executives
  useEffect(() => {
    console.log('🔍 Current agents state:', agents.length, agents);
    console.log('🔍 Current sales executives state:', salesExecutives.length, salesExecutives);
  }, [agents, salesExecutives]);


  // Assign sales executive to visitor
  const assignSalesExecutiveToVisitor = async (visitorId: string, salesExecutiveId: string, salesExecutiveName: string) => {
    if (!token) return;

    try {
      setIsUpdating(true);
      setError(null);

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
    } finally {
      setIsUpdating(false);
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
        } catch (parseError) {
          errorData = { error: 'Failed to parse server response' };
        }
        
        console.error('❌ Error assigning agent:', errorData);
        setError((errorData as any).error || (errorData as any).details || `Server error (${response.status}): Failed to assign agent`);
      }
    } catch (error) {
      console.error('❌ Error assigning agent:', error);
      setError(`Failed to assign agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAssigningAgent(null);
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Move loadVisitors outside useEffect to make it accessible
  const loadVisitors = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      
      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`${API_BASE}/api/visitors?${params}`, { headers });

      if (response.ok) {
        const responseData = await response.json();
        setVisitors(responseData.items || responseData.visitors || []);
        setPagination({
          page: pagination.page,
          limit: pagination.limit,
          total: responseData.total || 0,
          pages: Math.ceil((responseData.total || 0) / pagination.limit)
        });
      } else {
        throw new Error('API failed');
      }

    } catch (e: any) {
      console.error('API failed, using fallback data:', e);
      setError('Failed to load visitors from database');
    } finally {
      setLoading(false);
    }
  }, [API_BASE, pagination.page, pagination.limit, debouncedSearchTerm, filters.status]);

  useEffect(() => {
    // Get user info from localStorage
    const userStr = localStorage.getItem('ems_user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    loadVisitors();
  }, [API_BASE, pagination.page, pagination.limit, debouncedSearchTerm, filters.status, loadVisitors]);

  // Auto-refresh every 30 seconds to sync with real-time changes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing admin visitor data...');
      loadVisitors();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loadVisitors]);

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
      
      if (showMonthPicker && !target.closest('.month-picker')) {
        setShowMonthPicker(false);
      }
      
      if (showSalesExecutiveDropdown && !target.closest('.sales-executive-dropdown')) {
        setShowSalesExecutiveDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown, showColumnFilter, showStatusFilter, showTimeFilter, showMonthPicker, showSalesExecutiveDropdown]);

  const updateVisitorStatus = async (visitorId: string, status: string, notes?: string) => {
    if (!token) return;

    try {
      const headers = { 
        'Content-Type': 'application/json'
      };
      const response = await fetch(`${API_BASE}/api/analytics/update-visitor-status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ visitorId, status, notes })
      });

      if (response.ok) {
        const updatedVisitor = await response.json();
        // Update local state
        setVisitors(prev => prev.map(v => 
          v._id === visitorId ? { ...v, ...updatedVisitor } : v
        ));
        if (selectedVisitor?._id === visitorId) {
          setSelectedVisitor(prev => prev ? { ...prev, ...updatedVisitor } : null);
        }
        
        // Refresh data from server to ensure consistency
        await loadVisitors();
        console.log('✅ Visitor status updated successfully and data refreshed from server');
      } else {
        const errorData = await response.json();
        console.error('Error updating visitor status:', errorData);
        setError(errorData.message || 'Failed to update visitor status');
      }
    } catch (e) {
      console.error('Error updating visitor status:', e);
    }
  };

  const updateVisitorDetails = async (visitorData: Partial<Visitor>) => {
    if (!token || !editingVisitor) {
      setError('Missing authentication token or visitor data');
      return;
    }

    try {
      setIsUpdating(true);
      setError(null); // Clear any previous errors
      
      const headers = { 
        'Content-Type': 'application/json'
      };
      
      // Prepare the update data with validation
      const updateData = {
        visitorId: editingVisitor._id,
        ...visitorData
      };

      // Validate the update data
      if (!updateData.visitorId) {
        setError('Visitor ID is missing');
        return;
      }

      console.log('Updating visitor with data:', updateData);
      console.log('Region being sent:', updateData.region);
      console.log('Sales Executive Name being sent:', updateData.salesExecutiveName);

      const response = await fetch(`${API_BASE}/api/analytics/update-visitor-details`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedVisitor = await response.json();
        console.log('Visitor updated successfully:', updatedVisitor);
        console.log('Updated region:', updatedVisitor.region);
        console.log('Updated sales executive name:', updatedVisitor.salesExecutiveName);
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
        // Show success notification
        console.log('✅ Visitor updated successfully and data refreshed from server');
        
        // You could add a toast notification here
        // For now, we'll just clear any existing errors
      } else {
        let errorMessage = 'Failed to update visitor details';
        try {
          const errorData = await response.json();
          console.error('Error updating visitor:', errorData);
          
          // Handle specific error types
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = `Validation errors: ${errorData.errors.join(', ')}`;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        
        console.error('Response status:', response.status);
        console.error('Response headers:', response.headers);
        setError(errorMessage);
      }
    } catch (e) {
      console.error('Error updating visitor details:', e);
      setError('Failed to update visitor details');
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleLeadConversion = async (visitorId: string, isConverted: boolean) => {
    if (!token) return;

    try {
      const headers = { 
        'Content-Type': 'application/json'
      };
      const response = await fetch(`${API_BASE}/api/analytics/update-lead-conversion`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ visitorId, isConverted })
      });

      if (response.ok) {
        setVisitors(prev => prev.map(v => 
          v._id === visitorId ? { ...v, isConverted } : v
        ));
      }
    } catch (e) {
      console.error('Error updating lead conversion:', e);
    }
  };

  // Export functions
  const exportToCSV = () => {
    const csvData = filteredVisitors.map((visitor, index) => ({
      'Sr. No.': index + 1,
      'Name of Client': visitor.name || '',
      'Agent': visitor.agentName || 'Unassigned',
      'Status': visitor.status || 'New',
      'Date & Time': new Date(visitor.createdAt).toLocaleString(),
      'Service': getServiceDisplayName(visitor.service) || visitor.service,
      'Sub-service': visitor.subservice || '',
      'Enquiry Details': visitor.enquiryDetails || '',
      'Source': visitor.source || '',
      'Contact no.': visitor.phone || '',
      'Email id': visitor.email || '',
      'Organization': visitor.organization || '',
      'Region': visitor.region || '',
      'Comments': visitor.comments || '',
      'Amount': visitor.amount || 0
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
      visitor.agentName || 'Unassigned',
      visitor.status || 'New',
      new Date(visitor.createdAt).toLocaleString(),
      getServiceDisplayName(visitor.service) || visitor.service,
      visitor.subservice || '',
      visitor.enquiryDetails || '',
      visitor.source || '',
      visitor.phone || '',
      visitor.email || '',
      visitor.organization || '',
      visitor.region || '',
      visitor.comments || '',
      visitor.amount || 0
    ]);

    const headers = [
      'Sr. No.', 'Name of Client', 'Agent', 'Status', 'Date & Time',
      'Service', 'Sub-service', 'Enquiry Details', 'Source', 'Contact no.',
      'Email id', 'Organization', 'Region', 'Comments', 'Amount'
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
    
    // Count all visitors by source (not just filtered ones)
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
    console.log(`Form field changed: ${field} = ${value}`);
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      console.log('Updated form data:', newData);
      return newData;
    });
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
    const initialFormData = {
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
    };
    
    console.log('Initializing form with visitor data:', visitor);
    console.log('Initial form data:', initialFormData);
    console.log('Visitor region:', visitor.region);
    console.log('Visitor sales executive name:', visitor.salesExecutiveName);
    
    setFormData(initialFormData);
    
    setShowEditForm(true);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar userRole="admin" userName={user?.name} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader userRole="admin" userName={user?.name} />
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
        <Sidebar userRole="admin" userName={user?.name} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader userRole="admin" userName={user?.name} />
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
      <Sidebar userRole="admin" userName={user?.name} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userRole="admin" userName={user?.name} />
        
        <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl shadow-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Visitors Management</h1>
                <p className="text-gray-600">Manage and track all visitors through the pipeline</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Export Dropdown */}
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
                
                {/* Refresh Button */}
                <button
                  onClick={() => {
                    console.log('🔄 Manual refresh triggered');
                    loadVisitors();
                  }}
                  className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                  title="Refresh data"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
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
                    <tr key={visitor._id} className="hover:bg-gray-50">
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
                                // Handle unassigning
                                assignAgentToVisitor(visitor._id, '', '');
                              }
                            }}
                          >
                            <option value="">Unassigned</option>
                            {agents.length > 0 ? (
                              agents.map(agent => (
                                <option key={agent._id || agent.id} value={agent._id || agent.id}>
                                  {agent.name || agent.username || 'Unknown Agent'}
                                </option>
                              ))
                            ) : (
                              <option value="" disabled>Loading agents...</option>
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
                                 currentStatus={selectedVisitor.status}
                                 onStatusChange={(status, notes) => updateVisitorStatus(selectedVisitor._id, status, notes)}
                                 className="w-full"
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
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                
                try {
                  // Prevent multiple submissions
                  if (isUpdating) {
                    console.log('Update already in progress, ignoring submission');
                    return;
                  }
                  
                  // Validate required fields
                  if (!formData.name || !formData.email) {
                    setError('Name and email are required');
                    return;
                  }
                  
                  if (!selectedService) {
                    setError('Service is required');
                    return;
                  }
                 
                  // Determine the final subservice value
                  const finalSubservice = showCustomSubservice ? customSubservice : selectedSubservice;
                  
                  // Validate custom subservice
                  if (showCustomSubservice && (!customSubservice || customSubservice.trim() === '')) {
                    setError('Please enter a custom sub-service name');
                    return;
                  }
                  
                  console.log('Form submission - finalSubservice:', finalSubservice);
                  console.log('Form submission - selectedSubservice:', selectedSubservice);
                  console.log('Form submission - customSubservice:', customSubservice);
                  console.log('Form submission - showCustomSubservice:', showCustomSubservice);
                  
                  const updateData = {
                     name: formData.name.trim(),
                     email: formData.email.trim(),
                     phone: formData.phone?.trim() || '',
                     organization: formData.organization?.trim() || '',
                     region: formData.region?.trim() || '',
                     service: selectedService,
                     subservice: finalSubservice?.trim() || '',
                     enquiryDetails: formData.enquiryDetails?.trim() || '',
                     source: formData.source,
                     status: formData.status,
                     assignedAgent: formData.assignedAgent || '',
                     agentName: formData.agentName || '',
                     salesExecutive: '', // Clear ID since we're using manual entry
                     salesExecutiveName: formData.salesExecutiveName?.trim() || '',
                     comments: formData.comments?.trim() || '',
                     amount: Number(formData.amount) || 0
                  };
                  
                  console.log('Form submission - Final update data:', updateData);
                  console.log('Form submission - Region value:', updateData.region);
                  console.log('Form submission - Sales Executive Name value:', updateData.salesExecutiveName);
                  
                  await updateVisitorDetails(updateData);
                } catch (error) {
                  console.error('Form submission error:', error);
                  setError('Failed to submit form. Please try again.');
                }
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
                   <div>
                     <label className="block text-sm font-medium text-black mb-1">Sales Executive</label>
                     <div className="relative sales-executive-dropdown">
                       <input
                         type="text"
                         value={formData.salesExecutiveName}
                         onChange={(e) => {
                           handleFormChange('salesExecutiveName', e.target.value);
                           // Clear the salesExecutive ID when typing manually
                           handleFormChange('salesExecutive', '');
                           setShowSalesExecutiveDropdown(true);
                         }}
                         onFocus={() => setShowSalesExecutiveDropdown(true)}
                         onBlur={() => {
                           // Delay hiding dropdown to allow clicking on options
                           setTimeout(() => setShowSalesExecutiveDropdown(false), 200);
                         }}
                         placeholder="Select sales executive or type custom name"
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                       />
                       
                       {/* Dropdown arrow */}
                       <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                         <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                         </svg>
                       </div>
                       
                       {/* Dropdown options */}
                       {showSalesExecutiveDropdown && (
                         <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                           <div className="py-1">
                             {/* Filter sales executives based on input */}
                             {salesExecutives
                               .filter(exec => 
                                 !formData.salesExecutiveName || 
                                 (exec.name || exec.username || '').toLowerCase().includes(formData.salesExecutiveName.toLowerCase())
                               )
                               .map(exec => (
                                 <button
                                   key={exec._id || exec.id}
                                   type="button"
                                   onClick={() => {
                                     const execName = exec.name || exec.username || '';
                                     handleFormChange('salesExecutiveName', execName);
                                     handleFormChange('salesExecutive', exec._id || exec.id);
                                     setShowSalesExecutiveDropdown(false);
                                   }}
                                   className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                 >
                                   {exec.name || exec.username || 'Unknown'}
                                 </button>
                               ))}
                             
                             {/* Show "No matches" if no executives match the filter */}
                             {salesExecutives.filter(exec => 
                               !formData.salesExecutiveName || 
                               (exec.name || exec.username || '').toLowerCase().includes(formData.salesExecutiveName.toLowerCase())
                             ).length === 0 && formData.salesExecutiveName && (
                               <div className="px-4 py-2 text-sm text-gray-500">
                                 No registered sales executives found. You can type a custom name.
                               </div>
                             )}
                             
                             {/* Show message if no sales executives are available at all */}
                             {salesExecutives.length === 0 && (
                               <div className="px-4 py-2 text-sm text-gray-500">
                                 No registered sales executives available. You can type a custom name.
                               </div>
                             )}
                           </div>
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
                    disabled={isUpdating}
                     className={`px-6 py-2 text-sm font-medium text-white border border-transparent rounded-md transition-colors ${
                       isUpdating 
                         ? 'bg-gray-400 cursor-not-allowed' 
                         : 'bg-blue-600 hover:bg-blue-700'
                     }`}
                  >
                     {isUpdating ? 'Updating...' : 'Update Visitor'}
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

