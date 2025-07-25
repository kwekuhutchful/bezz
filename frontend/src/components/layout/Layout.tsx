import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  BellIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CreditCardIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, description: 'View All Brands' },
    { name: 'Create Brand', href: '/brief', icon: SparklesIcon, description: 'Start New Project' },
    { name: 'Profile', href: '/profile', icon: UserIcon, description: 'Account Settings' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Get current page name for breadcrumb
  const currentPage = navigation.find(item => item.href === location.pathname)?.name || 'Dashboard';

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden">
      {/* Mobile sidebar backdrop with blur */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar content */}
        <div className="h-full bg-white border-r border-gray-200 shadow-lg">
          <div className="flex h-full flex-col">
            {/* Logo Section */}
            <div className="flex h-20 items-center justify-between px-6 border-b border-gray-200/50">
              <Link to="/dashboard" className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl blur group-hover:blur-md transition-all"></div>
                  <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    <SparklesIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Bezz AI
                  </span>
                  <p className="text-xs text-gray-500">Brand Intelligence</p>
                </div>
              </Link>
              <button
                type="button"
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Quick Action */}
            <div className="px-4 py-4">
              <button
                onClick={() => navigate('/brief')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Create New Brand</span>
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                      ${isActive 
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className={`
                      mr-3 p-2 rounded-lg transition-all
                      ${isActive 
                        ? 'bg-gradient-to-br from-blue-600 to-purple-600' 
                        : 'bg-gray-100 group-hover:bg-gray-200'
                      }
                    `}>
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`${isActive ? 'font-semibold' : ''}`}>{item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                    </div>
                    {isActive && (
                      <ChevronRightIcon className="h-5 w-5 text-blue-600" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Credits & Plan Info */}
            <div className="px-4 pb-4">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <CreditCardIcon className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Credits</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{user?.credits || 0}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Current Plan</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {user?.subscription?.plan || 'Free'}
                    </span>
                  </div>
                  {(!user?.subscription || user?.subscription?.plan === 'starter') && (
                    <button
                      onClick={() => navigate('/profile')}
                      className="w-full mt-2 text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg font-medium hover:shadow-md transition-all"
                    >
                      Upgrade to Pro
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* User Profile Section */}
            <div className="border-t border-gray-200/50 p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="relative">
                  {user?.photoURL ? (
                    <img
                      className="h-10 w-10 rounded-full ring-2 ring-gray-200"
                      src={user.photoURL}
                      alt={user.displayName || user.email}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center ring-2 ring-gray-200">
                      <span className="text-sm font-medium text-white">
                        {user?.displayName?.[0] || user?.email[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full ring-2 ring-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.displayName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Mobile menu button & Breadcrumb */}
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>
                
                {/* Breadcrumb */}
                <nav className="hidden lg:flex items-center space-x-2 text-sm">
                  <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 transition">
                    Dashboard
                  </Link>
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900 font-medium">{currentPage}</span>
                </nav>
              </div>

              {/* Search & Actions */}
              <div className="flex items-center space-x-4">
                {/* Search Bar */}
                <div className={`
                  hidden md:flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg transition-all
                  ${searchFocused ? 'w-80 ring-2 ring-blue-500 bg-white' : 'w-64'}
                `}>
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search briefs..."
                    className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                  />
                </div>

                {/* Notifications */}
                <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                  <BellIcon className="h-6 w-6" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* Quick Create Button (Desktop) */}
                <button
                  onClick={() => navigate('/brief')}
                  className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-md transition-all"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Create</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Animated page transitions would go here */}
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 