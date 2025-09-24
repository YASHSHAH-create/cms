export default function Hero() {
  return (
    <div className="relative bg-gradient-to-br from-blue-50 to-green-50 overflow-hidden">
      {/* Laboratory Background Image */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-blue-800/20">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="text-left">
            <h2 className="text-base font-medium text-gray-700 mb-3">
              Welcome to Envirocare Labs!
            </h2>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              World-Class Testing Services for Your
              <span className="block text-green-600">Quality Assurance Needs</span>
            </h1>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl">
              Your trusted partner for environmental analysis and testing services. 
              We provide comprehensive solutions for all your environmental needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <span className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold text-base shadow-lg cursor-pointer transition-colors duration-200">
                Explore Services
              </span>
              <span className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-base shadow-lg cursor-pointer transition-colors duration-200">
                Get Started
              </span>
            </div>
          </div>
          
          {/* Right Content - Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">Established</div>
              <div className="text-xs text-gray-600">Since 1979</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">Testing</div>
              <div className="text-xs text-gray-600">Parameters</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">Clientele</div>
              <div className="text-xs text-gray-600">Worldwide</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Stats Section */}
      <div className="relative bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Envirocare Labs: FSSAI Approved Food Testing Laboratory in India
            </h2>
            <p className="text-lg text-gray-600">
              Testing | Analysis | Research | Training | Inspections | Audit
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Accreditation</h3>
              <p className="text-sm text-gray-600">ISO/IEC 17025 and ISO/IEC 17043 by NABL</p>
            </div>
            
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Recognitions</h3>
              <p className="text-sm text-gray-600">FSSAI, BIS, EIC, APEDA, AGMARK</p>
            </div>
            
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Memberships</h3>
              <p className="text-sm text-gray-600">Prestigious organizations worldwide</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
