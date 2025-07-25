import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { endpoints } from '@/lib/api';
import { BrandBrief } from '@/types';
import { 
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  EyeIcon,
  SparklesIcon,
  LightBulbIcon,
  MegaphoneIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  RocketLaunchIcon,
  DocumentDuplicateIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  GlobeAltIcon,
  HeartIcon,
  StarIcon,
  ArrowTopRightOnSquareIcon,
  PhotoIcon,
  VideoCameraIcon,
  NewspaperIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

type TabType = 'overview' | 'strategy' | 'campaigns' | 'assets';

const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [brief, setBrief] = useState<BrandBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);

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
      const response = await api.get(endpoints.briefs.get(id!));
      setBrief(response.data.data);
    } catch (error) {
      toast.error('Failed to load brief');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCanva = (campaign: any) => {
    toast.success('Exporting to Canva...');
    // TODO: Implement Canva export
  };

  const handleExportMeta = (campaign: any) => {
    toast.success('Exporting to Meta Ads Manager...');
    // TODO: Implement Meta Ads export
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const handleDownloadStrategy = () => {
    toast.success('Downloading brand strategy PDF...');
    // TODO: Implement PDF download
  };

  const platformIcons: Record<string, any> = {
    facebook: DevicePhoneMobileIcon,
    instagram: PhotoIcon,
    linkedin: ComputerDesktopIcon,
    twitter: NewspaperIcon,
    youtube: VideoCameraIcon
  };

  const formatIcons: Record<string, any> = {
    image: PhotoIcon,
    video: VideoCameraIcon,
    carousel: DocumentDuplicateIcon,
    story: DevicePhoneMobileIcon
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 animate-pulse">Loading your brand strategy...</p>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <ExclamationCircleIcon className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Brief Not Found</h3>
        <p className="text-gray-600 mb-6">
          The requested brand brief could not be found.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  const getStatusConfig = () => {
    switch (brief.status) {
      case 'processing':
        return {
          icon: ClockIcon,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          title: 'Processing Your Brand Strategy',
          message: 'Our AI is crafting your unique brand identity. This usually takes 2-3 minutes.'
        };
      case 'completed':
        return {
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'Strategy Complete',
          message: 'Your brand strategy and campaigns are ready!'
        };
      case 'failed':
        return {
          icon: ExclamationCircleIcon,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Processing Failed',
          message: 'There was an error processing your brief. Please try again or contact support.'
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig?.icon;

  const tabs = [
    { id: 'overview' as TabType, name: 'Overview', icon: SparklesIcon, description: 'Executive summary' },
    { id: 'strategy' as TabType, name: 'Brand Strategy', icon: LightBulbIcon, description: 'Core positioning' },
    { id: 'campaigns' as TabType, name: 'Campaigns', icon: MegaphoneIcon, description: `${brief.results?.ads.length || 0} ready`, count: brief.results?.ads.length },
    { id: 'assets' as TabType, name: 'Assets', icon: ArrowDownTrayIcon, description: 'Download & export' }
  ];

  // Calculate completion progress
  const completionSteps = [
    { name: 'Brief Analysis', completed: true },
    { name: 'Strategy Development', completed: brief.status === 'completed' },
    { name: 'Campaign Creation', completed: brief.status === 'completed' },
    { name: 'Asset Generation', completed: brief.status === 'completed' && brief.results?.ads.some(ad => ad.imageUrl) }
  ];

  const completedSteps = completionSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / completionSteps.length) * 100;

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-all"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center mb-2">
              {StatusIcon && (
                <div className={`p-2 rounded-lg ${statusConfig.bgColor} mr-3`}>
                  <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {brief.companyName}
                </h1>
                <div className="flex items-center mt-1 space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <ChartBarIcon className="h-4 w-4 mr-1" />
                    {brief.sector}
                  </span>
                  <span className="flex items-center">
                    <GlobeAltIcon className="h-4 w-4 mr-1" />
                    {brief.language.toUpperCase()}
                  </span>
                  <span>Created {new Date(brief.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleShare}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              <ShareIcon className="h-4 w-4 mr-2" />
              Share
            </button>
            {brief.status === 'completed' && (
              <button
                onClick={handleDownloadStrategy}
                className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Download All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Processing Status */}
      {brief.status === 'processing' && (
        <div className={`mb-8 p-6 rounded-xl border ${statusConfig?.borderColor} ${statusConfig?.bgColor}`}>
          <div className="flex items-start">
            <LoadingSpinner size="sm" className="mr-4 mt-1" />
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${statusConfig?.color}`}>
                {statusConfig?.title}
              </h3>
              <p className="mt-1 text-gray-600">
                {statusConfig?.message}
              </p>
              
              {/* Progress Steps */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm font-medium text-gray-900">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {completionSteps.map((step, index) => (
                    <div key={index} className="flex items-center">
                      {step.completed ? (
                        <CheckCircleIconSolid className="h-5 w-5 text-green-600 mr-2" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300 mr-2 animate-pulse" />
                      )}
                      <span className={`text-sm ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                        {step.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Status */}
      {brief.status === 'failed' && (
        <div className={`mb-8 p-6 rounded-xl border ${statusConfig?.borderColor} ${statusConfig?.bgColor}`}>
          <div className="flex items-start">
            <ExclamationCircleIcon className="h-6 w-6 text-red-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">
                {statusConfig?.title}
              </h3>
              <p className="mt-1 text-red-700">
                {statusConfig?.message}
              </p>
              <button
                onClick={() => navigate('/brief')}
                className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
              >
                Create New Brief
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      {brief.status === 'completed' && brief.results && (
        <>
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
                        {tab.count && (
                          <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                            {tab.count}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{tab.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Executive Summary */}
              <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-2xl p-8 text-white">
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <SparklesIcon className="h-7 w-7 mr-3" />
                  Executive Summary
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-200">Brand Positioning</h3>
                    <p className="text-gray-300 leading-relaxed">
                      {brief.results.strategy.positioning}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-200">Value Proposition</h3>
                    <p className="text-gray-300 leading-relaxed">
                      {brief.results.strategy.valueProposition}
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <UserGroupIcon className="h-5 w-5 text-gray-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      {brief.results.strategy.targetSegments.length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Target Segments</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <MegaphoneIcon className="h-5 w-5 text-gray-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      {brief.results.ads.length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Ad Campaigns</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <HeartIcon className="h-5 w-5 text-gray-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      {brief.results.strategy.brandPillars.length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Brand Pillars</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      {brief.results.strategy.messagingFramework.supportingMessages.length + 1}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Key Messages</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('strategy')}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all text-left"
                  >
                    <LightBulbIcon className="h-6 w-6 text-gray-600 mb-2" />
                    <h4 className="font-medium text-gray-900">View Full Strategy</h4>
                    <p className="text-sm text-gray-600 mt-1">Explore positioning & messaging</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('campaigns')}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all text-left"
                  >
                    <MegaphoneIcon className="h-6 w-6 text-gray-600 mb-2" />
                    <h4 className="font-medium text-gray-900">Browse Campaigns</h4>
                    <p className="text-sm text-gray-600 mt-1">Ready-to-use ad creatives</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('assets')}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all text-left"
                  >
                    <ArrowDownTrayIcon className="h-6 w-6 text-gray-600 mb-2" />
                    <h4 className="font-medium text-gray-900">Download Assets</h4>
                    <p className="text-sm text-gray-600 mt-1">Export to various platforms</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Strategy Tab */}
          {activeTab === 'strategy' && (
            <div className="space-y-6 animate-fade-in">
              {/* Brand Positioning */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-start mb-6">
                  <div className="p-3 bg-gray-100 rounded-lg mr-4">
                    <RocketLaunchIcon className="h-6 w-6 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-3">Brand Positioning</h2>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {brief.results.strategy.positioning}
                    </p>
                  </div>
                </div>
              </div>

              {/* Value Proposition */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-start mb-6">
                  <div className="p-3 bg-gray-100 rounded-lg mr-4">
                    <StarIcon className="h-6 w-6 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-3">Value Proposition</h2>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {brief.results.strategy.valueProposition}
                    </p>
                  </div>
                </div>
              </div>

              {/* Brand Pillars */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <HeartIcon className="h-6 w-6 mr-3 text-gray-700" />
                  Brand Pillars
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {brief.results.strategy.brandPillars.map((pillar, index) => (
                    <div key={index} className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl blur opacity-0 group-hover:opacity-10 transition-all"></div>
                      <div className="relative bg-gray-50 rounded-xl p-6 border border-gray-200 group-hover:border-gray-300 transition-all">
                        <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg shadow-sm mb-4">
                          <span className="text-lg font-bold text-gray-700">{index + 1}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg">{pillar}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Messaging Framework */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 mr-3 text-gray-700" />
                  Messaging Framework
                </h2>
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-3 text-lg">Primary Message</h3>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {brief.results.strategy.messagingFramework.primaryMessage}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Supporting Messages</h3>
                    <div className="space-y-3">
                      {brief.results.strategy.messagingFramework.supportingMessages.map((message, index) => (
                        <div key={index} className="flex items-start">
                          <CheckCircleIconSolid className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-700">{message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Segments */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <UserGroupIcon className="h-6 w-6 mr-3 text-gray-700" />
                  Target Segments
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {brief.results.strategy.targetSegments.map((segment, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">{segment.name}</h3>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                          Segment {index + 1}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">Demographics</p>
                          <p className="text-gray-700">{segment.demographics}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">Psychographics</p>
                          <p className="text-gray-700">{segment.psychographics}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-2">Preferred Channels</p>
                          <div className="flex flex-wrap gap-2">
                            {segment.preferredChannels.map((channel, idx) => (
                              <span key={idx} className="px-3 py-1 bg-gray-50 text-gray-700 text-sm rounded-lg border border-gray-200">
                                {channel}
                              </span>
                            ))}
                          </div>
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
            <div className="space-y-6 animate-fade-in">
              {/* Campaign Filters */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Generated Campaigns</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Filter by:</span>
                  <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500">
                    <option value="">All Platforms</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                  </select>
                </div>
              </div>

              {/* Campaign Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {brief.results.ads.map((campaign, index) => {
                  const PlatformIcon = platformIcons[campaign.platform.toLowerCase()] || GlobeAltIcon;
                  const FormatIcon = formatIcons[campaign.format.toLowerCase()] || PhotoIcon;

                  return (
                    <div 
                      key={index} 
                      className={`
                        bg-white rounded-xl shadow-sm border transition-all cursor-pointer
                        ${selectedCampaign === index 
                          ? 'border-gray-800 shadow-lg' 
                          : 'border-gray-100 hover:border-gray-300 hover:shadow-md'
                        }
                      `}
                      onClick={() => setSelectedCampaign(selectedCampaign === index ? null : index)}
                    >
                      <div className="p-6">
                        {/* Campaign Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{campaign.title}</h3>
                            <div className="flex items-center mt-1 space-x-3 text-sm">
                              <span className="flex items-center text-gray-600">
                                <PlatformIcon className="h-4 w-4 mr-1" />
                                {campaign.platform}
                              </span>
                              <span className="flex items-center text-gray-600">
                                <FormatIcon className="h-4 w-4 mr-1" />
                                {campaign.format}
                              </span>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                            {campaign.targetSegment}
                          </span>
                        </div>

                        {/* Campaign Visual */}
                        {campaign.imageUrl ? (
                          <div className="relative mb-4 rounded-lg overflow-hidden group">
                            <img
                              src={campaign.imageUrl}
                              alt={campaign.title}
                              className="w-full h-64 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                              <button className="opacity-0 group-hover:opacity-100 transition-all bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg font-medium text-gray-900 flex items-center">
                                <EyeIcon className="h-4 w-4 mr-2" />
                                Preview
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-4 h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-sm mb-3">
                                <PhotoIcon className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-500">Image generating...</p>
                              <div className="mt-2">
                                <LoadingSpinner size="sm" />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Campaign Copy Preview */}
                        <div className="space-y-3 mb-4">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Headline</h4>
                            <p className="text-gray-900 font-medium">{campaign.copy.headline}</p>
                          </div>
                          
                          {selectedCampaign === index && (
                            <>
                              <div className="p-4 bg-gray-50 rounded-lg animate-fade-in">
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Body Copy</h4>
                                <p className="text-gray-700">{campaign.copy.body}</p>
                              </div>
                              <div className="p-4 bg-gray-50 rounded-lg animate-fade-in">
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Call to Action</h4>
                                <p className="text-gray-900 font-medium">{campaign.copy.cta}</p>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Export Actions */}
                        <div className="flex space-x-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportCanva(campaign);
                            }}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                          >
                            <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
                            Export to Canva
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportMeta(campaign);
                            }}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all text-sm font-medium"
                          >
                            <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
                            Meta Ads
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assets Tab */}
          {activeTab === 'assets' && (
            <div className="space-y-6 animate-fade-in">
              {/* Download Options */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Download Options</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleDownloadStrategy}
                    className="p-6 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-left group"
                  >
                    <div className="flex items-start">
                      <div className="p-3 bg-gray-100 rounded-lg mr-4 group-hover:bg-gray-200 transition-all">
                        <DocumentDuplicateIcon className="h-6 w-6 text-gray-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Brand Strategy PDF</h3>
                        <p className="text-sm text-gray-600">Complete strategy document with all positioning, messaging, and target segments</p>
                      </div>
                    </div>
                  </button>
                  
                  <button className="p-6 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-left group">
                    <div className="flex items-start">
                      <div className="p-3 bg-gray-100 rounded-lg mr-4 group-hover:bg-gray-200 transition-all">
                        <PhotoIcon className="h-6 w-6 text-gray-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Campaign Assets</h3>
                        <p className="text-sm text-gray-600">All generated images and copy in various formats</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Platform Exports */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Platform Exports</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">Canva Templates</h3>
                      <ArrowTopRightOnSquareIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Edit campaigns in Canva with pre-filled content</p>
                    <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium">
                      Connect Canva
                    </button>
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">Meta Ads Manager</h3>
                      <ArrowTopRightOnSquareIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Import campaigns directly to Facebook & Instagram</p>
                    <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium">
                      Connect Meta
                    </button>
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">Google Ads</h3>
                      <ArrowTopRightOnSquareIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Export search and display campaigns</p>
                    <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium">
                      Coming Soon
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ResultsPage; 