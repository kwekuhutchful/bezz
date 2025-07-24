import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api, endpoints } from '@/lib/api';
import { BrandBrief } from '@/types';
import { 
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [brief, setBrief] = useState<BrandBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'strategy' | 'campaigns'>('strategy');

  useEffect(() => {
    if (id) {
      fetchBrief();
      
      // Poll for updates if still processing
      const interval = setInterval(() => {
        if (brief?.status === 'processing') {
          fetchBrief();
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [id, brief?.status]);

  const fetchBrief = async () => {
    try {
      const response = await api.get(endpoints.getBrief(id!));
      setBrief(response.data.data);
    } catch (error) {
      toast.error('Failed to load brief');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCanva = (campaign: any) => {
    // TODO: Implement Canva export
    toast.success('Canva export feature coming soon!');
  };

  const handleExportMeta = (campaign: any) => {
    // TODO: Implement Meta Ads export
    toast.success('Meta Ads export feature coming soon!');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="text-center py-12">
        <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Brief not found</h3>
        <p className="mt-2 text-gray-500">
          The requested brand brief could not be found.
        </p>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (brief.status) {
      case 'processing':
        return <ClockIcon className="h-6 w-6 text-yellow-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <ExclamationCircleIcon className="h-6 w-6 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              {getStatusIcon()}
              <h1 className="ml-3 text-3xl font-bold text-gray-900">
                {brief.companyName}
              </h1>
            </div>
            <p className="text-gray-600">
              {brief.sector} • {brief.language.toUpperCase()} • Created {new Date(brief.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleShare}
              className="btn btn-outline btn-md inline-flex items-center"
            >
              <ShareIcon className="h-4 w-4 mr-2" />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {brief.status === 'processing' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <LoadingSpinner size="sm" className="mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Processing Your Brand Strategy
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Our AI is analyzing your brief and generating comprehensive brand strategy and campaigns. 
                This usually takes 2-3 minutes.
              </p>
            </div>
          </div>
        </div>
      )}

      {brief.status === 'failed' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Processing Failed
              </h3>
              <p className="mt-1 text-sm text-red-700">
                There was an error processing your brand brief. Please try creating a new brief or contact support.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {brief.status === 'completed' && brief.results && (
        <>
          {/* Navigation Tabs */}
          <div className="mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('strategy')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'strategy'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Brand Strategy
              </button>
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'campaigns'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Ad Campaigns ({brief.results.ads.length})
              </button>
            </nav>
          </div>

          {/* Strategy Tab */}
          {activeTab === 'strategy' && (
            <div className="space-y-6">
              {/* Brand Positioning */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Brand Positioning</h2>
                <p className="text-gray-700 leading-relaxed">
                  {brief.results.strategy.positioning}
                </p>
              </div>

              {/* Value Proposition */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Value Proposition</h2>
                <p className="text-gray-700 leading-relaxed">
                  {brief.results.strategy.valueProposition}
                </p>
              </div>

              {/* Brand Pillars */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Brand Pillars</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {brief.results.strategy.brandPillars.map((pillar, index) => (
                    <div key={index} className="p-4 bg-primary-50 rounded-lg">
                      <h3 className="font-medium text-primary-900">{pillar}</h3>
                    </div>
                  ))}
                </div>
              </div>

              {/* Messaging Framework */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Messaging Framework</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Primary Message</h3>
                    <p className="text-gray-700">{brief.results.strategy.messagingFramework.primaryMessage}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Supporting Messages</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {brief.results.strategy.messagingFramework.supportingMessages.map((message, index) => (
                        <li key={index}>{message}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Target Segments */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Target Segments</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {brief.results.strategy.targetSegments.map((segment, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{segment.name}</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Demographics:</span> {segment.demographics}</p>
                        <p><span className="font-medium">Psychographics:</span> {segment.psychographics}</p>
                        <div>
                          <span className="font-medium">Preferred Channels:</span>
                          <span className="ml-1">{segment.preferredChannels.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {brief.results.ads.map((campaign, index) => (
                <div key={index} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{campaign.title}</h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {campaign.platform} • {campaign.format}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                      {campaign.targetSegment}
                    </span>
                  </div>

                  {/* Campaign Image */}
                  {campaign.imageUrl ? (
                    <div className="mb-4">
                      <img
                        src={campaign.imageUrl}
                        alt={campaign.title}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <EyeIcon className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">Image generating...</p>
                      </div>
                    </div>
                  )}

                  {/* Campaign Copy */}
                  <div className="space-y-3 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Headline</h4>
                      <p className="text-gray-700">{campaign.copy.headline}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Body</h4>
                      <p className="text-gray-700">{campaign.copy.body}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Call to Action</h4>
                      <p className="text-gray-700">{campaign.copy.cta}</p>
                    </div>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleExportCanva(campaign)}
                      className="btn btn-outline btn-sm flex-1 inline-flex items-center justify-center"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Canva
                    </button>
                    <button
                      onClick={() => handleExportMeta(campaign)}
                      className="btn btn-outline btn-sm flex-1 inline-flex items-center justify-center"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Meta Ads
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ResultsPage; 