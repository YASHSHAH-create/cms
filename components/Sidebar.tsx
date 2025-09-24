import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  userRole: 'admin' | 'executive' | 'sales-executive' | 'customer-executive';
  userName?: string;
}

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if we're on mobile on component mount and window resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-collapse sidebar on small screens
      setIsCollapsed(window.innerWidth < 1024);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('.mobile-sidebar') && !target.closest('.mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const adminLinks = [
    { href: '/dashboard/admin/overview', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/admin/agents', label: 'Agents & Users', icon: '👥' },
    { href: '/dashboard/admin/visitors', label: 'Visitors', icon: '👤' },
    { href: '/dashboard/admin/analytics', label: 'Analytics', icon: '📈' },
    { href: '/dashboard/admin/chats', label: 'Chat History', icon: '💬' },
    { href: '/dashboard/admin/enquiries', label: 'Enquiries', icon: '📋' },
    { href: '/dashboard/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  const executiveLinks = [
    { href: '/dashboard/executive', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/executive/visitors', label: 'Visitors', icon: '👤' },
    { href: '/dashboard/executive/enquiries', label: 'Enquiries', icon: '📋' },
    { href: '/dashboard/executive/chats', label: 'Chat History', icon: '💬' },
    { href: '/dashboard/executive/analytics', label: 'Analytics', icon: '📈' },
    { href: '/dashboard/executive/profile', label: 'Profile', icon: '👤' },
  ];

  const links = userRole === 'admin' ? adminLinks : executiveLinks;

  // Mobile menu component
  const MobileMenu = () => (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-3 left-3 z-50 p-2.5 rounded-lg bg-gradient-to-r from-blue-900 to-blue-800 text-white md:hidden mobile-menu-button shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 sm:w-72 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 transform transition-transform duration-300 ease-in-out md:hidden mobile-sidebar shadow-2xl ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ maxHeight: '100vh', overflow: 'hidden' }}
      >
        <div className="flex flex-col h-full">
          {/* Mobile header */}
          <div className="flex items-center justify-between p-4 border-b border-blue-700/50">
            <div className="flex items-center">
              <span className="text-white font-semibold text-lg">
                Envirocare EMS
              </span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-white hover:scale-105"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 p-3">
            <SidebarContent />
          </div>
        </div>
      </div>
    </>
  );

  // Desktop sidebar component
  const DesktopSidebar = () => (
    <div
      className={`hidden md:flex flex-col h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 transition-all duration-300 ease-in-out shadow-2xl
                ${isCollapsed ? 'w-12' : 'w-48 lg:w-52'}`}
    >
      <div className="flex flex-col h-full">
        {/* Header with minimize button */}
        <div className={`flex items-center border-b border-blue-700/50 ${isCollapsed ? 'justify-center p-2' : 'justify-between p-3'}`}>
          {!isCollapsed ? (
            <>
              <span className="text-white font-semibold text-lg truncate">
                Envirocare EMS
              </span>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-white hover:scale-105"
                title="Collapse sidebar"
              >
                <svg 
                  className="w-4 h-4 transition-transform duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-white hover:scale-105"
              title="Expand sidebar"
            >
              <svg 
                className="w-4 h-4 transition-transform duration-200 rotate-180" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="flex-1 flex flex-col p-2">
          <SidebarContent />
        </div>
      </div>
    </div>
  );

  // Common sidebar content
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* User Welcome Section */}
      <div className={`${isCollapsed ? 'text-center mb-2' : 'mb-3'}`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center justify-center mb-2">
              <Image
                src="/envirocare-logo.png"
                alt="Envirocare Labs"
                width={isMobile ? 120 : 100}
                height={isMobile ? 30 : 25}
                className="drop-shadow-sm"
              />
            </div>
            {userName && (
              <div className="text-center">
                <p className="text-xs sm:text-sm text-blue-200 font-medium">Welcome,</p>
                <p className="text-sm sm:text-base text-white font-semibold truncate">{userName}</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex justify-center mb-2">
            <Image
              src="/envirocare-logo.png"
              alt="Envirocare Labs"
              width={32}
              height={32}
              className="drop-shadow-sm rounded-full"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <ul className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center rounded-lg transition-all duration-200 group ${
                    isCollapsed 
                      ? 'justify-center px-2 py-2' 
                      : 'px-3 py-2.5 sm:py-2'
                  } ${
                    isActive 
                      ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/20' 
                      : 'hover:bg-white/10 text-blue-100 hover:text-white hover:shadow-md'
                  }`}
                  onClick={() => isMobile && setIsMobileMenuOpen(false)}
                  title={isCollapsed ? link.label : ''}
                >
                  <span className={`text-lg sm:text-xl transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-blue-200'
                  } ${isCollapsed ? '' : 'mr-2 sm:mr-3'}`}>
                    {link.icon}
                  </span>
                  {!isCollapsed && (
                    <span className={`font-medium text-xs sm:text-sm transition-colors duration-200 ${
                      isActive ? 'text-white' : 'text-blue-100 group-hover:text-white'
                    }`}>
                      {link.label}
                    </span>
                  )}
                  {isActive && !isCollapsed && (
                    <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Section */}
      <div className="pt-2 border-t border-blue-700/50">
        <button
          onClick={() => {
            localStorage.removeItem('ems_token');
            localStorage.removeItem('ems_user');
            window.location.href = '/login';
          }}
          className={`w-full text-blue-200 hover:bg-red-500/20 hover:text-red-200 rounded-lg transition-all duration-200 group ${
            isCollapsed 
              ? 'flex justify-center px-2 py-2' 
              : 'flex items-center px-3 py-2.5 sm:py-2'
          }`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <span className={`text-lg sm:text-xl group-hover:scale-110 transition-transform duration-200 ${
            isCollapsed ? '' : 'mr-2 sm:mr-3'
          }`}>🚪</span>
          {!isCollapsed && (
            <span className="font-medium text-xs sm:text-sm group-hover:text-red-200 transition-colors duration-200">
              Logout
            </span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <MobileMenu />
      <DesktopSidebar />
    </>
  );
}
