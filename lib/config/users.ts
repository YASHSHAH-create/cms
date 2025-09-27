// Dynamic user configuration based on environment
export interface UserConfig {
  username: string;
  email: string;
  name: string;
  role: string;
  password: string;
  department: string;
  region: string;
}

export const getUserConfig = (): UserConfig[] => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isDevelopment) {
    return [
      {
        username: 'admin',
        email: 'admin@envirocarelabs.com',
        name: 'Administrator',
        role: 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        department: 'Administration',
        region: 'All Regions'
      },
      {
        username: 'demo',
        email: 'demo@envirocarelabs.com',
        name: 'Demo User',
        role: 'customer-executive',
        password: process.env.DEMO_PASSWORD || 'demo123',
        department: 'Customer Service',
        region: 'North'
      }
    ];
  }
  
  if (isProduction) {
    return [
      {
        username: process.env.ADMIN_USERNAME || 'admin',
        email: process.env.ADMIN_EMAIL || 'admin@envirocarelabs.com',
        name: process.env.ADMIN_NAME || 'Administrator',
        role: 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        department: 'Administration',
        region: 'All Regions'
      }
    ];
  }
  
  // Default fallback
  return [
    {
      username: 'admin',
      email: 'admin@envirocarelabs.com',
      name: 'Administrator',
      role: 'admin',
      password: 'admin123',
      department: 'Administration',
      region: 'All Regions'
    }
  ];
};

export const getFallbackUsers = (): UserConfig[] => {
  return getUserConfig();
};
