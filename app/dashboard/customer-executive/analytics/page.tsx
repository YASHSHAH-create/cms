'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { Line, Doughnut, Pie, Radar, PolarArea } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Sample data generation functions for when database is not available
function generateSampleVisitors() {
  const now = new Date();
  const sampleVisitors = [];
  
  // Generate visitors with realistic weekly patterns
  // Week 1 (4 weeks ago): 8-12 visitors
  // Week 2 (3 weeks ago): 12-18 visitors  
  // Week 3 (2 weeks ago): 15-22 visitors (peak)
  // Week 4 (1 week ago): 10-16 visitors
  
  const weeklyTargets = [10, 15, 18, 13]; // Target visitors per week
  
  for (let week = 0; week < 4; week++) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + (week * 7)));
    weekStart.setHours(0, 0, 0, 0);
    
    const targetVisitors = weeklyTargets[week];
    const variation = Math.floor(Math.random() * 6) - 3; // -3 to +3 variation
    const actualVisitors = Math.max(1, targetVisitors + variation);
    
    for (let i = 0; i < actualVisitors; i++) {
      // Random day within the week
      const dayOffset = Math.floor(Math.random() * 7);
      const hourOffset = Math.floor(Math.random() * 24);
      const minuteOffset = Math.floor(Math.random() * 60);
      
      const createdAt = new Date(weekStart);
      createdAt.setDate(createdAt.getDate() + dayOffset);
      createdAt.setHours(hourOffset, minuteOffset, 0, 0);
      
      const visitorIndex: number = sampleVisitors.length;
      
      sampleVisitors.push({
        _id: `sample_${visitorIndex}`,
        name: `Sample Visitor ${visitorIndex + 1}`,
        email: `visitor${visitorIndex + 1}@example.com`,
        phone: `+91 98765 ${String(visitorIndex).padStart(5, '0')}`,
        organization: `Company ${visitorIndex + 1}`,
        region: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'][Math.floor(Math.random() * 5)],
        service: ['Water Testing', 'Food Testing', 'Environmental Testing', 'Soil Testing'][Math.floor(Math.random() * 4)],
        subservice: 'General Analysis',
        enquiryDetails: `Sample enquiry details for visitor ${visitorIndex + 1}`,
        source: ['chatbot', 'email', 'calls'][Math.floor(Math.random() * 3)],
        status: ['enquiry_required', 'converted', 'in_progress'][Math.floor(Math.random() * 3)],
        isConverted: Math.random() > 0.4, // 60% conversion rate
        createdAt: createdAt.toISOString(),
        lastInteractionAt: createdAt.toISOString(),
        agent: `Agent ${Math.floor(Math.random() * 3) + 1}`,
        agentName: `Agent ${Math.floor(Math.random() * 3) + 1}`,
        comments: `Sample comments for visitor ${visitorIndex + 1}`,
        amount: Math.floor(Math.random() * 20000) + 5000
      });
    }
  }
  
  console.log(`Generated ${sampleVisitors.length} sample visitors with realistic weekly distribution`);
  return sampleVisitors;
}

function generateSampleEnquiries() {
  const now = new Date();
  const sampleEnquiries = [];
  
  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    sampleEnquiries.push({
      _id: `enquiry_${i}`,
      service: ['Water Testing', 'Food Testing', 'Environmental Testing', 'Soil Testing'][Math.floor(Math.random() * 4)],
      status: ['pending', 'in_progress', 'completed'][Math.floor(Math.random() * 3)],
      createdAt: createdAt.toISOString(),
      enquiryDetails: `Sample enquiry ${i + 1} details`,
      customerName: `Customer ${i + 1}`,
      customerEmail: `customer${i + 1}@example.com`
    });
  }
  
  return sampleEnquiries;
}

