'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';

type Enquiry = {
  _id: string;
  visitorName: string;
  phoneNumber: string;
  email: string;
  enquiryType: 'chatbot' | 'email' | 'calls' | 'website';
  enquiryDetails: string;
  createdAt: string;
  status: string;
  assignedAgent?: string;
};

type EnquiryFormData = {
  visitorName: string;
  phoneNumber: string;
  email: string;
  enquiryType: 'chatbot' | 'email' | 'calls' | 'website';
  enquiryDetails: string;
};

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'chatbot' | 'email' | 'calls' | 'website'>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    enquiryType: ''
  });
  const [dataSource, setDataSource] = useState<'enquiries' | 'visitors'>('enquiries');

  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('ems_token') : null), []);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

  const loadEnquiries = async () => {
    if (!token) {
      setError('No authentication token found. Please login again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setDataSource('enquiries');
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });
      if (filters.status) params.append('status', filters.status);
      if (filters.enquiryType) params.append('enquiryType', filters.enquiryType);

      const response = await fetch(`${API_BASE}/api/analytics/enquiries-management?${params}`, { headers });

      if (response.status === 401) {
        setError('Authentication failed. Please login again.');
        localStorage.removeItem('ems_token');
        localStorage.removeItem('ems_user');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load enquiries');
      }

      const responseData = await response.json();
      const list = responseData.enquiries || [];
      setEnquiries(list);
      setPagination(responseData.pagination || {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0
      });

      // Fallback: if there are no enquiries OR fewer enquiries than expected visitors, show visitors as enquiries
      if (!list || list.length === 0 || list.length < 3) { // Assuming we expect at least 3-4 visitors
        const visitorsRes = await fetch(`${API_BASE}/api/analytics/visitors-management?${params}`, { headers });
        if (visitorsRes.ok) {
          const visitorsData = await visitorsRes.json();
          const visitors = visitorsData.visitors || [];
          const mapped: Enquiry[] = visitors.map((v: any) => ({
            _id: v._id,
            visitorName: v.name || 'Unknown',
            phoneNumber: v.phone || '',
            email: v.email || '',
            enquiryType: (['chatbot','email','calls','website'].includes(v.source) ? v.source : 'chatbot') as Enquiry['enquiryType'],
            enquiryDetails: v.service ? `${v.service}${v.organization ? ' - ' + v.organization : ''}` : (v.organization || 'General enquiry'),
            createdAt: v.createdAt,
            status: v.status || 'new',
            assignedAgent: v.agent || 'Unassigned'
          }));
          setEnquiries(mapped);
          setPagination(visitorsData.pagination || {
            page: 1,
            limit: 50,
            total: mapped.length,
            pages: 1
          });
          setDataSource('visitors');
        }
      }

    } catch (e: any) {
      console.error('Error loading enquiries:', e);
      setError(e.message || 'Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('ems_token');
    const userStr = localStorage.getItem('ems_user');
    
    if (!token || !userStr) {
      console.error('No authentication token or user data found');
      setError('Please login to access this page.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }

    // Get user info from localStorage
    try {
      setUser(JSON.parse(userStr));
    } catch (e) {
      console.error('Error parsing user data:', e);
      setError('Invalid user data. Please login again.');
      localStorage.removeItem('ems_token');
      localStorage.removeItem('ems_user');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }

    loadEnquiries();
  }, [API_BASE, token, pagination.page, pagination.limit, filters.status, filters.enquiryType]);

  const addEnquiry = async (formData: EnquiryFormData) => {
    if (!token) {
      console.error('No authentication token found');
      setError('No authentication token found. Please login again.');
      // Redirect to login page
      window.location.href = '/login';
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('🔍 Adding enquiry with data:', formData);
      console.log('🔍 API_BASE:', API_BASE);
      console.log('🔍 Token exists:', !!token);
      
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log('🔍 Request headers:', headers);
      console.log('🔍 Request URL:', `${API_BASE}/api/analytics/add-enquiry`);
      
      const response = await fetch(`${API_BASE}/api/analytics/add-enquiry`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });

      console.log('📊 Response status:', response.status);
      console.log('📊 Response ok:', response.ok);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const newEnquiry = await response.json();
        console.log('✅ New enquiry created:', newEnquiry);
        setEnquiries(prev => [newEnquiry, ...prev]);
        setShowAddForm(false);
        setError(null); // Clear any previous errors
        // Reset form
        const form = document.getElementById('addEnquiryForm') as HTMLFormElement;
        if (form) form.reset();
        // Reload enquiries to get updated pagination
        loadEnquiries();
      } else if (response.status === 401 || response.status === 403) {
        // Authentication/Authorization error
        console.error('❌ Authentication error:', response.status);
        setError('Authentication failed. Please login again.');
        // Clear invalid token and redirect to login
        localStorage.removeItem('ems_token');
        localStorage.removeItem('ems_user');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          console.error('❌ Failed to add enquiry:', errorData);
          
          // Handle specific error cases
          if (response.status === 409 && errorData.message === 'Duplicate enquiry') {
            errorMessage = `This visitor already has a ${errorData.details?.split(' ').pop() || 'similar'} enquiry. Please choose a different enquiry type or visitor.`;
          } else {
            errorMessage = errorData.message || errorData.error || 'Unknown error';
          }
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError);
          const errorText = await response.text();
          console.error('❌ Raw error response:', errorText);
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        setError(`Failed to add enquiry: ${errorMessage}`);
      }
    } catch (e) {
      console.error('❌ Error adding enquiry:', e);
      if (e instanceof Error && e.message.includes('fetch')) {
        setError('Error adding enquiry: Backend server is not available. Please check if the server is running.');
      } else {
        setError(`Error adding enquiry: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submitted');
    
    const formData = new FormData(e.currentTarget);
    
    // Get form values
    const phoneNumber = formData.get('phoneNumber') as string;
    const email = formData.get('email') as string;
    const visitorName = formData.get('visitorName') as string;
    const enquiryType = formData.get('enquiryType') as string;
    const enquiryDetails = formData.get('enquiryDetails') as string;
    
    console.log('Form data:', { visitorName, phoneNumber, email, enquiryType, enquiryDetails });
    
    // Validate required fields
    if (!visitorName?.trim()) {
      alert('Visitor name is required');
      return;
    }
    
    if (!enquiryType) {
      alert('Enquiry type is required');
      return;
    }
    
    if (!enquiryDetails?.trim()) {
      alert('Enquiry details are required');
      return;
    }
    
    // Validate that either phone or email is provided
    if (!phoneNumber?.trim() && !email?.trim()) {
      alert('Please provide either a phone number or email address');
      return;
    }
    
    const enquiryData = {
      visitorName: visitorName.trim(),
      phoneNumber: phoneNumber?.trim() || '',
      email: email?.trim() || '',
      enquiryType: enquiryType as 'chatbot' | 'email' | 'calls' | 'website',
      enquiryDetails: enquiryDetails.trim()
    };
    
    console.log('Sending enquiry data:', enquiryData);
    addEnquiry(enquiryData);
  };

  const updateEnquiry = async (enquiryId: string, formData: Partial<Enquiry>) => {
    if (!token) {
      console.error('No authentication token found');
      setError('No authentication token found. Please login again.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('🔍 Updating enquiry with data:', { enquiryId, formData });
      console.log('🔍 API_BASE:', API_BASE);
      console.log('🔍 Token exists:', !!token);
      
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log('🔍 Request headers:', headers);
      console.log('🔍 Request URL:', `${API_BASE}/api/analytics/update-enquiry`);
      
      const response = await fetch(`${API_BASE}/api/analytics/update-enquiry`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ enquiryId, ...formData })
      });

      console.log('📊 Update response status:', response.status);
      console.log('📊 Update response ok:', response.ok);
      console.log('📊 Update response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const updatedEnquiry = await response.json();
        console.log('Enquiry updated successfully:', updatedEnquiry);
        setEnquiries(prev => prev.map(e => 
          e._id === enquiryId ? updatedEnquiry : e
        ));
        setShowEditForm(false);
        setEditingEnquiry(null);
        setError(null);
        // Reload enquiries to get updated data
        loadEnquiries();
      } else {
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          console.error('Failed to update enquiry:', errorData);
          errorMessage = errorData.message || 'Unknown error';
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        setError(`Failed to update enquiry: ${errorMessage}`);
      }
    } catch (e) {
      console.error('Error updating enquiry:', e);
      if (e instanceof Error && e.message.includes('fetch')) {
        setError('Error updating enquiry: Backend server is not available. Please check if the server is running.');
      } else {
        setError(`Error updating enquiry: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Edit form submitted');
    
    if (!editingEnquiry) {
      console.error('No enquiry being edited');
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    
    // Get form values
    const phoneNumber = formData.get('phoneNumber') as string;
    const email = formData.get('email') as string;
    const visitorName = formData.get('visitorName') as string;
    const enquiryType = formData.get('enquiryType') as string;
    const enquiryDetails = formData.get('enquiryDetails') as string;
    
    console.log('Edit form data:', { visitorName, phoneNumber, email, enquiryType, enquiryDetails });
    
    // Validate required fields
    if (!visitorName?.trim()) {
      alert('Visitor name is required');
      return;
    }
    
    if (!enquiryType) {
      alert('Enquiry type is required');
      return;
    }
    
    if (!enquiryDetails?.trim()) {
      alert('Enquiry details are required');
      return;
    }
    
    // Validate that either phone or email is provided
    if (!phoneNumber?.trim() && !email?.trim()) {
      alert('Please provide either a phone number or email address');
      return;
    }
    
    const updateData = {
      visitorName: visitorName.trim(),
      phoneNumber: phoneNumber?.trim() || '',
      email: email?.trim() || '',
      enquiryType: enquiryType as 'chatbot' | 'email' | 'calls' | 'website',
      enquiryDetails: enquiryDetails.trim()
    };
    
    console.log('Sending update data:', updateData);
    updateEnquiry(editingEnquiry._id, updateData);
  };

  const deleteEnquiry = async (enquiryId: string) => {
    if (!token) {
      console.error('No authentication token found');
      setError('No authentication token found. Please login again.');
      window.location.href = '/login';
      return;
    }

    // Enhanced confirmation dialog
    const enquiry = enquiries.find(e => e._id === enquiryId);
    const confirmMessage = enquiry 
      ? `Are you sure you want to delete the enquiry for "${enquiry.visitorName}"?\n\nThis will permanently delete:\n• The enquiry record\n• The associated visitor record\n• All related data\n\nThis action cannot be undone.`
      : 'Are you sure you want to delete this enquiry? This action cannot be undone.';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      console.log('🗑️ Deleting enquiry:', enquiryId);
      const headers = { Authorization: `Bearer ${token}` };
      const response = await fetch(`${API_BASE}/api/analytics/delete-enquiry/${enquiryId}`, {
        method: 'DELETE',
        headers
      });

      console.log('📊 Delete response status:', response.status);

      if (response.ok) {
        setEnquiries(prev => prev.filter(e => e._id !== enquiryId));
        console.log('✅ Enquiry and associated visitor deleted successfully from database');
        
        // Show success message to user
        alert('✅ Enquiry and associated visitor have been deleted successfully from the database.');
        
        // Reload enquiries to get updated pagination
        loadEnquiries();
      } else if (response.status === 401 || response.status === 403) {
        // Authentication/Authorization error
        console.error('❌ Authentication error:', response.status);
        setError('Authentication failed. Please login again.');
        localStorage.removeItem('ems_token');
        localStorage.removeItem('ems_user');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to delete enquiry:', errorData);
        setError(`Failed to delete enquiry: ${errorData.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.error('❌ Error deleting enquiry:', e);
      setError('Error deleting enquiry. Please try again.');
    }
  };

  const filteredEnquiries = useMemo(() => {
    if (!Array.isArray(enquiries)) return [];
    if (activeTab === 'all') return enquiries;
    return enquiries.filter(enquiry => enquiry.enquiryType === activeTab);
  }, [enquiries, activeTab]);

  const enquiryStats = useMemo(() => {
    if (!Array.isArray(enquiries)) return { chatbot: 0, email: 0, calls: 0, website: 0 };
    const chatbot = enquiries.filter(e => e.enquiryType === 'chatbot').length;
    const email = enquiries.filter(e => e.enquiryType === 'email').length;
    const calls = enquiries.filter(e => e.enquiryType === 'calls').length;
    const website = enquiries.filter(e => e.enquiryType === 'website').length;
    
    return { chatbot, email, calls, website };
  }, [enquiries]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEnquiryTypeColor = (type: string) => {
    switch (type) {
      case 'chatbot': return 'bg-blue-100 text-blue-800';
      case 'email': return 'bg-green-100 text-green-800';
      case 'calls': return 'bg-purple-100 text-purple-800';
      case 'website': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar userRole="admin" userName={user?.name} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader userRole="admin" userName={user?.name} />
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="text-black">Loading enquiries...</div>
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
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Enquiries Management</h1>
                <p className="text-gray-600">Add and manage enquiries from multiple channels</p>
                {dataSource === 'visitors' && (
                  <div className="mt-3 text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg">
                    Showing visitor records because no direct enquiries were found. These are mapped to the enquiries view.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg mr-4 group-hover:bg-blue-200 transition-colors">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Add Enquiry</h3>
                    <p className="text-sm text-gray-600">Manually add new enquiries</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                >
                  {showAddForm ? 'Cancel' : 'Add Enquiry'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg mr-4 group-hover:bg-green-200 transition-colors">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{Array.isArray(enquiries) ? enquiries.length : 0} Enquiries</h3>
                    <p className="text-sm text-gray-600">From all sources</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-600">{Array.isArray(enquiries) ? enquiries.length : 0}</div>
              </div>
            </div>
          </div>

          {/* Add Enquiry Form */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-medium text-black mb-4">Add New Enquiry</h3>
              
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}
              
              <form
                id="addEnquiryForm"
                onSubmit={handleFormSubmit}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1" style={{color: 'black'}}>Visitor Name *</label>
                    <input
                      type="text"
                      name="visitorName"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1" style={{color: 'black'}}>Phone Number *</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1" style={{color: 'black'}}>Email *</label>
                    <input
                      type="email"
                      name="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1" style={{color: 'black'}}>Enquiry Type *</label>
                    <select
                      name="enquiryType"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    >
                      <option value="">Select type</option>
                      <option value="chatbot">Chatbot</option>
                      <option value="email">Email</option>
                      <option value="calls">Calls</option>
                      <option value="website">Website</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-black mb-1" style={{color: 'black'}}>Enquiry Details *</label>
                  <textarea
                    name="enquiryDetails"
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Describe the enquiry details..."
                  ></textarea>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-600">
                    <span className="text-red-500">*</span> At least one contact method (phone or email) is required
                  </p>
                </div>
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-6 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isSubmitting 
                        ? 'bg-blue-500 hover:bg-blue-600' 
                        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding Enquiry...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    Add Enquiry
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Enquiry Type Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'all'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-black hover:text-black hover:border-gray-300'
                  }`}
                >
                  All ({Array.isArray(enquiries) ? enquiries.length : 0})
                </button>
                <button
                  onClick={() => setActiveTab('chatbot')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'chatbot'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-black hover:text-black hover:border-gray-300'
                  }`}
                >
                  Chatbot ({enquiryStats.chatbot})
                </button>
                <button
                  onClick={() => setActiveTab('email')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'email'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-black hover:text-black hover:border-gray-300'
                  }`}
                >
                  Email ({enquiryStats.email})
                </button>
                <button
                  onClick={() => setActiveTab('calls')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'calls'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-black hover:text-black hover:border-gray-300'
                  }`}
                >
                  Calls ({enquiryStats.calls})
                </button>
                <button
                  onClick={() => setActiveTab('website')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'website'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-black hover:text-black hover:border-gray-300'
                  }`}
                >
                  Website ({enquiryStats.website})
                </button>
              </nav>
            </div>

            {/* Enquiries Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visitor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEnquiries.map((enquiry) => (
                    <tr key={enquiry._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{enquiry.visitorName}</div>
                          <div className="text-sm text-gray-500">{enquiry.email}</div>
                          {enquiry.phoneNumber && (
                            <div className="text-sm text-gray-500">{enquiry.phoneNumber}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getEnquiryTypeColor(enquiry.enquiryType)}`}>
                          {enquiry.enquiryType.charAt(0).toUpperCase() + enquiry.enquiryType.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {enquiry.enquiryDetails}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(enquiry.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditingEnquiry(enquiry);
                            setShowEditForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteEnquiry(enquiry._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredEnquiries.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">No enquiries found</div>
          </div>
        )}
      </div>
      </div>

      {/* Edit Enquiry Modal */}
      {showEditForm && editingEnquiry && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Enquiry</h3>
              
              <form onSubmit={handleEditFormSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Visitor Name</label>
                    <input
                      type="text"
                      name="visitorName"
                      defaultValue={editingEnquiry.visitorName}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      defaultValue={editingEnquiry.phoneNumber}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={editingEnquiry.email}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Enquiry Type</label>
                    <select
                      name="enquiryType"
                      defaultValue={editingEnquiry.enquiryType}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    >
                      <option value="chatbot">Chatbot</option>
                      <option value="email">Email</option>
                      <option value="calls">Calls</option>
                      <option value="website">Website</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-black mb-1">Enquiry Details</label>
                  <textarea
                    name="enquiryDetails"
                    defaultValue={editingEnquiry.enquiryDetails}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingEnquiry(null);
                    }}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-6 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isSubmitting 
                        ? 'bg-blue-500 hover:bg-blue-600' 
                        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    Update
                      </span>
                    )}
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

