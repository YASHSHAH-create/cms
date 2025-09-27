
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
  service?: string;
  subservice?: string;
  organization?: string;
  region?: string;
  salesExecutive?: string;
  comments?: string;
  amount?: number;
};

type EnquiryFormData = {
  visitorName: string;
  phoneNumber: string;
  email: string;
  enquiryType: 'chatbot' | 'email' | 'calls' | 'website';
  enquiryDetails: string;
};

export default function ExecutiveEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'chatbot' | 'email' | 'calls' | 'website'>('all');

  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('ems_token') : null), []);
  
  // API base URL - always use current domain
  const API_BASE = (() => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
  })();

  const loadEnquiries = async () => {
    if (!token) {
      setError('No authentication token found. Please login again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await fetch(`${API_BASE}/api/analytics/customer-executive-enquiries-management`, { headers });

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
      const enquiriesList = responseData.enquiries || [];
       
       // Map the API response to the frontend Enquiry type
       const mappedEnquiries: Enquiry[] = enquiriesList.map((enquiry: any) => ({
         _id: enquiry._id,
         visitorName: enquiry.name || 'Unknown',
         phoneNumber: enquiry.phone || '',
         email: enquiry.email || '',
         enquiryType: (['chatbot','email','calls','website'].includes(enquiry.source) ? enquiry.source : 'chatbot') as Enquiry['enquiryType'],
         enquiryDetails: enquiry.enquiryDetails || 'General enquiry',
         createdAt: enquiry.createdAt,
         status: enquiry.status || 'new',
         assignedAgent: enquiry.agentName || enquiry.agent || 'Unassigned',
         service: enquiry.service || 'General Inquiry',
         subservice: enquiry.subservice || '',
         organization: enquiry.organization || '',
         region: enquiry.region || '',
         salesExecutive: enquiry.salesExecutiveName || enquiry.salesExecutive || '',
         comments: enquiry.comments || '',
         amount: enquiry.amount || 0
       }));
       
       setEnquiries(mappedEnquiries);

      // Fallback: if no enquiries, try to load visitors as enquiries
      if (!enquiriesList || enquiriesList.length === 0) {
        try {
           const visitorsRes = await fetch(`${API_BASE}/api/analytics/visitors-management`, { headers });
          if (visitorsRes.ok) {
            const visitorsData = await visitorsRes.json();
            const visitors = visitorsData.visitors || [];
            const mapped: Enquiry[] = visitors.map((v: any) => ({
              _id: v._id,
              visitorName: v.name || 'Unknown',
              phoneNumber: v.phone || '',
              email: v.email || '',
              enquiryType: (['chatbot','email','calls','website'].includes(v.source) ? v.source : 'chatbot') as Enquiry['enquiryType'],
               enquiryDetails: v.enquiryDetails || 'General enquiry',
              createdAt: v.createdAt,
              status: v.status || 'new',
               assignedAgent: v.agentName || v.agent || 'Unassigned',
               service: v.service || 'General Inquiry',
               subservice: v.subservice || '',
               organization: v.organization || '',
               region: v.region || '',
               salesExecutive: v.salesExecutiveName || v.salesExecutive || '',
               comments: v.comments || '',
               amount: v.amount || 0
            }));
            setEnquiries(mapped);
          }
        } catch (fallbackError) {
          console.log('Fallback to visitors failed:', fallbackError);
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
    // Get user info from localStorage
    const userStr = localStorage.getItem('ems_user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    loadEnquiries();
  }, [API_BASE, token]);

  const addEnquiry = async (formData: EnquiryFormData) => {
    if (!token) {
      console.error('No authentication token found');
      setError('No authentication token found. Please login again.');
      window.location.href = '/login';
      return;
    }

    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const response = await fetch(`${API_BASE}/api/analytics/add-enquiry`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newEnquiry = await response.json();
        setEnquiries(prev => [newEnquiry, ...prev]);
        setShowAddForm(false);
        // Reset form
        const form = document.getElementById('addEnquiryForm') as HTMLFormElement;
        if (form) form.reset();
      }
    } catch (e) {
      console.error('Error adding enquiry:', e);
    }
  };

  const updateEnquiry = async (enquiryId: string, formData: Partial<Enquiry>) => {
    if (!token) return;

    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const response = await fetch(`${API_BASE}/api/analytics/update-enquiry`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ enquiryId, ...formData })
      });

      if (response.ok) {
        const updatedEnquiry = await response.json();
        setEnquiries(prev => prev.map(e => 
          e._id === enquiryId ? updatedEnquiry : e
        ));
        setShowEditForm(false);
        setEditingEnquiry(null);
      }
    } catch (e) {
      console.error('Error updating enquiry:', e);
    }
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'escalated':
        return 'bg-red-100 text-red-800';
      case 'enquiry_required':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar userRole="executive" userName={user?.name} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader userRole="executive" userName={user?.name} />
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="text-gray-600">Loading enquiries...</div>
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
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userRole="executive" userName={user?.name} />
        
        <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Enquiries</h1>
                <p className="text-gray-600">Add and manage enquiries from multiple channels</p>
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
              
              <form
                id="addEnquiryForm"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  
                  // Get form values
                  const phoneNumber = formData.get('phoneNumber') as string;
                  const email = formData.get('email') as string;
                  
                  // Validate that either phone or email is provided
                  if (!phoneNumber?.trim() && !email?.trim()) {
                    alert('Please provide either a phone number or email address');
                    return;
                  }
                  
                  addEnquiry({
                    visitorName: formData.get('visitorName') as string,
                    phoneNumber: phoneNumber,
                    email: email,
                    enquiryType: formData.get('enquiryType') as 'chatbot' | 'email' | 'calls' | 'website',
                    enquiryDetails: formData.get('enquiryDetails') as string
                  });
                }}
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
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-sm font-medium text-black bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Add Enquiry
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
                      : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
                  }`}
                >
                  All ({Array.isArray(enquiries) ? enquiries.length : 0})
                </button>
                <button
                  onClick={() => setActiveTab('chatbot')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'chatbot'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
                  }`}
                >
                  Chatbot ({enquiryStats.chatbot})
                </button>
                <button
                  onClick={() => setActiveTab('email')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'email'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
                  }`}
                >
                  Email ({enquiryStats.email})
                </button>
                <button
                  onClick={() => setActiveTab('calls')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'calls'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
                  }`}
                >
                  Calls ({enquiryStats.calls})
                </button>
                <button
                  onClick={() => setActiveTab('website')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'website'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
                  }`}
                >
                  Website ({enquiryStats.website})
                </button>
              </nav>
            </div>

            {/* Enquiries Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sr.no.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name of Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enquiry Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enquiry Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                   {filteredEnquiries.map((enquiry, index) => (
                     <tr key={`enquiry-${enquiry._id || index}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{enquiry.visitorName || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{enquiry.email || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{enquiry.phoneNumber || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          <div className="font-medium">{enquiry.service || 'General Inquiry'}</div>
                          <div className="text-gray-600 truncate">{enquiry.enquiryDetails || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEnquiryTypeColor(enquiry.enquiryType || 'chatbot')}`}>
                          {(enquiry.enquiryType || 'chatbot').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {enquiry.service || 'General Inquiry'}
                        </span>
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
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateEnquiry(editingEnquiry._id, {
                  visitorName: formData.get('visitorName') as string,
                  phoneNumber: formData.get('phoneNumber') as string,
                  email: formData.get('email') as string,
                  enquiryType: formData.get('enquiryType') as 'chatbot' | 'email' | 'calls' | 'website',
                  enquiryDetails: formData.get('enquiryDetails') as string
                });
              }}>
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

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingEnquiry(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-black bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Update
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
