import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { api, endpoints } from '@/lib/api';
import { BrandBrief } from '@/types';
import { 
  PlusIcon, 
  DocumentTextIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const DashboardPage: React.FC = () => {
  const { user } = useAuthContext();
  const [briefs, setBriefs] = useState<BrandBrief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBriefs();
  }, []);

  const fetchBriefs = async () => {
    try {
      const response = await api.get(endpoints.listBriefs);
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.displayName || user?.email}
        </h1>
        <p className="text-gray-600">
          Create and manage your AI-powered brand strategies
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <SparklesIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Available Credits</p>
              <p className="text-2xl font-bold text-gray-900">{user?.credits || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Briefs</p>
              <p className="text-2xl font-bold text-gray-900">{briefs.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {briefs.filter(b => b.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/brief"
            className="btn btn-primary btn-lg inline-flex items-center justify-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create New Brief
          </Link>
          
          {user?.credits === 0 && (
            <Link
              to="/profile"
              className="btn btn-outline btn-lg inline-flex items-center justify-center"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              Get More Credits
            </Link>
          )}
        </div>
      </div>

      {/* Recent Briefs */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Recent Brand Briefs</h2>
        </div>

        {briefs.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No briefs yet</h3>
            <p className="mt-2 text-gray-500">
              Create your first brand brief to get started with AI-powered strategy generation.
            </p>
            <div className="mt-6">
              <Link
                to="/brief"
                className="btn btn-primary btn-md inline-flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Your First Brief
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {briefs.map((brief) => (
                  <li key={brief.id} className="py-5">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(brief.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-medium text-gray-900 truncate">
                              {brief.companyName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {brief.sector} • {brief.language.toUpperCase()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {getStatusText(brief.status)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(brief.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            Target: {brief.targetAudience} • Tone: {brief.tone}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        {brief.status === 'completed' ? (
                          <Link
                            to={`/results/${brief.id}`}
                            className="btn btn-outline btn-sm"
                          >
                            View Results
                          </Link>
                        ) : brief.status === 'processing' ? (
                          <div className="flex items-center text-sm text-yellow-600">
                            <LoadingSpinner size="sm" className="mr-2" />
                            Processing
                          </div>
                        ) : (
                          <button
                            onClick={() => fetchBriefs()}
                            className="btn btn-outline btn-sm"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage; 