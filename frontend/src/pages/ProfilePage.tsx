import React, { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { api, endpoints } from '@/lib/api';
import { 
  UserIcon,
  CreditCardIcon,
  SparklesIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user, updateUserProfile } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
  });

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
      const response = await api.post(endpoints.createCheckoutSession, { plan });
      const { checkout_url } = response.data.data;
      
      // Redirect to Stripe Checkout
      window.location.href = checkout_url;
    } catch (error) {
      toast.error('Failed to create checkout session');
      setCheckoutLoading(null);
    }
  };

  const plans = [
    {
      id: 'starter',
      name: 'Starter Pack',
      credits: 10,
      price: 9.99,
      description: 'Perfect for small businesses and startups',
      features: [
        '10 brand briefs',
        'AI-generated strategies',
        'Multi-platform campaigns',
        'Export to Canva & Meta Ads'
      ]
    },
    {
      id: 'pro',
      name: 'Professional',
      credits: 50,
      price: 39.99,
      description: 'Ideal for marketing agencies and growing brands',
      features: [
        '50 brand briefs',
        'Priority AI processing',
        'Advanced analytics',
        'Custom brand guidelines',
        'Video ad concepts'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      credits: 200,
      price: 149.99,
      description: 'For large organizations and agencies',
      features: [
        '200 brand briefs',
        'Dedicated support',
        'Custom AI training',
        'White-label options',
        'API access',
        'Team collaboration'
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile & Settings</h1>
        <p className="text-gray-600">Manage your account and subscription</p>
      </div>

      {/* Profile Information */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            Profile Information
          </h2>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="displayName" className="label">
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                value={profileData.displayName}
                onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                className="input"
                placeholder="Enter your display name"
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={profileData.email}
                disabled
                className="input bg-gray-50 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-gray-500">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-md"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Credits & Subscription */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <SparklesIcon className="h-5 w-5 mr-2" />
            Credits & Subscription
          </h2>
        </div>

        <div className="space-y-6">
          {/* Current Credits */}
          <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
            <div>
              <h3 className="font-medium text-primary-900">Available Credits</h3>
              <p className="text-sm text-primary-700">
                Each credit allows you to generate one complete brand strategy
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-900">
                {user?.credits || 0}
              </div>
              <div className="text-sm text-primary-700">credits</div>
            </div>
          </div>

          {/* Subscription Status */}
          {user?.subscription && (
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 capitalize">
                    {user.subscription.plan} Plan
                  </h3>
                  <p className="text-sm text-gray-500">
                    Status: <span className="capitalize">{user.subscription.status}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {user.subscription.cancelAtPeriodEnd ? 'Expires' : 'Renews'} on
                  </p>
                  <p className="font-medium">
                    {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Credit Packages */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Purchase Credits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative border rounded-lg p-6 ${
                    plan.popular
                      ? 'border-primary-500 ring-2 ring-primary-500 ring-opacity-50'
                      : 'border-gray-200'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary-500 text-white px-3 py-1 text-sm font-medium rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {plan.credits} credits • ${(plan.price / plan.credits).toFixed(2)} per credit
                    </p>
                  </div>

                  <p className="text-sm text-gray-600 text-center mt-4 mb-4">
                    {plan.description}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <SparklesIcon className="h-4 w-4 text-primary-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePurchaseCredits(plan.id)}
                    disabled={checkoutLoading === plan.id}
                    className={`w-full btn ${
                      plan.popular ? 'btn-primary' : 'btn-outline'
                    } btn-md`}
                  >
                    {checkoutLoading === plan.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      `Purchase ${plan.credits} Credits`
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <CogIcon className="h-5 w-5 mr-2" />
            Account Settings
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <h3 className="font-medium text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-500">
                Receive updates about your brand briefs and account
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-gray-200">
            <div>
              <h3 className="font-medium text-gray-900">Marketing Communications</h3>
              <p className="text-sm text-gray-500">
                Receive tips and updates about new features
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button className="text-red-600 hover:text-red-700 text-sm font-medium">
              Delete Account
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Permanently delete your account and all associated data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 