import React from 'react';
import { User, getRolePermissions } from '@/lib/utils/roleBasedAccess';
import StatBox from './StatBox';

interface RoleBasedStatBoxProps {
  user: User;
  data: {
    totalVisitors: number;
    totalEnquiries: number;
    totalMessages: number;
    leadsConverted: number;
    pendingApprovals?: number;
    activeAgents?: number;
  };
}

export default function RoleBasedStatBox({ user, data }: RoleBasedStatBoxProps) {
  const permissions = getRolePermissions(user);

  // Admin sees full system overview
  if (user.role === 'admin') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-2 sm:mb-3">
        <StatBox
          title="Total Visitors"
          value={data.totalVisitors}
          icon="👥"
          color="blue"
          change={{ value: 12, isPositive: true }}
        />
        <StatBox
          title="Leads Converted"
          value={data.leadsConverted}
          icon="🎯"
          color="green"
          change={{ value: 8, isPositive: true }}
        />
        <StatBox
          title="Total Enquiries"
          value={data.totalEnquiries}
          icon="📝"
          color="orange"
          change={{ value: 15, isPositive: true }}
        />
        <StatBox
          title="Active Agents"
          value={data.activeAgents || 0}
          icon="👨‍💼"
          color="purple"
          change={{ value: 2, isPositive: true }}
        />
      </div>
    );
  }

  // Sales Executive sees sales-focused metrics
  if (user.role === 'sales-executive') {
    const conversionRate = data.totalVisitors > 0 ? Math.round((data.leadsConverted / data.totalVisitors) * 100) : 0;
    const myVisitors = Math.round(data.totalVisitors * 0.3); // Estimated assigned visitors
    const myLeads = Math.round(data.leadsConverted * 0.4); // Estimated converted leads
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-2 sm:mb-3">
        <StatBox
          title="My Assigned Visitors"
          value={myVisitors}
          icon="👥"
          color="blue"
          change={{ value: 5, isPositive: true }}
        />
        <StatBox
          title="My Converted Leads"
          value={myLeads}
          icon="🎯"
          color="green"
          change={{ value: 12, isPositive: true }}
        />
        <StatBox
          title="Conversion Rate"
          value={`${conversionRate}%`}
          icon="📈"
          color="orange"
          change={{ value: 3, isPositive: true }}
        />
        <StatBox
          title="Active Enquiries"
          value={Math.round(data.totalEnquiries * 0.25)}
          icon="📝"
          color="purple"
          change={{ value: 2, isPositive: true }}
        />
      </div>
    );
  }

  // Customer Executive sees customer service metrics
  if (user.role === 'customer-executive') {
    const myVisitors = Math.round(data.totalVisitors * 0.4); // Estimated assigned visitors
    const resolvedEnquiries = Math.round(data.totalEnquiries * 0.6);
    const responseTime = "2.3h"; // Average response time
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-2 sm:mb-3">
        <StatBox
          title="My Customers"
          value={myVisitors}
          icon="👥"
          color="blue"
          change={{ value: 8, isPositive: true }}
        />
        <StatBox
          title="Resolved Enquiries"
          value={resolvedEnquiries}
          icon="✅"
          color="green"
          change={{ value: 15, isPositive: true }}
        />
        <StatBox
          title="Avg Response Time"
          value={responseTime}
          icon="⏱️"
          color="orange"
          change={{ value: 10, isPositive: false }}
        />
        <StatBox
          title="Pending Follow-ups"
          value={Math.round(data.totalEnquiries * 0.15)}
          icon="📞"
          color="red"
          change={{ value: 2, isPositive: false }}
        />
      </div>
    );
  }

  // Default fallback for other roles
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-2 sm:mb-3">
      <StatBox
        title="My Tasks"
        value={Math.round(data.totalEnquiries * 0.1)}
        icon="📝"
        color="blue"
        change={{ value: 3, isPositive: true }}
      />
      <StatBox
        title="Completed"
        value={Math.round(data.leadsConverted * 0.2)}
        icon="✅"
        color="green"
        change={{ value: 5, isPositive: true }}
      />
      <StatBox
        title="In Progress"
        value={Math.round(data.totalMessages * 0.1)}
        icon="⏳"
        color="orange"
        change={{ value: 1, isPositive: true }}
      />
      <StatBox
        title="Pending"
        value={Math.round(data.totalVisitors * 0.05)}
        icon="⏸️"
        color="red"
        change={{ value: 0, isPositive: true }}
      />
    </div>
  );
}