export default function ExecutiveAnalyticsPage() {
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [timeRange, setTimeRange] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<{
    visitors: { createdAt: string; service?: string; status?: string; name?: string; email?: string; source?: string; isConverted?: boolean; lastInteractionAt?: string }[];
    enquiries: { createdAt: string; service?: string; status?: string }[];
    visitorsBreakdown: { [key: string]: number };
    visitAnalysis: { labels: string[]; datasets: { label: string; data: number[]; borderColor: string; backgroundColor: string; fill: boolean; tension: number }[] };
    leadConversion: { chatbot: { visitors: number; converted: number; rate: number }; email: { visitors: number; converted: number; rate: number }; calls: { visitors: number; converted: number; rate: number } };
    conversationsOverview: { total: number; daily: number; weekly: number; monthly: number };
    agentPerformance: { agentName: string; visitorsHandled: number; leadsConverted: number; efficiency: number; enquiriesAdded: number }[];
    servicesBreakdown: { [key: string]: number };
    services: { service: string; count: number; percentage: number }[];
    recentActivity: { visitor: string; service: string; date: string; status: string }[];
    sourceDistribution: { labels: string[]; datasets: { data: number[]; backgroundColor: string[]; borderColor: string[]; borderWidth: number }[] };
    statusDistribution: { labels: string[]; datasets: { data: number[]; backgroundColor: string[]; borderColor: string[]; borderWidth: number }[] };
    performanceMetrics: { responseTime: number; conversionRate: number; customerSatisfaction: number; taskCompletion: number; communication: number; problemSolving: number };
    conversionRate: { labels: string[]; datasets: { label: string; data: number[]; borderColor: string; backgroundColor: string; pointBackgroundColor: string; pointBorderColor: string; pointBorderWidth: number; pointRadius: number; pointHoverRadius: number }[] };
    personalPerformance: { visitorsHandled: number; enquiriesAdded: number; leadsConverted: number; efficiency: number; totalConversations: number };
  } | null>(null);

  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('ems_token') : null), []);
  // API base URL - always use current domain
  const API_BASE = (() => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
  })();

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

    const loadAnalyticsData = async () => {
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Only fetch from working endpoints
        const [
          visitorsRes, 
          enquiriesRes, 
          visitorsBreakdownRes, 
          visitAnalysisRes, 
          leadConversionRes, 
          conversationsOverviewRes, 
          agentPerformanceRes, 
          servicesBreakdownRes
        ] = await Promise.all([
          fetch(`${API_BASE}/api/analytics/visitors-management?limit=100`, { headers }),
          fetch(`${API_BASE}/api/analytics/enquiries-management?limit=100`, { headers }),
          fetch(`${API_BASE}/api/analytics/visitors-breakdown`, { headers }),
          fetch(`${API_BASE}/api/analytics/visit-analysis`, { headers }),
          fetch(`${API_BASE}/api/analytics/lead-conversion`, { headers }),
          fetch(`${API_BASE}/api/analytics/conversations-overview`, { headers }),
          fetch(`${API_BASE}/api/analytics/agent-performance`, { headers }),
          fetch(`${API_BASE}/api/analytics/services-breakdown`, { headers })
        ]);

        if (visitorsRes.status === 401) {
          setError('Authentication failed. Please login again.');
          localStorage.removeItem('ems_token');
          localStorage.removeItem('ems_user');
          window.location.href = '/auth/login';
          return;
        }

        // Handle responses with fallbacks
        const visitorsData = visitorsRes.ok ? await visitorsRes.json() : { visitors: [] };
        const enquiriesData = enquiriesRes.ok ? await enquiriesRes.json() : { enquiries: [] };
        const visitorsBreakdownData = visitorsBreakdownRes.ok ? await visitorsBreakdownRes.json() : {};
        const visitAnalysisData = visitAnalysisRes.ok ? await visitAnalysisRes.json() : { labels: [], datasets: [] };
        const leadConversionData = leadConversionRes.ok ? await leadConversionRes.json() : { chatbot: { visitors: 0, converted: 0, rate: 0 }, email: { visitors: 0, converted: 0, rate: 0 }, calls: { visitors: 0, converted: 0, rate: 0 } };
        const conversationsOverviewData = conversationsOverviewRes.ok ? await conversationsOverviewRes.json() : { total: 0, daily: 0, weekly: 0, monthly: 0 };
        const agentPerformanceData = agentPerformanceRes.ok ? await agentPerformanceRes.json() : [];
        const servicesBreakdownData = servicesBreakdownRes.ok ? await servicesBreakdownRes.json() : {};

        // Check if we have database connection and data
        const hasDatabaseConnection = visitorsRes.ok && enquiriesRes.ok && (visitorsData.visitors?.length > 0 || enquiriesData.enquiries?.length > 0);
        
        let visitors = visitorsData.visitors || [];
        let enquiries = enquiriesData.enquiries || [];
        
        if (!hasDatabaseConnection || visitors.length === 0) {
          console.log('No database connection or empty data, generating sample data...');
          setError('Showing sample data for demonstration purposes.');
          
          visitors = generateSampleVisitors();
          enquiries = generateSampleEnquiries();
          console.log(`Generated ${visitors.length} sample visitors and ${enquiries.length} sample enquiries`);
        }

        // Create time-based trends based on selected range
        let timeLabels: string[] = [];
        let timeData: number[] = [];
        let filteredVisitors = visitors;

        if (timeRange === 'daily') {
          // Show last 7 days with proper date handling
          timeLabels = [];
          timeData = [];
          for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            // Use a more explicit date format that Chart.js can handle
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNumber = date.getDate();
            const label = `${dayName} ${dayNumber}`;
            timeLabels.push(label);
            
            // Count visitors for this day
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            
            const dayVisitors = visitors.filter((visitor: { createdAt: string }) => {
              const visitorDate = new Date(visitor.createdAt);
              return visitorDate >= dayStart && visitorDate <= dayEnd;
            }).length;
            
            timeData.push(dayVisitors);
          }
          
          // Filter visitors to last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          filteredVisitors = visitors.filter((visitor: { createdAt: string }) => 
            visitor.createdAt && new Date(visitor.createdAt) >= sevenDaysAgo
          );
        } else if (timeRange === 'weekly') {
          // Show last 4 weeks with proper week ranges
          timeLabels = [];
          timeData = [];
          for (let i = 3; i >= 0; i--) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + (i * 7)));
            weekStart.setHours(0, 0, 0, 0);
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            
            // Format week label with proper date ranges
            const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
            const startDay = weekStart.getDate();
            const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
            const endDay = weekEnd.getDate();
            
            // Create shorter week labels
            const weekLabel = weekStart.getMonth() === weekEnd.getMonth() 
              ? `${startDay}-${endDay} ${startMonth}`
              : `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
            
            timeLabels.push(weekLabel);
            
            // Count visitors for this week
            const weekVisitors = visitors.filter((visitor: { createdAt: string }) => {
              const visitorDate = new Date(visitor.createdAt);
              return visitorDate >= weekStart && visitorDate <= weekEnd;
            }).length;
            
            timeData.push(weekVisitors);
          }
          
          // Filter visitors to last 4 weeks
          const fourWeeksAgo = new Date();
          fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
          filteredVisitors = visitors.filter((visitor: { createdAt: string }) => 
            visitor.createdAt && new Date(visitor.createdAt) >= fourWeeksAgo
          );
        } else if (timeRange === 'monthly') {
          // Show last 6 months with proper month/year format
          timeLabels = [];
          timeData = [];
          for (let i = 5; i >= 0; i--) {
            const monthStart = new Date();
            monthStart.setMonth(monthStart.getMonth() - i);
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);
            
            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            monthEnd.setDate(0);
            monthEnd.setHours(23, 59, 59, 999);
            
            // Format month label with year for clarity
            const monthName = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            timeLabels.push(monthName);
            
            // Count visitors for this month
            const monthVisitors = visitors.filter((visitor: { createdAt: string }) => {
              const visitorDate = new Date(visitor.createdAt);
              return visitorDate >= monthStart && visitorDate <= monthEnd;
            }).length;
            
            timeData.push(monthVisitors);
          }
          
          // Filter visitors to last 6 months
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          filteredVisitors = visitors.filter((visitor: { createdAt: string }) => 
            visitor.createdAt && new Date(visitor.createdAt) >= sixMonthsAgo
          );
        }

        // Calculate real metrics from filtered data based on time range
        console.log(`Before filtering: ${visitors.length} visitors, after filtering: ${filteredVisitors.length} visitors`);
        console.log(`Time range: ${timeRange}`);
        
        // Calculate metrics from filtered data
        const visitorsHandled = filteredVisitors.length;
        const enquiriesAdded = enquiries.length;
        const convertedVisitors = filteredVisitors.filter((visitor: any) => visitor.isConverted);
        const leadsConverted = convertedVisitors.length;
        const efficiency = visitorsHandled > 0 ? Math.round((leadsConverted / visitorsHandled) * 100) : 0;
        const totalConversations = visitorsHandled;
        
        console.log(`Metrics calculation: visitorsHandled=${visitorsHandled}, leadsConverted=${leadsConverted}, efficiency=${efficiency}%`);

        // Group filtered visitors by major services only

        const serviceCounts: { [key: string]: number } = {};
        filteredVisitors.forEach((visitor: { service?: string }) => {
          const service = visitor.service || 'General Inquiry';
          // Map to major service category
          let majorService = 'Others';
          if (service.toLowerCase().includes('water')) {
            majorService = 'Water Testing';
          } else if (service.toLowerCase().includes('food')) {
            majorService = 'Food Testing';
          } else if (service.toLowerCase().includes('environmental') || service.toLowerCase().includes('air') || service.toLowerCase().includes('soil')) {
            majorService = 'Environmental Testing';
          } else if (service.toLowerCase().includes('shelf') || service.toLowerCase().includes('life')) {
            majorService = 'Shelf-Life Study';
          } else if (service.toLowerCase().includes('drinking')) {
            majorService = 'Drinking Water Testing';
          } else if (service.toLowerCase().includes('initial') || service.toLowerCase().includes('contact') || service.toLowerCase().includes('general')) {
            majorService = 'Others';
          }
          
          serviceCounts[majorService] = (serviceCounts[majorService] || 0) + 1;
        });

        const services = Object.entries(serviceCounts)
          .filter(([, count]) => count > 0) // Only show services with data
          .map(([service, count]) => ({
          service,
          count,
          percentage: Math.round((count / visitorsHandled) * 100)
          }))
          .sort((a, b) => b.count - a.count);

        // Get recent activity from filtered visitors
        const recentActivity = filteredVisitors.slice(0, 4).map((visitor: { name?: string; email?: string; service?: string; createdAt: string; status?: string }) => ({
          visitor: visitor.name || visitor.email || 'Anonymous',
          service: visitor.service || 'General Inquiry',
          date: new Date(visitor.createdAt).toLocaleDateString(),
          status: visitor.status || 'New'
        }));

        // Create source distribution data from filtered visitors
        const sourceCounts: { [key: string]: number } = {};
        filteredVisitors.forEach((visitor: { source?: string }) => {
          const source = visitor.source || 'chatbot';
          sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });

        // Create status distribution data from filtered visitors
        const statusCounts: { [key: string]: number } = {};
        filteredVisitors.forEach((visitor: { status?: string }) => {
          const status = visitor.status || 'new';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        // Create conversion rate data based on time range
        let conversionLabels: string[] = [];
        let conversionData: number[] = [];
        
        if (timeRange === 'daily') {
          // Show conversion rate by day using actual data
          conversionLabels = timeLabels;
          conversionData = [];
          for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            
            const dayVisitors = visitors.filter((visitor: { createdAt: string }) => {
              const visitorDate = new Date(visitor.createdAt);
              return visitorDate >= dayStart && visitorDate <= dayEnd;
            });
            
            const dayConversions = dayVisitors.filter((visitor: { isConverted?: boolean }) => visitor.isConverted).length;
            const conversionRate = dayVisitors.length > 0 ? Math.round((dayConversions / dayVisitors.length) * 100) : 0;
            conversionData.push(conversionRate);
          }
        } else if (timeRange === 'weekly') {
          // Show conversion rate by week using actual data
          conversionLabels = timeLabels;
          conversionData = [];
          for (let i = 3; i >= 0; i--) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + (i * 7)));
            weekStart.setHours(0, 0, 0, 0);
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            
            const weekVisitors = visitors.filter((visitor: { createdAt: string }) => {
              const visitorDate = new Date(visitor.createdAt);
              return visitorDate >= weekStart && visitorDate <= weekEnd;
            });
            
            const weekConversions = weekVisitors.filter((visitor: { isConverted?: boolean }) => visitor.isConverted).length;
            const conversionRate = weekVisitors.length > 0 ? Math.round((weekConversions / weekVisitors.length) * 100) : 0;
            conversionData.push(conversionRate);
          }
        } else if (timeRange === 'monthly') {
          // Show conversion rate by month using actual data
          conversionLabels = timeLabels;
          conversionData = [];
          for (let i = 5; i >= 0; i--) {
            const monthStart = new Date();
            monthStart.setMonth(monthStart.getMonth() - i);
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);
            
            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            monthEnd.setDate(0);
            monthEnd.setHours(23, 59, 59, 999);
            
            const monthVisitors = visitors.filter((visitor: { createdAt: string }) => {
              const visitorDate = new Date(visitor.createdAt);
              return visitorDate >= monthStart && visitorDate <= monthEnd;
            });
            
            const monthConversions = monthVisitors.filter((visitor: { isConverted?: boolean }) => visitor.isConverted).length;
            const conversionRate = monthVisitors.length > 0 ? Math.round((monthConversions / monthVisitors.length) * 100) : 0;
            conversionData.push(conversionRate);
          }
        }

        // Create performance metrics based on actual executive activity
        const totalVisitors = visitors.length;
        const totalEnquiries = enquiries.length;
        const totalConverted = visitors.filter((v: any) => v.isConverted).length;
        const avgVisitorsPerDay = totalVisitors / 7; // Last 7 days
        const avgEnquiriesPerDay = totalEnquiries / 7;
        const conversionRate = totalVisitors > 0 ? Math.round((totalConverted / totalVisitors) * 100) : 0;
        
        const performanceMetrics = {
          visitorsHandled: Math.min(Math.round((totalVisitors / 50) * 100), 100), // Scale to 100, max 50 visitors = 100%
          enquiriesProcessed: Math.min(Math.round((totalEnquiries / 30) * 100), 100), // Scale to 100, max 30 enquiries = 100%
          conversionRate: conversionRate,
          dailyActivity: Math.min(Math.round((avgVisitorsPerDay / 5) * 100), 100), // Scale to 100, max 5 visitors/day = 100%
          enquiryResponse: Math.min(Math.round((avgEnquiriesPerDay / 3) * 100), 100), // Scale to 100, max 3 enquiries/day = 100%
          leadGeneration: Math.min(Math.round((totalConverted / 10) * 100), 100) // Scale to 100, max 10 leads = 100%
        };

        const analyticsDataToSet = {
          visitors,
          enquiries,
          visitorsBreakdown: visitorsBreakdownData,
          leadConversion: leadConversionData,
          conversationsOverview: conversationsOverviewData,
          agentPerformance: agentPerformanceData,
          servicesBreakdown: servicesBreakdownData,
          personalPerformance: {
            visitorsHandled,
            enquiriesAdded,
            leadsConverted,
            efficiency,
            totalConversations
          },
          services,
          recentActivity,
          visitAnalysis: {
            labels: timeLabels,
            datasets: [{
              label: `Visitors (${timeRange})`,
              data: timeData,
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 6,
              pointHoverRadius: 8,
              pointBackgroundColor: 'rgb(59, 130, 246)',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointHoverBackgroundColor: '#ffffff',
              pointHoverBorderColor: 'rgb(59, 130, 246)',
              pointHoverBorderWidth: 3
            }]
          },
          sourceDistribution: {
            labels: Object.keys(visitorsBreakdownData),
            datasets: [{
              data: Object.values(visitorsBreakdownData).map(v => Number(v)),
              backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)'
              ],
              borderColor: [
                'rgba(59, 130, 246, 1)',
                'rgba(16, 185, 129, 1)',
                'rgba(245, 158, 11, 1)',
                'rgba(239, 68, 68, 1)'
              ],
              borderWidth: 2
            }]
          },
          statusDistribution: {
            labels: Object.keys(statusCounts),
            datasets: [{
              data: Object.values(statusCounts).map(v => Number(v)),
              backgroundColor: [
                'rgba(34, 197, 94, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)',
                'rgba(139, 92, 246, 0.8)'
              ],
              borderColor: [
                'rgba(34, 197, 94, 1)',
                'rgba(59, 130, 246, 1)',
                'rgba(245, 158, 11, 1)',
                'rgba(239, 68, 68, 1)',
                'rgba(139, 92, 246, 1)'
              ],
              borderWidth: 2
            }]
          },
          conversionRate: {
            labels: conversionLabels,
            datasets: [{
              label: `Conversion Rate (%)`,
              data: conversionData,
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              borderColor: 'rgba(34, 197, 94, 1)',
              pointBackgroundColor: 'rgba(34, 197, 94, 1)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8
            }]
          },
          performanceMetrics
        };
        
        console.log('Setting analytics data:', analyticsDataToSet);
        setAnalyticsData(analyticsDataToSet);

      } catch (e) {
        console.error('Error loading analytics data:', e);
        setError('Failed to load analytics data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [API_BASE, token, timeRange]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(59, 130, 246, 0.8)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        intersect: false,
        mode: 'index' as const,
      },
    },
    scales: {
      x: {
        type: 'category' as const,
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          font: {
            size: 10,
            weight: 'bold' as const,
          },
          color: '#6B7280',
          maxTicksLimit: 4,
          padding: 8,
        },
      },
      y: {
        beginAtZero: true,
        max: 25,
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
          drawBorder: false,
        },
        ticks: {
          stepSize: 5,
          font: {
            size: 11,
            weight: 'bold' as const,
          },
          color: '#6B7280',
        },
      },
    },
    elements: {
      point: {
        radius: 6,
        hoverRadius: 8,
        borderWidth: 3,
        hoverBorderWidth: 4,
      },
      line: {
        borderWidth: 3,
        tension: 0.4,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(59, 130, 246, 0.8)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    },
  };

  const radarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar userRole="executive" userName={user?.name} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader userRole="executive" userName={user?.name} />
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="text-gray-600">Loading your analytics...</div>
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
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar userRole="executive" userName={user?.name} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader userRole="executive" userName={user?.name} />
          <div className="flex-1 p-6">
            <div className="text-gray-600">No analytics data available</div>
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
        
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Analytics</h1>
            <p className="text-gray-600">Real-time performance data from your visitors and enquiries</p>
          </div>

          {/* Time Range Selector */}
          <div className="mb-6">
            <div className="flex space-x-2">
              {['daily', 'weekly', 'monthly'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Visitors Handled</p>
                  <p className="text-2xl font-semibold text-gray-900">{analyticsData.personalPerformance.visitorsHandled}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Enquiries Added</p>
                  <p className="text-2xl font-semibold text-gray-900">{analyticsData.personalPerformance.enquiriesAdded}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Leads Converted</p>
                  <p className="text-2xl font-semibold text-gray-900">{analyticsData.personalPerformance.leadsConverted}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Efficiency</p>
                  <p className="text-2xl font-semibold text-gray-900">{analyticsData.personalPerformance.efficiency}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Conversations</p>
                  <p className="text-2xl font-semibold text-gray-900">{analyticsData.personalPerformance.totalConversations}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Time-based Trends Line Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Visitor Trends</h3>
              <div className="h-64">
                <Line 
                  data={analyticsData.visitAnalysis} 
                  options={chartOptions} 
                />
              </div>
            </div>

            {/* Source Distribution Pie Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Visitor Source Distribution</h3>
              <div className="h-64">
                <Pie 
                  data={analyticsData.sourceDistribution} 
                  options={pieChartOptions} 
                />
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Status Distribution Doughnut Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Visitor Status Distribution</h3>
              <div className="h-64">
                <Doughnut 
                  data={analyticsData.statusDistribution} 
                  options={pieChartOptions} 
                />
              </div>
            </div>

            {/* Performance Radar Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="h-64">
                <Radar 
                  data={{
                    labels: ['Visitors Handled', 'Enquiries Processed', 'Conversion Rate', 'Daily Activity', 'Enquiry Response', 'Lead Generation'],
                    datasets: [{
                      label: 'Performance',
                      data: [
                        analyticsData.performanceMetrics.visitorsHandled,
                        analyticsData.performanceMetrics.enquiriesProcessed,
                        analyticsData.performanceMetrics.conversionRate,
                        analyticsData.performanceMetrics.dailyActivity,
                        analyticsData.performanceMetrics.enquiryResponse,
                        analyticsData.performanceMetrics.leadGeneration
                      ],
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      borderColor: 'rgba(59, 130, 246, 1)',
                      borderWidth: 2,
                      pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                      pointBorderColor: '#fff',
                      pointHoverBackgroundColor: '#fff',
                      pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
                    }]
                  }} 
                  options={radarChartOptions} 
                />
                        </div>
                      </div>
                    </div>

          {/* Charts Row 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Conversion Rate Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Conversion Rate</h3>
              <div className="h-64">
                <Line 
                  data={analyticsData.conversionRate} 
                  options={{
                    ...chartOptions,
                    scales: {
                      x: {
                        ticks: {
                          maxTicksLimit: 12,
                        },
                      },
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: function(value) {
                            return value + '%';
                          }
                        }
                      },
                    },
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `Conversion Rate: ${context.parsed.y}%`;
                          }
                        }
                      }
                    }
                  }} 
                />
              </div>
            </div>

            {/* Services Breakdown Polar Area Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Services Breakdown</h3>
              <div className="h-64">
                <PolarArea 
                  data={{
                    labels: analyticsData.services.map((s: { service: string }) => s.service),
                    datasets: [{
                      data: analyticsData.services.map((s: { count: number }) => s.count),
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(236, 72, 153, 0.8)',
                        'rgba(14, 165, 233, 0.8)'
                      ],
                      borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(139, 92, 246, 1)',
                        'rgba(236, 72, 153, 1)',
                        'rgba(14, 165, 233, 1)'
                      ],
                      borderWidth: 2
                    }]
                  }} 
                  options={pieChartOptions} 
                />
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {analyticsData.recentActivity.length > 0 ? (
                analyticsData.recentActivity.map((activity: { visitor: string; service: string; date: string; status: string }, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.visitor}</p>
                      <p className="text-xs text-gray-500">{activity.service}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{activity.date}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        activity.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        activity.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">No recent activity</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
