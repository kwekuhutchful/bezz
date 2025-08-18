import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import api, { endpoints, briefAPI } from '@/lib/api';
import { BrandBrief } from '@/types';
import { 
  PlusIcon, 
  DocumentTextIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  ChartBarIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const DashboardPage: React.FC = () => {
  const { user } = useAuthContext();
  const [briefs, setBriefs] = useState<BrandBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'processing' | 'completed' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [expandedBriefs, setExpandedBriefs] = useState<Set<string>>(new Set());
  const [retryingBriefs, setRetryingBriefs] = useState<Set<string>>(new Set());
  const [nowTs, setNowTs] = useState<number>(Date.now());
  const PROCESSING_SLA_SEC = 5 * 60; // 5 minutes SLA

  useEffect(() => {
    fetchBriefs();
  }, []);

  // Separate effect for polling processing briefs
  useEffect(() => {
    const hasProcessingBriefs = briefs.some(brief => brief.status === 'processing');
    
    if (hasProcessingBriefs) {
      const interval = setInterval(() => {
        fetchBriefs();
      }, 5000); // Poll every 5 seconds when there are processing briefs

      return () => clearInterval(interval);
    }
  }, [briefs]);

  // Local 1s ticker to update countdown/progress UI while processing
  useEffect(() => {
    const hasProcessingBriefs = briefs.some(brief => brief.status === 'processing');
    if (!hasProcessingBriefs) return;
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [briefs]);

  const fetchBriefs = async () => {
    try {
      const response = await api.get(endpoints.briefs.list);
      setBriefs(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load briefs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'processing':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const toggleBriefExpanded = (briefId: string) => {
    setExpandedBriefs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(briefId)) {
        newSet.delete(briefId);
      } else {
        newSet.add(briefId);
      }
      return newSet;
    });
  };

  const handleRetryBrief = async (briefId: string) => {
    try {
      setRetryingBriefs(prev => new Set(prev).add(briefId));
      
      await briefAPI.retry(briefId);
      
      toast.success('Retry started! Your brand generation is now processing.');
      
      // Refresh the brief list to show updated status
      await fetchBriefs();
    } catch (error: any) {
      console.error('Failed to retry brief:', error);
      const errorMessage = error.response?.data?.error || 'Failed to retry. Please try again.';
      toast.error(errorMessage);
    } finally {
      setRetryingBriefs(prev => {
        const newSet = new Set(prev);
        newSet.delete(briefId);
        return newSet;
      });
    }
  };

  const filteredBriefs = briefs
    .filter(brief => selectedFilter === 'all' || brief.status === selectedFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.companyName.localeCompare(b.companyName);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Welcome Section with Gradient Background - Only for new users */}
      {briefs.length === 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 via-yellow-500 to-yellow-600 p-8 mb-8">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.displayName || user?.email?.split('@')[0]}! 👋
            </h1>
            <p className="text-blue-100 text-lg mb-6">
              Ready to create your first AI-powered brand?
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/brief"
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-medium rounded-xl hover:shadow-lg transform hover:scale-105 transition-all"
              >
                <RocketLaunchIcon className="h-5 w-5 mr-2" />
                Create New Brand
              </Link>
            </div>
          </div>
          {/* Decorative Elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      )}

      {/* Stats Cards with Modern Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Credits Card */}
        <div className="relative overflow-hidden bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-yellow-500/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-yellow-500 rounded-lg">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{user?.credits || 0}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Available Credits</p>
            <p className="text-xs text-gray-500 mt-1">
              {user?.credits === 0 ? 'Upgrade to get more' : 'Ready to create'}
            </p>
          </div>
        </div>

        {/* Total Briefs Card */}
        <div className="relative overflow-hidden bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{briefs.length}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Total Brands</p>
            <p className="text-xs text-gray-500 mt-1">All time creations</p>
          </div>
        </div>

        {/* Completed Card */}
        <div className="relative overflow-hidden bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {briefs.filter(b => b.status === 'completed').length}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600">Completed</p>
            <p className="text-xs text-gray-500 mt-1">Ready to launch</p>
          </div>
        </div>

        {/* Success Rate Card */}
        <div className="relative overflow-hidden bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg">
                <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {briefs.length > 0 
                  ? `${Math.round((briefs.filter(b => b.status === 'completed').length / briefs.length) * 100)}%`
                  : '0%'
                }
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600">Success Rate</p>
            <p className="text-xs text-gray-500 mt-1">Generation success</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      {user?.credits === 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <ExclamationCircleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Out of Credits</h3>
                <p className="text-sm text-gray-600 mt-1">Upgrade to Pro to continue creating brands</p>
              </div>
            </div>
            <Link
              to="/profile"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-medium rounded-xl hover:shadow-lg transform hover:scale-105 transition-all"
            >
              <CurrencyDollarIcon className="h-5 w-5 mr-2" />
              Upgrade Now
            </Link>
          </div>
        </div>
      )}

      {/* Brand Briefs Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Header with Filters */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Brand Portfolio</h2>
            
            <div className="flex items-center gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                {(['all', 'processing', 'completed', 'failed'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`
                      px-4 py-2 text-sm font-medium rounded-md transition-all capitalize
                      ${selectedFilter === filter 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                      }
                    `}
                  >
                    {filter === 'all' ? 'All' : filter}
                    {filter !== 'all' && (
                      <span className="ml-2 text-xs">
                        ({briefs.filter(b => b.status === filter).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center">
                <ArrowsUpDownIcon className="h-4 w-4 text-gray-400 mr-2" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Briefs List */}
        {filteredBriefs.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <DocumentTextIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedFilter === 'all' ? 'No brands yet' : `No ${selectedFilter} brands`}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {selectedFilter === 'all' 
                ? 'Create your first AI-powered brand strategy and marketing assets in minutes.'
                : `You don't have any brands with ${selectedFilter} status.`
              }
            </p>
            {selectedFilter === 'all' && (
              <Link
                to="/brief"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-yellow-500 text-white font-medium rounded-xl hover:shadow-lg transform hover:scale-105 transition-all"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Your First Brand
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredBriefs.map((brief) => {
              const startedAtMs = new Date(brief.createdAt).getTime();
              const elapsedSec = Math.max(0, Math.floor((nowTs - startedAtMs) / 1000));
              const remainingSec = Math.max(0, PROCESSING_SLA_SEC - elapsedSec);
              const mins = Math.floor(remainingSec / 60);
              const secs = remainingSec % 60;
              const percent = Math.min(100, Math.floor((elapsedSec / PROCESSING_SLA_SEC) * 100));

              return (
                <div key={brief.id} className="p-6 hover:bg-gray-50 transition-all group">
                  <div className="flex items-start space-x-4">
                    {/* Status Icon */}
                    <div className="flex-shrink-0 pt-1">
                      {getStatusIcon(brief.status)}
                    </div>
                    
                    {/* Brief Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Header Row - Company, Status, Date */}
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                                {brief.companyName}
                              </h3>
                              <div className="flex items-center gap-3">
                                <span className={getStatusBadge(brief.status)}>
                                  {brief.status}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {formatDate(brief.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Meta Information */}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center">
                              <ChartBarIcon className="h-4 w-4 mr-1 text-gray-400" />
                              {brief.sector}
                            </span>
                            <span className="flex items-center">
                              <SparklesIcon className="h-4 w-4 mr-1 text-gray-400" />
                              {brief.tone}
                            </span>
                            <span className="flex items-center">
                              <UserGroupIcon className="h-4 w-4 mr-1 text-gray-400" />
                              Target: {brief.targetAudience.length > 80 ? brief.targetAudience.substring(0, 80) + '...' : brief.targetAudience}
                            </span>
                          </div>

                          {/* Additional Info if exists */}
                          {brief.additionalInfo && (
                            <div className="relative">
                              <p className={`text-sm text-gray-500 ${!expandedBriefs.has(brief.id) ? 'line-clamp-2' : ''}`}>
                                {brief.additionalInfo}
                              </p>
                              {/* Only show "See more" if content is actually truncated */}
                              {(() => {
                                // Check if text would be truncated (rough estimate: 2 lines ≈ 150 chars)
                                const isTruncated = brief.additionalInfo.length > 150;
                                return isTruncated && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      toggleBriefExpanded(brief.id);
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1"
                                  >
                                    {expandedBriefs.has(brief.id) ? 'See less' : 'See more'}
                                  </button>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex-shrink-0 self-center">
                          {brief.status === 'completed' ? (
                            <Link
                              to={`/results/${brief.id}`}
                              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cyan-500 to-yellow-500 text-white text-sm font-medium rounded-lg hover:shadow-md transform hover:scale-105 transition-all"
                            >
                              View Brand
                              <ArrowRightIcon className="ml-2 h-4 w-4" />
                            </Link>
                          ) : brief.status === 'processing' || brief.status === 'strategy_completed' || brief.status === 'ads_completed' ? (
                            <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-lg">
                              <LoadingSpinner size="sm" className="mr-2" />
                              Processing
                            </div>
                          ) : (
                            <button
                              onClick={() => handleRetryBrief(brief.id)}
                              disabled={retryingBriefs.has(brief.id)}
                              className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {retryingBriefs.has(brief.id) ? (
                                <>
                                  <LoadingSpinner size="sm" className="mr-2" />
                                  Retrying...
                                </>
                              ) : (
                                'Retry'
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar for Processing Items */}
                      {brief.status === 'processing' && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Generating your brand assets...</span>
                            <span>
                              {mins}:{secs.toString().padStart(2,'0')} remaining
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div className="bg-gradient-to-r from-cyan-500 to-yellow-500 h-2 rounded-full animate-pulse" 
                                 style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pro Tips Section */}
      {briefs.length > 0 && briefs.length < 3 && (
        <div className="mt-8 bg-gradient-to-r from-cyan-50 to-yellow-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <StarIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pro Tip</h3>
              <p className="text-sm text-gray-600 mb-3">
                Create multiple brand variations to A/B test different positioning strategies. 
                Our AI generates unique approaches each time!
              </p>
              <Link
                to="/brief"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Try another variation
                <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage; 