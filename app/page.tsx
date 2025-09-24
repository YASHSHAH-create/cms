'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ChatbotWidget from '@/components/ChatbotWidget';
import PipelineFlowchart from '@/components/PipelineFlowchart';
import { getServiceDisplayName } from '@/lib/utils/serviceMapping';
import api from '@/lib/api';

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

export default function Home() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showTimeFilter, setShowTimeFilter] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [showPipeline, setShowPipeline] = useState(false);
  const router = useRouter();

  // Using Next.js API routes instead of external backend

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    'Sr.no.': true,
    'Name of Client': true,
    'Agent': true,
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
    'Sales Executive': true,
    'Comments': true,
    'Amount': true
  });

  // Filters state
  const [filters, setFilters] = useState({
    status: 'all',
    timePeriod: 'all',
    month: 'all'
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load visitors data
  const loadVisitors = useCallback(async () => {
    try {
      setLoading(true);
      // Get all visitors by setting a high limit
      const data = await api.visitors.list({ limit: 1000 });
      console.log('📊 API Response:', data);
      setVisitors(data.items || data.visitors || []);
    } catch (e) {
      console.error('Error loading visitors:', e);
      setError('Failed to load visitors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVisitors();
  }, [loadVisitors]);

  // Column visibility change handler
  const handleColumnVisibilityChange = (columnName: string, isVisible: boolean) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnName]: isVisible
    }));
  };

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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown, showColumnFilter, showStatusFilter, showTimeFilter, showMonthPicker]);

  // Filter visitors based on search term and filters
  const filteredVisitors = useMemo(() => {
    let filtered = visitors;

    // Search filter
    if (debouncedSearchTerm) {
      filtered = filtered.filter(visitor =>
        visitor.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.organization?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.phone?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.region?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.service?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.subservice?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.agentName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.salesExecutiveName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.status?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.enquiryDetails?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.comments?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        visitor.source?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(visitor => visitor.status === filters.status);
    }

    // Time period filter
    if (filters.timePeriod !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.timePeriod) {
        case 'daily':
          filterDate.setDate(now.getDate() - 1);
          break;
        case 'weekly':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(visitor => 
        new Date(visitor.createdAt) >= filterDate
      );
    }

    // Month filter
    if (filters.month !== 'all') {
      filtered = filtered.filter(visitor => {
        const visitorDate = new Date(visitor.createdAt);
        return visitorDate.getMonth() + 1 === parseInt(filters.month);
      });
    }

    return filtered;
  }, [visitors, debouncedSearchTerm, filters]);

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
      'Region': visitor.region || '',
      'Sales Executive': visitor.salesExecutiveName || '',
      'Comments': visitor.comments || '',
      'Amount': visitor.amount || 0
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          return typeof value === 'string' && value.includes(',')
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

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleRegisterClick = () => {
    router.push('/register');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Image 
                src="/envirocare-logo.png" 
                alt="Envirocare Labs" 
                width={200} 
                height={50} 
                className="h-12 w-auto"
              />
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRegisterClick}
                className="border border-green-600 text-green-600 hover:bg-green-50 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Register
              </button>
              <button
                onClick={handleLoginClick}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 shadow-md"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-red-700 font-medium">{error}</div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Visitors Management</h1>
              <p className="text-gray-600">View and manage all visitors through the pipeline</p>
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search visitors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative status-filter">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <button
                onClick={() => setShowStatusFilter(!showStatusFilter)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left text-gray-900 flex items-center justify-between"
              >
                <span>{PIPELINE_STAGES.find(s => s.id === filters.status)?.name || 'All Statuses'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showStatusFilter && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <button
                    onClick={() => {
                      setFilters(prev => ({ ...prev, status: 'all' }));
                      setShowStatusFilter(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-100"
                  >
                    All Statuses
                  </button>
                  {PIPELINE_STAGES.map(stage => (
                    <button
                      key={stage.id}
                      onClick={() => {
                        setFilters(prev => ({ ...prev, status: stage.id }));
                        setShowStatusFilter(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-100"
                    >
                      {stage.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Time Period Filter */}
            <div className="relative time-filter">
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
              <button
                onClick={() => setShowTimeFilter(!showTimeFilter)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left text-gray-900 flex items-center justify-between"
              >
                <span>{TIME_PERIODS.find(t => t.id === filters.timePeriod)?.name || 'All Time'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showTimeFilter && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  {TIME_PERIODS.map(period => (
                    <button
                      key={period.id}
                      onClick={() => {
                        setFilters(prev => ({ ...prev, timePeriod: period.id }));
                        setShowTimeFilter(false);
                        // If monthly is selected, show month picker
                        if (period.id === 'monthly') {
                          setShowMonthPicker(true);
                        }
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-100"
                    >
                      {period.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Month Filter - Only show when Monthly is selected */}
            {filters.timePeriod === 'monthly' && (
              <div className="relative month-picker">
                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                <button
                  onClick={() => setShowMonthPicker(!showMonthPicker)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left text-gray-900 flex items-center justify-between"
                >
                  <span>{filters.month === 'all' ? 'All Months' : MONTHS.find(m => m.id === filters.month)?.name || 'All Months'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showMonthPicker && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        setFilters(prev => ({ ...prev, month: 'all' }));
                        setShowMonthPicker(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-100"
                    >
                      All Months
                    </button>
                    {MONTHS.map(month => (
                      <button
                        key={month.id}
                        onClick={() => {
                          setFilters(prev => ({ ...prev, month: month.id }));
                          setShowMonthPicker(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-100"
                      >
                        {month.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Columns Filter - Show when not monthly or as 4th column */}
            {filters.timePeriod !== 'monthly' && (
              <div className="relative column-filter">
                <label className="block text-sm font-medium text-gray-700 mb-2">Show Columns</label>
                <button
                  onClick={() => setShowColumnFilter(!showColumnFilter)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left text-gray-900 flex items-center justify-between"
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
            )}
          </div>
        </div>

        {/* Visitors Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <div className="text-gray-600">Loading visitors...</div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {visibleColumns['Sr.no.'] && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sr.no.
                      </th>
                    )}
                    {visibleColumns['Name of Client'] && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name of Client
                      </th>
                    )}
                    {visibleColumns['Agent'] && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agent
                      </th>
                    )}
                    {visibleColumns['Status'] && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    )}
                    {visibleColumns['Date & Time'] && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                    )}
                    {visibleColumns['Service'] && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                    )}
                    {visibleColumns['Sub-service'] && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sub-service
                      </th>
                    )}
                    {visibleColumns['Enquiry Details'] && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enquiry Details
                      </th>
                    )}
                    {visibleColumns['Source'] && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                    )}
                    {visibleColumns['Contact no.'] && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact no.
                      </th>
                    )}
                    {visibleColumns['Email id'] && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email id
                      </th>
                    )}
                    {visibleColumns['Organization'] && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Organization
                      </th>
                    )}
                    {visibleColumns['Region'] && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Region
                      </th>
                    )}
                    {visibleColumns['Sales Executive'] && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sales Executive
                      </th>
                    )}
                    {visibleColumns['Comments'] && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comments
                      </th>
                    )}
                    {visibleColumns['Amount'] && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVisitors.map((visitor, index) => (
                    <tr key={visitor._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {visibleColumns['Sr.no.'] && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                      )}
                      {visibleColumns['Name of Client'] && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {visitor.name || 'N/A'}
                          </div>
                        </td>
                      )}
                      {visibleColumns['Agent'] && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {visitor.agentName || visitor.assignedAgent || 'Unassigned'}
                          </div>
                        </td>
                      )}
                      {visibleColumns['Status'] && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedVisitor(visitor);
                              setShowPipeline(true);
                            }}
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full hover:opacity-80 transition-opacity cursor-pointer ${
                              visitor.status === 'converted' ? 'bg-green-100 text-green-800' :
                              visitor.status === 'qualified' ? 'bg-blue-100 text-blue-800' :
                              visitor.status === 'quotation_sent' ? 'bg-yellow-100 text-yellow-800' :
                              visitor.status === 'negotiation_stage' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                            title="Click to view pipeline and status history"
                          >
                            {visitor.status?.replace(/_/g, ' ') || 'New'}
                          </button>
                        </td>
                      )}
                      {visibleColumns['Date & Time'] && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(visitor.createdAt).toLocaleString()}
                        </td>
                      )}
                      {visibleColumns['Service'] && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getServiceDisplayName(visitor.service) || visitor.service || 'N/A'}
                          </div>
                        </td>
                      )}
                      {visibleColumns['Sub-service'] && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {visitor.subservice || 'N/A'}
                          </div>
                        </td>
                      )}
                      {visibleColumns['Enquiry Details'] && (
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {visitor.enquiryDetails || 'N/A'}
                          </div>
                        </td>
                      )}
                      {visibleColumns['Source'] && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {visitor.source || 'N/A'}
                          </span>
                        </td>
                      )}
                      {visibleColumns['Contact no.'] && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {visitor.phone || 'N/A'}
                        </td>
                      )}
                      {visibleColumns['Email id'] && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {visitor.email || 'N/A'}
                        </td>
                      )}
                      {visibleColumns['Organization'] && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {visitor.organization || 'N/A'}
                        </td>
                      )}
                      {visibleColumns['Region'] && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {visitor.region || 'N/A'}
                        </td>
                      )}
                      {visibleColumns['Sales Executive'] && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(() => {
                            // Don't show Sanjana as Sales Executive
                            if (visitor.salesExecutiveName === 'Sanjana Pawar') {
                              return 'N/A';
                            }
                            return visitor.salesExecutiveName || 'N/A';
                          })()}
                        </td>
                      )}
                      {visibleColumns['Comments'] && (
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {visitor.comments || 'N/A'}
                          </div>
                        </td>
                      )}
                      {visibleColumns['Amount'] && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {visitor.amount ? `₹${visitor.amount.toLocaleString()}` : 'N/A'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* No results */}
          {!loading && filteredVisitors.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              {searchTerm || filters.status !== 'all' || filters.timePeriod !== 'all' || filters.month !== 'all'
                ? 'No visitors found matching your filters.'
                : 'No visitors found.'}
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredVisitors.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {filteredVisitors.length} visitors
            </div>
          </div>
        )}
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
              {/* Pipeline Flowchart - Read Only Mode */}
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-blue-800 font-medium">Read-Only View</p>
                  </div>
                  <p className="text-blue-700 text-sm mt-1">
                    This is a read-only view of the pipeline. You can see the current status and executive notes, but cannot make changes.
                  </p>
                </div>
                
                <PipelineFlowchart
                  key={`pipeline-${selectedVisitor._id}-${selectedVisitor.status}`}
                  currentStatus={selectedVisitor.status}
                  onStatusChange={() => {}} // Empty function for read-only mode
                  className="w-full"
                  pipelineHistory={selectedVisitor.pipelineHistory || []}
                  readOnly={true}
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chatbot Widget */}
      <ChatbotWidget isOpen={isChatbotOpen} onToggle={() => setIsChatbotOpen(!isChatbotOpen)} />
      
      {/* Chatbot Toggle Button */}
      {!isChatbotOpen && (
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-[#2d4891] to-[#1e3a8a] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-40"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}
    </div>
  );
}
