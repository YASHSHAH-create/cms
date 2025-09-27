// Role-based access control utilities

export interface User {
  id: string;
  name: string;
  role: string;
  email?: string;
  department?: string;
  region?: string;
}

export interface RolePermissions {
  canViewAllVisitors: boolean;
  canViewAllEnquiries: boolean;
  canEditAllUsers: boolean;
  canApproveUsers: boolean;
  canAccessAnalytics: boolean;
  canManageAgents: boolean;
  canViewOwnDataOnly: boolean;
  dataFilter: any; // MongoDB filter object
}

export function getRolePermissions(user: User): RolePermissions {
  switch (user.role) {
    case 'admin':
      return {
        canViewAllVisitors: true,
        canViewAllEnquiries: true,
        canEditAllUsers: true,
        canApproveUsers: true,
        canAccessAnalytics: true,
        canManageAgents: true,
        canViewOwnDataOnly: false,
        dataFilter: {} // No filter - can see all data
      };
    
    case 'sales-executive':
      return {
        canViewAllVisitors: false,
        canViewAllEnquiries: false,
        canEditAllUsers: false,
        canApproveUsers: false,
        canAccessAnalytics: true,
        canManageAgents: false,
        canViewOwnDataOnly: true,
        dataFilter: {
          $or: [
            { assignedAgent: user.id },
            { salesExecutive: user.id },
            { agentName: user.name },
            { salesExecutiveName: user.name }
          ]
        }
      };
    
    case 'customer-executive':
      return {
        canViewAllVisitors: false,
        canViewAllEnquiries: false,
        canEditAllUsers: false,
        canApproveUsers: false,
        canAccessAnalytics: true,
        canManageAgents: false,
        canViewOwnDataOnly: true,
        dataFilter: {
          $or: [
            { assignedAgent: user.id },
            { agentName: user.name },
            { region: user.region },
            { service: { $in: getExecutiveServices(user) } }
          ]
        }
      };
    
    default:
      return {
        canViewAllVisitors: false,
        canViewAllEnquiries: false,
        canEditAllUsers: false,
        canApproveUsers: false,
        canAccessAnalytics: false,
        canManageAgents: false,
        canViewOwnDataOnly: true,
        dataFilter: { assignedAgent: user.id }
      };
  }
}

// Get services that an executive is responsible for
function getExecutiveServices(user: User): string[] {
  // This could be fetched from database, for now return common services
  if (user.role === 'customer-executive') {
    return [
      'Environmental Consulting',
      'Waste Management',
      'Water Quality Testing',
      'Air Quality Monitoring'
    ];
  }
  if (user.role === 'sales-executive') {
    return [
      'Laboratory Services',
      'Environmental Impact Assessment',
      'Compliance Auditing',
      'Training Programs'
    ];
  }
  return [];
}

export function getDashboardTitle(user: User): string {
  switch (user.role) {
    case 'admin':
      return 'Admin Dashboard';
    case 'sales-executive':
      return 'Sales Executive Dashboard';
    case 'customer-executive':
      return 'Customer Executive Dashboard';
    default:
      return 'Executive Dashboard';
  }
}

export function getDashboardDescription(user: User): string {
  switch (user.role) {
    case 'admin':
      return `Welcome back, ${user.name}! Here's your system overview.`;
    case 'sales-executive':
      return `Welcome back, ${user.name}! Here's your sales performance overview.`;
    case 'customer-executive':
      return `Welcome back, ${user.name}! Here's your customer service overview.`;
    default:
      return `Welcome back, ${user.name}! Here's your performance overview.`;
  }
}

export function getAvailableMenuItems(user: User): string[] {
  const baseItems = ['overview', 'profile'];
  
  switch (user.role) {
    case 'admin':
      return [...baseItems, 'visitors', 'enquiries', 'chats', 'agents', 'analytics', 'settings'];
    case 'sales-executive':
      return [...baseItems, 'visitors', 'enquiries', 'chats', 'analytics'];
    case 'customer-executive':
      return [...baseItems, 'visitors', 'enquiries', 'chats', 'analytics'];
    default:
      return baseItems;
  }
}
