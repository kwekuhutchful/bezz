import React, { useState, useRef } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import api, { endpoints } from '@/lib/api';
import { 
  UserIcon,
  CreditCardIcon,
  SparklesIcon,
  CogIcon,
  CheckIcon,
  CameraIcon,
  BellIcon,
  ShieldCheckIcon,
  TrashIcon,
  ArrowRightIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  LockClosedIcon,
  LanguageIcon,
  MoonIcon,
  SunIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  KeyIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

type TabType = 'profile' | 'subscription' | 'settings' | 'security';

const ProfilePage: React.FC = () => {
  const { user, updateUserProfile } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
  });
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateUserProfile({
        displayName: profileData.displayName,
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseCredits = async (plan: string) => {
    setCheckoutLoading(plan);
    
    try {
      const response = await api.post(endpoints.payments.createCheckout, { plan });
      const { checkout_url } = response.data.data;
      
      // Redirect to Stripe Checkout
      window.location.href = checkout_url;
    } catch (error) {
      toast.error('Failed to create checkout session');
      setCheckoutLoading(null);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Handle photo upload logic here
      toast.success('Photo uploaded successfully');
    }
  };

  const tabs = [
    { id: 'profile' as TabType, name: 'Profile', icon: UserIcon, description: 'Personal information' },
    { id: 'subscription' as TabType, name: 'Subscription', icon: CreditCardIcon, description: 'Credits & billing' },
    { id: 'settings' as TabType, name: 'Settings', icon: CogIcon, description: 'Preferences' },
    { id: 'security' as TabType, name: 'Security', icon: ShieldCheckIcon, description: 'Password & access' },
  ];

  const plans = [
    {
      id: 'starter',
      name: 'Starter Pack',
      credits: 10,
      price: 9.99,
      pricePerCredit: 0.99,
      description: 'Perfect for trying out Bezz AI',
      color: 'from-gray-600 to-gray-700',
      features: [
        '10 brand strategies',
        'AI-generated campaigns',
        'Export to Canva',
        'Email support'
      ]
    },
    {
      id: 'pro',
      name: 'Professional',
      credits: 50,
      price: 39.99,
      pricePerCredit: 0.80,
      savings: '20% savings',
      description: 'Most popular for growing brands',
      color: 'from-gray-700 to-gray-800',
      features: [
        '50 brand strategies',
        'Priority processing',
        'Advanced analytics',
        'Custom templates',
        'Video ad concepts',
        'Priority support'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      credits: 200,
      price: 149.99,
      pricePerCredit: 0.75,
      savings: '25% savings',
      description: 'Best value for agencies',
      color: 'from-gray-800 to-gray-900',
      features: [
        '200 brand strategies',
        'White-label options',
        'API access',
        'Team collaboration',
        'Custom AI training',
        'Dedicated support'
      ]
    }
  ];

  // Mock usage statistics
  const usageStats = {
    totalBrands: 12,
    thisMonth: 3,
    successRate: 92,
    lastActive: 'Today'
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
        <p className="text-gray-600">Manage your profile, subscription, and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center p-4 rounded-lg transition-all
                  ${activeTab === tab.id 
                    ? 'bg-gray-50 shadow-sm' 
                    : 'hover:bg-gray-50'
                  }
                `}
              >
                <div className={`
                  p-2 rounded-lg mr-3
                  ${activeTab === tab.id 
                    ? 'bg-gray-800' 
                    : 'bg-gray-100'
                  }
                `}>
                  <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-medium ${activeTab === tab.id ? 'text-gray-900' : 'text-gray-700'}`}>
                    {tab.name}
                  </p>
                  <p className="text-xs text-gray-500 hidden md:block">{tab.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-fade-in">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Profile Header with Gradient */}
            <div className="relative h-24 bg-gradient-to-r from-gray-100 to-gray-200">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/20"></div>
            </div>
            
            {/* Profile Content */}
            <div className="relative px-8 pb-8 pt-8">
              {/* User Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-6">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || user.email}
                        className="w-24 h-24 rounded-xl shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl shadow-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-1.5 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200"
                    >
                      <CameraIcon className="h-4 w-4 text-gray-600" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                  
                  {/* Text Content */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{user?.displayName || 'User'}</h2>
                    <p className="text-gray-600 mt-1">{user?.email}</p>
                    <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <DocumentTextIcon className="h-4 w-4 mr-1" />
                        {usageStats.totalBrands} brands created
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                >
                  Edit Profile
                </button>
              </div>

              {/* Usage Statistics */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <SparklesIcon className="h-5 w-5 text-gray-600" />
                    <span className="text-2xl font-bold text-gray-900">{user?.credits || 0}</span>
                  </div>
                  <p className="text-sm text-gray-600">Available Credits</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <ChartBarIcon className="h-5 w-5 text-gray-600" />
                    <span className="text-2xl font-bold text-gray-900">{usageStats.totalBrands}</span>
                  </div>
                  <p className="text-sm text-gray-600">Total Brands</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CalendarIcon className="h-5 w-5 text-gray-600" />
                    <span className="text-2xl font-bold text-gray-900">{usageStats.thisMonth}</span>
                  </div>
                  <p className="text-sm text-gray-600">This Month</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <StarIcon className="h-5 w-5 text-gray-600" />
                    <span className="text-2xl font-bold text-gray-900">{usageStats.successRate}%</span>
                  </div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile Information</h3>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter your display name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      value={profileData.email}
                      disabled
                      className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
                    />
                    <LockClosedIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Contact support to change your email address
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-6 py-2 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-5 w-5 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="space-y-6 animate-fade-in">
          {/* Current Plan */}
          {user?.subscription && (
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-2xl p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-1">Current Plan</h3>
                  <p className="text-2xl font-bold capitalize">{user.subscription.plan} Plan</p>
                  <div className="mt-4 space-y-2">
                    <p className="flex items-center text-sm">
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Status: <span className="ml-1 font-medium capitalize">{user.subscription.status}</span>
                    </p>
                    <p className="flex items-center text-sm">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {user.subscription.cancelAtPeriodEnd ? 'Expires' : 'Renews'} on {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all">
                  Manage Subscription
                </button>
              </div>
            </div>
          )}

          {/* Credit Balance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Credit Balance</h3>
                <p className="text-sm text-gray-600">Each credit = 1 complete brand strategy</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{user?.credits || 0}</p>
                <p className="text-sm text-gray-500">credits available</p>
              </div>
            </div>
            
            {/* Usage Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Credits used this month</span>
                <span>{usageStats.thisMonth} / {user?.credits || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-700 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((usageStats.thisMonth / (user?.credits || 1)) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 flex items-start">
                <InformationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                Running low on credits? Purchase a credit pack below to continue creating amazing brands.
              </p>
            </div>
          </div>

          {/* Credit Packages */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Credit Packs</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`
                    relative bg-white rounded-2xl border-2 transition-all transform hover:scale-105 cursor-pointer
                    ${selectedPlan === plan.id 
                      ? 'border-gray-800 shadow-xl' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                    }
                  `}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gray-800 text-white px-4 py-1 text-sm font-medium rounded-full shadow-lg">
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div className={`h-2 rounded-t-2xl bg-gradient-to-r ${plan.color}`}></div>
                  
                  <div className="p-6">
                    <div className="text-center mb-6">
                      <h4 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h4>
                      <p className="text-sm text-gray-600">{plan.description}</p>
                      
                      <div className="mt-4">
                        <div className="flex items-baseline justify-center">
                          <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {plan.credits} credits • ${plan.pricePerCredit}/credit
                        </p>
                        {plan.savings && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 mt-2">
                            {plan.savings}
                          </span>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start text-sm text-gray-600">
                          <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePurchaseCredits(plan.id);
                      }}
                      disabled={checkoutLoading === plan.id}
                      className={`
                        w-full py-3 rounded-lg font-medium transition-all
                        ${selectedPlan === plan.id
                          ? 'bg-gray-800 text-white hover:bg-gray-900 hover:shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {checkoutLoading === plan.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        `Get ${plan.credits} Credits`
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fade-in">
          {/* Preferences */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Preferences</h3>
            
            <div className="space-y-6">
              {/* Language */}
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <LanguageIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Language</p>
                    <p className="text-sm text-gray-500">Choose your preferred language</p>
                  </div>
                </div>
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="en">English</option>
                  <option value="fr">French</option>
                </select>
              </div>

              {/* Theme */}
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <MoonIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Theme</p>
                    <p className="text-sm text-gray-500">Choose light or dark mode</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                  <button className="px-3 py-1.5 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700">
                    <SunIcon className="h-4 w-4" />
                  </button>
                  <button className="px-3 py-1.5 text-sm font-medium text-gray-500">
                    <MoonIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Notifications</h3>
            
            <div className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                                      <p className="text-sm text-gray-500">Receive updates about your brand briefs</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-700"></div>
              </label>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <BellIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Marketing Updates</p>
                                      <p className="text-sm text-gray-500">Tips and news about Bezz AI features</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-700"></div>
              </label>
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Push Notifications</p>
                                      <p className="text-sm text-gray-500">Get instant updates on your device</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-700"></div>
              </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-fade-in">
          {/* Password */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h3>
            
            <div className="space-y-6">
              {/* Change Password */}
              <div className="pb-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <KeyIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Password</p>
                      <p className="text-sm text-gray-500">Last changed 3 months ago</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all">
                    Change Password
                  </button>
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="pb-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <ShieldCheckIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-500">Add an extra layer of security</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all">
                    Enable 2FA
                  </button>
                </div>
              </div>

              {/* Active Sessions */}
              <div>
                <div className="flex items-start space-x-3 mb-4">
                  <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Active Sessions</p>
                    <p className="text-sm text-gray-500">Manage your active login sessions</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-lg">
                        <DevicePhoneMobileIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Current Device</p>
                        <p className="text-sm text-gray-500">Chrome on Mac • {usageStats.lastActive}</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-600 font-medium">Active Now</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 rounded-xl border border-red-200 p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h3>
            
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-red-900">Delete Account</p>
                  <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                </div>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">
                  <TrashIcon className="h-4 w-4 inline mr-2" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;