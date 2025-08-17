import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  SparklesIcon,
  EyeIcon, 
  EyeSlashIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Remove React Hook Form completely for now to test
  // const { register, handleSubmit, formState: { errors }, clearErrors } = useForm<LoginForm>();

  const handleLogin = async () => {
    console.log('🔑 LOGIN: Starting AJAX login process...');
    console.log('🔑 LOGIN: Email:', email, 'Password length:', password.length);
    console.log('🔑 LOGIN: Current location:', window.location.href);
    
    // Basic validation
    if (!email || !password) {
      setServerError('Please fill in all fields');
      toast.error('Please fill in all fields');
      return;
    }
    
    if (!email.includes('@')) {
      setServerError('Please enter a valid email address');
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Clear any previous errors
    setServerError(null);
    
    try {
      console.log('🔑 LOGIN: Calling signIn with email:', email);
      
      // Wait for authentication to complete
      await signIn(email, password);
      
      console.log('🔑 LOGIN: Authentication successful, redirecting...');
      
      // Only navigate if authentication was successful
      toast.success('Welcome back!');
      
      // Small delay to ensure state is properly set before navigation
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
      
    } catch (error: any) {
      console.error('🔑 LOGIN: Authentication failed:', error);
      
      // Parse different types of error messages
      let errorMessage = 'Failed to sign in. Please try again.';
      
      if (error.message) {
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid_login_credentials') || msg.includes('invalid-credential') || msg.includes('invalid credential')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (msg.includes('user-not-found') || msg.includes('user not found')) {
          errorMessage = 'No account found with this email address.';
        } else if (msg.includes('wrong-password') || msg.includes('incorrect password')) {
          errorMessage = 'Incorrect password. Please try again.';
        } else if (msg.includes('too-many-requests') || msg.includes('too many requests')) {
          errorMessage = 'Too many failed attempts. Please wait a few minutes before trying again.';
        } else if (msg.includes('user-disabled') || msg.includes('account disabled')) {
          errorMessage = 'This account has been disabled. Please contact support.';
        } else if (msg.includes('network') || msg.includes('connection')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          // Use the original error message if it's user-friendly
          errorMessage = error.message;
        }
      }
      
      console.log('🔑 LOGIN: Setting error message:', errorMessage);
      
      // Set the error state to display in the UI
      setServerError(errorMessage);
      
      // Also show toast for immediate feedback
      toast.error(errorMessage);
      
      // DO NOT navigate on error - stay on login page
      
    } finally {
      // Don't set loading to false here - the button click handler manages it
      console.log('🔑 LOGIN: Login process completed');
      console.log('🔑 LOGIN: Final location:', window.location.href);
    }
  };

  const features = [
    'Access your brand projects',
    'Continue where you left off',
    'Download your assets anytime',
    'Manage your subscription'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Left Side - Features */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 items-center justify-center px-8 relative overflow-hidden">
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 border border-white rounded-full"></div>
          <div className="absolute bottom-32 right-16 w-24 h-24 border border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 border border-white rounded-full"></div>
        </div>
        <div className="max-w-lg relative z-10">
          <h3 className="text-3xl font-bold text-white mb-6">
            Welcome back to Bezz AI
          </h3>
          <p className="text-xl text-gray-300 mb-8">
            Continue building your brand with <span className="text-cyan-400">AI-powered</span> tools
          </p>
          
          <div className="space-y-4 mb-12">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-cyan-400 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-200">{feature}</span>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-gray-800/90 to-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-300 font-semibold">Active Users</span>
              <span className="text-cyan-400 font-bold">44,000+</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-300 font-semibold">Brands Created</span>
              <span className="text-cyan-400 font-bold">120,000+</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 font-semibold">Time Saved</span>
              <span className="text-cyan-400 font-bold">500,000+ hours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Logo */}
          <Link to="/" className="flex flex-col items-center justify-center mb-8">
            <img 
              src="/logo_dark.png" 
              alt="Bezz AI Logo"
              className="h-7 w-auto mb-2"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src.includes('dark')) {
                  target.src = '/logo_light.png';
                }
              }}
            />
            <span className="text-sm text-gray-600">Brand Intelligence</span>
          </Link>

          {/* Form Container */}
          <div className={`bg-white rounded-2xl shadow-xl p-8 transition-opacity relative ${loading ? 'opacity-90' : 'opacity-100'}`}>
            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white/50 rounded-2xl flex items-center justify-center z-10">
                <div className="bg-white rounded-lg shadow-lg p-4 flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                  <span className="text-gray-700 font-medium">Signing you in...</span>
                </div>
              </div>
            )}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
              <p className="text-gray-600">Sign in to continue to your dashboard</p>
            </div>

            <div className="space-y-6">
              {/* Server Error Display */}
              {serverError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">
                        {serverError}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setServerError(null); // Clear server error when user types
                  }}
                  className={`w-full px-4 py-3 rounded-lg border transition ${
                    serverError 
                      ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  }`}
                  placeholder="sarah@example.com"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !loading) {
                      e.preventDefault();
                      // Trigger the same button click logic
                      document.getElementById('login-button')?.click();
                    }
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setServerError(null); // Clear server error when user types
                    }}
                    className={`w-full px-4 py-3 rounded-lg border transition pr-10 ${
                      serverError 
                        ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    }`}
                    placeholder="••••••••"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !loading) {
                        e.preventDefault();
                        // Trigger the same button click logic
                        document.getElementById('login-button')?.click();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="login-button"
                type="button"
                disabled={loading}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔑 LOGIN BUTTON: Button clicked, current loading state:', loading);
                  
                  if (loading) {
                    console.log('🔑 LOGIN BUTTON: Already loading, ignoring click');
                    return;
                  }
                  
                  console.log('🔑 LOGIN BUTTON: Setting loading to true...');
                  setLoading(true);
                  
                  try {
                    await handleLogin();
                  } catch (error) {
                    console.error('🔑 LOGIN BUTTON: Error in click handler:', error);
                  } finally {
                    console.log('🔑 LOGIN BUTTON: Setting loading to false...');
                    setLoading(false);
                  }
                }}
                className={`w-full py-3 px-4 rounded-lg font-medium transition flex items-center justify-center ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-cyan-500 to-yellow-500 hover:shadow-lg transform hover:scale-[1.02]'
                } text-white`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
              
              {/* Debug: Show loading state */}
              <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                Debug - Loading: {loading ? 'true' : 'false'}, Server Error: {serverError ? serverError : 'none'}, Email: {email}, Password: {'*'.repeat(password.length)}
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Social Sign In */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                disabled={loading}
                className={`flex items-center justify-center px-4 py-3 border rounded-lg transition ${
                  loading 
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium text-gray-700">Google</span>
              </button>
              <button 
                type="button"
                disabled={loading}
                className={`flex items-center justify-center px-4 py-3 border rounded-lg transition ${
                  loading 
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span className="text-sm font-medium text-gray-700">GitHub</span>
              </button>
            </div>

            {/* Sign Up Link */}
            <p className="mt-8 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-700">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 