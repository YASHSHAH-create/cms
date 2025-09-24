'use client';

// useState not used in this component
// Image import not used in this component

export default function Header() {
  // Menu state not used in this component

  return (
    <>
      {/* Top Bar */}
      <div className="bg-gray-800 text-white text-xs py-1.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <span className="font-medium">Laboratory in Mumbai | Envirocare Labs</span>
              <span className="text-gray-300">envirocarelabs.com</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-gray-400 p-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </span>
              <span className="text-gray-400 p-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </span>
              <span className="text-gray-400 p-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </span>
              <span className="text-gray-400 p-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </span>
              <span className="text-gray-400 p-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </span>
              <span className="text-gray-400 p-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <div className="text-lg font-bold text-blue-600">envirocare labs®</div>
                  <div className="text-xs text-gray-500">Analysis and Beyond...</div>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              <span className="text-blue-600 border-b-2 border-black px-3 py-2 text-sm font-medium cursor-default">
                Home
              </span>
              <span className="text-blue-600 px-3 py-2 text-sm font-medium cursor-default">
                Testing Services
              </span>
              <span className="text-blue-600 px-3 py-2 text-sm font-medium cursor-default">
                Proficiency Testing
              </span>
              <span className="text-blue-600 px-3 py-2 text-sm font-medium cursor-default">
                About Us
              </span>
              <span className="text-blue-600 px-3 py-2 text-sm font-medium cursor-default">
                Certificates
              </span>
              <span className="text-blue-600 px-3 py-2 text-sm font-medium cursor-default">
                R&D
              </span>
              <span className="text-blue-600 px-3 py-2 text-sm font-medium cursor-default">
                Career
              </span>
              <span className="text-blue-600 px-3 py-2 text-sm font-medium cursor-default">
                Blogs
              </span>
              <span className="text-blue-600 px-3 py-2 text-sm font-medium cursor-default">
                Contact
              </span>
            </nav>

            {/* Search Icon */}
            <div className="hidden md:flex">
              <span className="text-blue-600 p-2 cursor-default">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <span className="text-blue-600 p-2 cursor-default">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}