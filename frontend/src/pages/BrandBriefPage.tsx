import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthContext } from '@/contexts/AuthContext';
import { api, endpoints } from '@/lib/api';
import { BrandBriefForm } from '@/types';
import { 
  SparklesIcon,
  InformationCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const BrandBriefPage: React.FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BrandBriefForm>();

  const onSubmit = async (data: BrandBriefForm) => {
    if (!user || user.credits < 1) {
      toast.error('Insufficient credits to create a brief');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(endpoints.createBrief, data);
      const brief = response.data.data;
      
      toast.success('Brand brief created successfully! Processing has started.');
      navigate(`/results/${brief.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create brief');
    } finally {
      setLoading(false);
    }
  };

  const sectors = [
    'Technology',
    'Healthcare',
    'Finance',
    'E-commerce',
    'Education',
    'Food & Beverage',
    'Fashion',
    'Travel',
    'Real Estate',
    'Automotive',
    'Entertainment',
    'Non-profit',
    'Other'
  ];

  const tones = [
    'Professional',
    'Friendly',
    'Authoritative',
    'Casual',
    'Luxury',
    'Playful',
    'Inspirational',
    'Trustworthy',
    'Innovative',
    'Traditional'
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create Brand Brief
        </h1>
        <p className="text-gray-600">
          Tell us about your brand and we'll generate a comprehensive strategy and campaign ideas
        </p>
      </div>

      {/* Credits Warning */}
      {user && user.credits < 1 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Insufficient Credits
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                You need at least 1 credit to create a brand brief. 
                <button 
                  onClick={() => navigate('/profile')}
                  className="ml-1 font-medium underline hover:no-underline"
                >
                  Get more credits
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Company Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Company Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="companyName" className="label">
                  Company Name *
                </label>
                <input
                  {...register('companyName', {
                    required: 'Company name is required',
                    minLength: {
                      value: 2,
                      message: 'Company name must be at least 2 characters',
                    },
                  })}
                  type="text"
                  className={`input ${errors.companyName ? 'input-error' : ''}`}
                  placeholder="Enter your company name"
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="sector" className="label">
                  Industry Sector *
                </label>
                <select
                  {...register('sector', {
                    required: 'Please select an industry sector',
                  })}
                  className={`input ${errors.sector ? 'input-error' : ''}`}
                >
                  <option value="">Select your industry</option>
                  {sectors.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector}
                    </option>
                  ))}
                </select>
                {errors.sector && (
                  <p className="mt-1 text-sm text-red-600">{errors.sector.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Brand Personality */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Brand Personality
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="tone" className="label">
                  Brand Tone *
                </label>
                <select
                  {...register('tone', {
                    required: 'Please select a brand tone',
                  })}
                  className={`input ${errors.tone ? 'input-error' : ''}`}
                >
                  <option value="">Select brand tone</option>
                  {tones.map((tone) => (
                    <option key={tone} value={tone}>
                      {tone}
                    </option>
                  ))}
                </select>
                {errors.tone && (
                  <p className="mt-1 text-sm text-red-600">{errors.tone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="language" className="label">
                  Primary Language *
                </label>
                <select
                  {...register('language', {
                    required: 'Please select a language',
                  })}
                  className={`input ${errors.language ? 'input-error' : ''}`}
                >
                  <option value="">Select language</option>
                  <option value="en">English</option>
                  <option value="fr">French</option>
                </select>
                {errors.language && (
                  <p className="mt-1 text-sm text-red-600">{errors.language.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Target Audience
            </h2>
            
            <div>
              <label htmlFor="targetAudience" className="label">
                Describe Your Target Audience *
              </label>
              <textarea
                {...register('targetAudience', {
                  required: 'Target audience description is required',
                  minLength: {
                    value: 20,
                    message: 'Please provide a more detailed description (at least 20 characters)',
                  },
                })}
                rows={4}
                className={`input ${errors.targetAudience ? 'input-error' : ''}`}
                placeholder="Describe your ideal customers: demographics, interests, pain points, behaviors, etc."
              />
              {errors.targetAudience && (
                <p className="mt-1 text-sm text-red-600">{errors.targetAudience.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Be specific about age, location, interests, and challenges your audience faces
              </p>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Additional Information
            </h2>
            
            <div>
              <label htmlFor="additionalInfo" className="label">
                Additional Context (Optional)
              </label>
              <textarea
                {...register('additionalInfo')}
                rows={4}
                className="input"
                placeholder="Any additional information about your brand, competitors, goals, or specific requirements..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Include information about competitors, unique selling points, current challenges, or specific goals
              </p>
            </div>
          </div>

          {/* Credit Cost Info */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-start">
              <SparklesIcon className="h-5 w-5 text-primary-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-primary-800">
                  What You'll Get
                </h3>
                <ul className="mt-2 text-sm text-primary-700 space-y-1">
                  <li>• Comprehensive brand strategy and positioning</li>
                  <li>• Target audience analysis and segmentation</li>
                  <li>• 6+ AI-generated advertising campaigns</li>
                  <li>• Custom visuals and copy for each platform</li>
                  <li>• Export-ready formats for Canva and Meta Ads</li>
                </ul>
                <p className="mt-2 text-sm font-medium text-primary-800">
                  Cost: 1 credit • Processing time: 2-3 minutes
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || (user && user.credits < 1)}
              className="btn btn-primary btn-lg inline-flex items-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating Brief...
                </>
              ) : (
                <>
                  Generate Brand Strategy
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrandBriefPage; 