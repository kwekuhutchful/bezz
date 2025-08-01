import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { endpoints, briefAPI } from '@/lib/api';
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
  ArrowPathIcon,
  PhotoIcon,
  VideoCameraIcon,
  NewspaperIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  BuildingOfficeIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  TagIcon,
  ChevronRightIcon,
  FolderIcon,
  PaperClipIcon
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
  const [expandedSegment, setExpandedSegment] = useState<number | null>(null);
  const [previewModal, setPreviewModal] = useState<{isOpen: boolean, campaign: any} | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>('');

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

  const refreshImageURLs = async () => {
    if (!brief?.id) return;
    
    try {
      toast.loading('Refreshing image URLs...', { id: 'refresh-images' });
      const response = await briefAPI.refreshImageURLs(brief.id);
      setBrief(response.data);
      toast.success('Image URLs refreshed successfully!', { id: 'refresh-images' });
    } catch (error) {
      toast.error('Failed to refresh image URLs', { id: 'refresh-images' });
    }
  };

  const handleExportCanva = (campaign: any) => {
    // Create Canva-compatible data structure
    const canvaData = {
      title: campaign.title,
      headline: campaign.copy.headline,
      body: campaign.copy.body,
      cta: campaign.copy.cta,
      image: campaign.imageUrl,
      platform: campaign.platform,
      format: campaign.format
    };
    
    // For now, copy to clipboard (would normally integrate with Canva API)
    navigator.clipboard.writeText(JSON.stringify(canvaData, null, 2));
    toast.success('Campaign data copied to clipboard - Ready for Canva integration!');
    // TODO: Implement actual Canva API integration
  };

  const handleExportMeta = (campaign: any) => {
    // Create Meta Ads compatible structure
    const metaData = {
      campaign_name: campaign.title,
      ad_creative: {
        headline: campaign.copy.headline,
        body: campaign.copy.body,
        call_to_action: campaign.copy.cta,
        image_url: campaign.imageUrl
      },
      targeting: {
        audience: campaign.targetSegment,
        platform: campaign.platform
      }
    };
    
    // For now, copy to clipboard (would normally use Meta Marketing API)
    navigator.clipboard.writeText(JSON.stringify(metaData, null, 2));
    toast.success('Campaign data copied to clipboard - Ready for Meta Ads Manager!');
    // TODO: Implement actual Meta Marketing API integration
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const handleDownloadStrategy = () => {
    if (!brief?.results?.strategy) {
      toast.error('Strategy not available for download');
      return;
    }
    
    // Create downloadable content
    const strategyContent = `
BRAND STRATEGY REPORT
Company: ${brief.companyName}
Generated: ${new Date().toLocaleDateString()}

POSITIONING STATEMENT
${brief.results.strategy.positioning || 'Not available'}

VALUE PROPOSITION
${brief.results.strategy.valueProposition || 'Not available'}

BRAND PILLARS
${brief.results.strategy.brandPillars?.join('\n• ') || 'Not available'}

MESSAGING FRAMEWORK
Primary Message: ${brief.results.strategy.messagingFramework?.primaryMessage || 'Not available'}

Supporting Messages:
${brief.results.strategy.messagingFramework?.supportingMessages?.map(msg => `• ${msg}`).join('\n') || 'Not available'}

TARGET SEGMENTS
${brief.results.strategy.targetSegments?.map((segment, i) => 
  `${i + 1}. ${segment.name}
     Demographics: ${segment.demographics}
     Psychographics: ${segment.psychographics}
     Pain Points: ${segment.painPoints?.join(', ')}
     Preferred Channels: ${segment.preferredChannels?.join(', ')}`
).join('\n\n') || 'Not available'}
    `;
    
    // Create and download file
    const blob = new Blob([strategyContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brief.companyName.replace(/[^a-z0-9]/gi, '_')}_brand_strategy.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Brand strategy downloaded!');
  };

  const handlePreviewCampaign = (campaign: any) => {
    setPreviewModal({ isOpen: true, campaign });
  };

  const handleToggleCampaignDetails = (index: number) => {
    setSelectedCampaign(selectedCampaign === index ? null : index);
  };

  const handleExportAll = () => {
    const campaigns = filteredCampaigns;
    toast.success(`Exporting ${campaigns.length} campaigns...`);
    // TODO: Implement bulk export
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

  // Filter campaigns by platform
  const filteredCampaigns = brief?.results?.ads?.filter(campaign => 
    !platformFilter || campaign.platform.toLowerCase() === platformFilter.toLowerCase()
  ) || [];

  // Handle ESC key for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewModal?.isOpen) {
        setPreviewModal(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [previewModal?.isOpen]);

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

  // Create safe data structure with fallbacks
  const safeResults = {
    strategy: brief.results?.strategy || {
      positioning: "Strategy being generated...",
      valueProposition: "Value proposition being developed...",
      brandPillars: [],
      messagingFramework: {
        primaryMessage: "Primary message being crafted...",
        supportingMessages: []
      },
      targetSegments: []
    },
    ads: brief.results?.ads || [],
    brief: brief.results?.brief || {}
  };

  const tabs = [
    { id: 'overview' as TabType, name: 'Overview', icon: SparklesIcon, description: 'Executive summary' },
    { id: 'strategy' as TabType, name: 'Brand Strategy', icon: LightBulbIcon, description: 'Core positioning' },
    { id: 'campaigns' as TabType, name: 'Campaigns', icon: MegaphoneIcon, description: `${safeResults.ads.length} ready`, count: safeResults.ads.length },
    { id: 'assets' as TabType, name: 'Assets', icon: ArrowDownTrayIcon, description: 'Download & export' }
  ];

  // Calculate completion progress
  const completionSteps = [
    { name: 'Brief Analysis', completed: true },
    { name: 'Strategy Development', completed: brief.status === 'completed' },
    { name: 'Campaign Creation', completed: brief.status === 'completed' },
    { name: 'Asset Generation', completed: brief.status === 'completed' && safeResults.ads.some(ad => ad.imageUrl) }
  ];

  const completedSteps = completionSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / completionSteps.length) * 100;

  // Show loading state if results aren't ready yet
  if (!brief.results && brief.status === 'processing') {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Generating Your Brand Strategy...</h2>
          <p className="text-gray-600">Our AI is crafting your positioning, messaging, and target segments.</p>
        </div>
      </div>
    );
  }

  // Show error state if processing failed
  if (brief.status === 'failed') {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Strategy Generation Failed</h2>
          <p className="text-gray-600 mb-4">There was an error generating your brand strategy.</p>
          <button
            onClick={() => navigate('/brief')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create New Brief
          </button>
        </div>
      </div>
    );
  }

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



      {/* Simplified Tab Navigation */}
      {brief.status === 'completed' && brief.results && (
        <>
          <div className="mb-8 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-3 px-1 border-b-2 font-medium text-sm transition-all
                    ${activeTab === tab.id 
                      ? 'border-gray-900 text-gray-900' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <tab.icon className={`h-4 w-4 mr-2 ${activeTab === tab.id ? 'text-gray-900' : 'text-gray-400'}`} />
                    {tab.name}
                    {tab.count && tab.count > 0 && (
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        activeTab === tab.id 
                          ? 'bg-gray-900 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              {/* Executive Summary - Two primary cards matching strategy style */}
              <div className="space-y-4">
                {/* Brand Positioning */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="border-l-4 border-blue-500 pl-6 pr-8 py-6">
                    <div className="flex items-center mb-3">
                      <div className="p-1.5 bg-blue-100 rounded-lg mr-3">
                        <RocketLaunchIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Brand Positioning</h2>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-base">
                      {safeResults.strategy.positioning}
                    </p>
                  </div>
                </div>

                {/* Value Proposition */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="border-l-4 border-cyan-500 pl-6 pr-8 py-6">
                    <div className="flex items-center mb-3">
                      <div className="p-1.5 bg-cyan-100 rounded-lg mr-3">
                        <StarIcon className="h-4 w-4 text-cyan-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Value Proposition</h2>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-base">
                      {safeResults.strategy.valueProposition}
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Metrics - Clean cards with color accents */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Strategy Components</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 transition-all">
                    <div className="flex items-center mb-3">
                      <div className="p-1.5 bg-indigo-100 rounded">
                        <UserGroupIcon className="h-3.5 w-3.5 text-indigo-600" />
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900 mb-1">
                      {safeResults.strategy.targetSegments.length}
                    </p>
                    <p className="text-xs text-gray-600">Target Segments</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-cyan-50 hover:border-cyan-200 transition-all">
                    <div className="flex items-center mb-3">
                      <div className="p-1.5 bg-cyan-100 rounded">
                        <MegaphoneIcon className="h-3.5 w-3.5 text-cyan-600" />
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900 mb-1">
                      {safeResults.ads.length}
                    </p>
                    <p className="text-xs text-gray-600">Ad Campaigns</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-emerald-50 hover:border-emerald-200 transition-all">
                    <div className="flex items-center mb-3">
                      <div className="p-1.5 bg-emerald-100 rounded">
                        <HeartIcon className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900 mb-1">
                      {safeResults.strategy.brandPillars.length}
                    </p>
                    <p className="text-xs text-gray-600">Brand Pillars</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-amber-50 hover:border-amber-200 transition-all">
                    <div className="flex items-center mb-3">
                      <div className="p-1.5 bg-amber-100 rounded">
                        <ChatBubbleLeftRightIcon className="h-3.5 w-3.5 text-amber-600" />
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900 mb-1">
                      {safeResults.strategy.messagingFramework.supportingMessages.length + 1}
                    </p>
                    <p className="text-xs text-gray-600">Key Messages</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions - Subtle with color accents */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Explore Your Strategy</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setActiveTab('strategy')}
                    className="group p-4 rounded-lg hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="flex items-start">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <LightBulbIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">Brand Strategy</h4>
                        <p className="text-xs text-gray-600 mt-1">Positioning & messaging</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('campaigns')}
                    className="group p-4 rounded-lg hover:bg-cyan-50 transition-all text-left"
                  >
                    <div className="flex items-start">
                      <div className="p-2 bg-cyan-100 rounded-lg group-hover:bg-cyan-200 transition-colors">
                        <MegaphoneIcon className="h-4 w-4 text-cyan-600" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">Ad Campaigns</h4>
                        <p className="text-xs text-gray-600 mt-1">Ready-to-use concepts</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('assets')}
                    className="group p-4 rounded-lg hover:bg-green-50 transition-all text-left"
                  >
                    <div className="flex items-start">
                      <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <ArrowDownTrayIcon className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">Export Assets</h4>
                        <p className="text-xs text-gray-600 mt-1">Download & share</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Strategy Tab */}
          {activeTab === 'strategy' && (
            <div className="space-y-8 animate-fade-in">
              {/* Brand Positioning - Primary focus with blue accent */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="border-l-4 border-blue-500 pl-6 pr-8 py-6">
                  <div className="flex items-center mb-3">
                    <div className="p-1.5 bg-blue-100 rounded-lg mr-3">
                      <RocketLaunchIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Brand Positioning</h2>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-base">
                    {safeResults.strategy.positioning}
                  </p>
                </div>
              </div>

              {/* Value Proposition - Secondary with cyan accent */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="border-l-4 border-cyan-500 pl-6 pr-8 py-6">
                  <div className="flex items-center mb-3">
                    <div className="p-1.5 bg-cyan-100 rounded-lg mr-3">
                      <StarIcon className="h-4 w-4 text-cyan-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Value Proposition</h2>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-base">
                    {safeResults.strategy.valueProposition}
                  </p>
                </div>
              </div>

              {/* Brand Pillars - Grid with emerald accents */}
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                  <div className="p-1.5 bg-emerald-100 rounded-lg mr-3">
                    <HeartIcon className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Brand Pillars</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {safeResults.strategy.brandPillars.map((pillar, index) => (
                    <div key={index} className="group">
                      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:bg-emerald-50 hover:border-emerald-200 transition-all">
                        <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full border-2 border-emerald-200 mb-4 group-hover:border-emerald-300">
                          <span className="text-sm font-bold text-emerald-600">{index + 1}</span>
                        </div>
                        <h3 className="font-medium text-gray-900">{pillar}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Messaging Framework - Clean list with amber accent */}
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                  <div className="p-1.5 bg-amber-100 rounded-lg mr-3">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 text-amber-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Messaging Framework</h2>
                </div>
                <div className="space-y-4">
                  <div className="border-l-2 border-amber-200 pl-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Primary Message</h3>
                    <p className="text-gray-900 leading-relaxed">
                      {safeResults.strategy.messagingFramework.primaryMessage}
                    </p>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Supporting Messages</h3>
                    <div className="space-y-2">
                      {safeResults.strategy.messagingFramework.supportingMessages.map((message, index) => (
                        <div key={index} className="flex items-start pl-4">
                          <CheckCircleIconSolid className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-700 text-sm">{message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Segments - Always-expanded cards with indigo accent */}
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                  <div className="p-1.5 bg-indigo-100 rounded-lg mr-3">
                    <UserGroupIcon className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Target Segments</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {safeResults.strategy.targetSegments.map((segment, index) => (
                    <div 
                      key={index} 
                      className="bg-gradient-to-br from-cyan-50 to-yellow-50 border border-indigo-200 rounded-lg p-6 hover:shadow-lg transition-all"
                    >
                      {/* Segment Header */}
                      <div className="flex items-center mb-4">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full mr-3"></div>
                        <h3 className="text-lg font-semibold text-gray-900">{segment.name}</h3>
                      </div>

                      {/* Segment Details */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="bg-white/80 rounded-lg p-4 border border-indigo-100">
                            <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-2">Demographics</p>
                            <p className="text-sm text-gray-800 leading-relaxed">{segment.demographics}</p>
                          </div>
                          <div className="bg-white/80 rounded-lg p-4 border border-indigo-100">
                            <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-2">Psychographics</p>
                            <p className="text-sm text-gray-800 leading-relaxed">{segment.psychographics}</p>
                          </div>
                        </div>

                        {segment.painPoints && segment.painPoints.length > 0 && (
                          <div className="bg-white/80 rounded-lg p-4 border border-indigo-100">
                            <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-3">Pain Points</p>
                            <div className="space-y-2">
                              {segment.painPoints.map((pain, idx) => (
                                <div key={idx} className="flex items-start">
                                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                                  <p className="text-sm text-gray-800">{pain}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="bg-white/80 rounded-lg p-4 border border-indigo-100">
                          <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-3">Preferred Channels</p>
                          <div className="flex flex-wrap gap-2">
                            {segment.preferredChannels.map((channel, idx) => (
                              <span key={idx} className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full border border-indigo-200">
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
              {/* Campaign Header */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Ad Campaigns</h2>
                    <p className="text-sm text-gray-600 mt-1">{filteredCampaigns.length} ready-to-use campaigns {platformFilter ? `for ${platformFilter}` : 'generated'}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <select 
                      value={platformFilter}
                      onChange={(e) => setPlatformFilter(e.target.value)}
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      <option value="">All Platforms</option>
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="linkedin">LinkedIn</option>
                    </select>
                    <button 
                      onClick={refreshImageURLs}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center gap-2"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                      Refresh Images
                    </button>
                    <button 
                      onClick={handleExportAll}
                      className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg text-sm font-medium hover:bg-cyan-200 transition-colors"
                    >
                      Export All ({filteredCampaigns.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Campaign Cards - Grid layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCampaigns.map((campaign, index) => {
                  const PlatformIcon = platformIcons[campaign.platform.toLowerCase()] || GlobeAltIcon;
                  const FormatIcon = formatIcons[campaign.format.toLowerCase()] || PhotoIcon;

                  return (
                    <div 
                      key={index} 
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-cyan-200 hover:shadow-lg transition-all group"
                    >
                      <div className="p-4">
                        {/* Campaign Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="p-1.5 bg-cyan-100 rounded">
                                <PlatformIcon className="h-3.5 w-3.5 text-cyan-600" />
                              </div>
                              <div className="p-1.5 bg-gray-100 rounded">
                                <FormatIcon className="h-3.5 w-3.5 text-gray-600" />
                              </div>
                            </div>
                            <h3 className="font-medium text-gray-900">{campaign.title}</h3>
                            <p className="text-xs text-gray-500 mt-1">{campaign.platform} • {campaign.format}</p>
                          </div>
                          <span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 text-xs font-medium rounded-md">
                            {campaign.targetSegment}
                          </span>
                        </div>

                        {/* Campaign Visual */}
                        {campaign.imageUrl ? (
                          <div className="relative mb-4 rounded-lg overflow-hidden">
                            <img
                              src={campaign.imageUrl}
                              alt={campaign.title}
                              className="w-full h-48 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                              <button 
                                onClick={() => handlePreviewCampaign(campaign)}
                                className="opacity-0 group-hover:opacity-100 transition-all bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg font-medium text-gray-900 flex items-center hover:bg-white text-sm"
                              >
                                <EyeIcon className="h-4 w-4 mr-1.5" />
                                Preview
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-4 h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-sm mb-2">
                                <PhotoIcon className="h-6 w-6 text-gray-400" />
                              </div>
                              <p className="text-xs text-gray-500">Image generating...</p>
                              <div className="mt-1">
                                <LoadingSpinner size="sm" />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Campaign Copy Preview */}
                        <div className="space-y-2 mb-4">
                          <div className="p-3 bg-gray-50 rounded-md">
                            <h4 className="text-xs font-medium text-gray-600 mb-1">Headline</h4>
                            <p className="text-sm text-gray-900 font-medium line-clamp-2">{campaign.copy.headline}</p>
                          </div>
                          
                          {selectedCampaign === index && (
                            <>
                              <div className="p-3 bg-gray-50 rounded-md animate-fade-in">
                                <h4 className="text-xs font-medium text-gray-600 mb-1">Body Copy</h4>
                                <p className="text-sm text-gray-700">{campaign.copy.body}</p>
                              </div>
                              <div className="p-3 bg-gray-50 rounded-md animate-fade-in">
                                <h4 className="text-xs font-medium text-gray-600 mb-1">Call to Action</h4>
                                <p className="text-sm text-gray-900 font-medium">{campaign.copy.cta}</p>
                              </div>
                            </>
                          )}
                          
                          {/* Toggle Details Button */}
                          <button
                            onClick={() => handleToggleCampaignDetails(index)}
                            className="w-full py-1.5 text-xs text-cyan-600 hover:text-cyan-700 font-medium transition-colors flex items-center justify-center"
                          >
                            {selectedCampaign === index ? (
                              <>
                                <ChevronUpIcon className="h-3.5 w-3.5 mr-1" />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDownIcon className="h-3.5 w-3.5 mr-1" />
                                Show More
                              </>
                            )}
                          </button>
                        </div>

                        {/* Export Actions */}
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportCanva(campaign);
                            }}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-xs font-medium"
                          >
                            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 mr-1.5" />
                            Canva
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportMeta(campaign);
                            }}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all text-xs font-medium"
                          >
                            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 mr-1.5" />
                            Meta
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
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                  <div className="p-1.5 bg-green-100 rounded-lg mr-3">
                    <ArrowDownTrayIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Export Options</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleDownloadStrategy}
                    className="group p-6 bg-gray-50 rounded-lg hover:bg-green-50 transition-all text-left"
                  >
                    <div className="flex items-start">
                      <div className="p-2 bg-white rounded-lg mr-4 border border-gray-200 group-hover:border-green-200">
                        <DocumentDuplicateIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">Brand Strategy PDF</h3>
                        <p className="text-xs text-gray-600">Complete positioning & messaging guide</p>
                      </div>
                    </div>
                  </button>
                  
                  <button className="group p-6 bg-gray-50 rounded-lg hover:bg-green-50 transition-all text-left">
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

      {/* Preview Modal */}
      {previewModal?.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Campaign Preview</h2>
                <button
                  onClick={() => setPreviewModal(null)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Campaign Visual */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{previewModal.campaign.title}</h3>
                  {previewModal.campaign.imageUrl ? (
                    <img
                      src={previewModal.campaign.imageUrl}
                      alt={previewModal.campaign.title}
                      className="w-full rounded-lg shadow-sm"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Image generating...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Campaign Details */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="px-3 py-1 bg-cyan-50 text-cyan-700 text-sm font-medium rounded-full">
                        {previewModal.campaign.platform}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                        {previewModal.campaign.format}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Target: {previewModal.campaign.targetSegment}</p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Headline</h4>
                    <p className="text-lg font-semibold text-gray-900">{previewModal.campaign.copy.headline}</p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Body Copy</h4>
                    <p className="text-gray-700">{previewModal.campaign.copy.body}</p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Call to Action</h4>
                    <p className="text-gray-900 font-medium">{previewModal.campaign.copy.cta}</p>
                  </div>
                  
                  {/* Preview Actions */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        handleExportCanva(previewModal.campaign);
                        setPreviewModal(null);
                      }}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium"
                    >
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
                      Export to Canva
                    </button>
                    <button
                      onClick={() => {
                        handleExportMeta(previewModal.campaign);
                        setPreviewModal(null);
                      }}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all font-medium"
                    >
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
                      Meta Ads
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsPage; 