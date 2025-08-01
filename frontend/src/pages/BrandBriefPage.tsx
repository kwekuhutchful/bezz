import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthContext } from '@/contexts/AuthContext';
import api, { endpoints } from '@/lib/api';
import { BrandBriefForm } from '@/types';
import { 
  SparklesIcon,
  InformationCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  BuildingOfficeIcon,
  MegaphoneIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  LanguageIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

const BrandBriefPage: React.FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [hoveredTone, setHoveredTone] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    getValues,
    setValue,
  } = useForm<BrandBriefForm>();

  const watchedValues = watch();

  const steps: Step[] = [
    {
      id: 1,
      title: 'Company Details',
      description: 'Tell us about your business',
      icon: BuildingOfficeIcon,
    },
    {
      id: 2,
      title: 'Brand Personality',
      description: 'Define your brand voice',
      icon: MegaphoneIcon,
    },
    {
      id: 3,
      title: 'Target Audience',
      description: 'Describe your ideal customers',
      icon: UserGroupIcon,
    },
    {
      id: 4,
      title: 'Additional Context',
      description: 'Any extra details',
      icon: DocumentTextIcon,
    },
  ];

  const sectors = [
    { name: 'Technology', icon: '💻', description: 'Software, SaaS, Hardware, AI' },
    { name: 'Healthcare', icon: '🏥', description: 'Medical, Wellness, Pharma, Biotech' },
    { name: 'Finance', icon: '💰', description: 'Banking, Fintech, Insurance, Investment' },
    { name: 'E-commerce', icon: '🛒', description: 'Online Retail, Marketplace, Dropshipping' },
    { name: 'Education', icon: '📚', description: 'EdTech, Schools, Training, Courses' },
    { name: 'Food & Beverage', icon: '🍽️', description: 'Restaurants, CPG, Delivery, Catering' },
    { name: 'Fashion', icon: '👗', description: 'Apparel, Accessories, Beauty, Cosmetics' },
    { name: 'Travel', icon: '✈️', description: 'Tourism, Hospitality, Transport, Hotels' },
    { name: 'Real Estate', icon: '🏠', description: 'Property, Construction, Architecture' },
    { name: 'Automotive', icon: '🚗', description: 'Vehicles, Auto Parts, Car Services' },
    { name: 'Entertainment', icon: '🎬', description: 'Media, Gaming, Events, Streaming' },
    { name: 'Sports & Fitness', icon: '⚽', description: 'Gyms, Equipment, Sports Teams' },
    { name: 'Manufacturing', icon: '🏭', description: 'Industrial, Production, Machinery' },
    { name: 'Agriculture', icon: '🌾', description: 'Farming, Food Production, Agtech' },
    { name: 'Energy', icon: '⚡', description: 'Renewable, Oil & Gas, Utilities' },
    { name: 'Telecommunications', icon: '📡', description: 'Internet, Mobile, Networking' },
    { name: 'Legal Services', icon: '⚖️', description: 'Law Firms, Legal Tech, Consulting' },
    { name: 'Marketing & Advertising', icon: '📢', description: 'Agencies, Digital Marketing, PR' },
    { name: 'Consulting', icon: '💼', description: 'Business, Strategy, Management' },
    { name: 'Logistics', icon: '📦', description: 'Shipping, Supply Chain, Warehousing' },
    { name: 'Pet Care', icon: '🐕', description: 'Veterinary, Pet Products, Services' },
    { name: 'Home & Garden', icon: '🏡', description: 'Home Improvement, Landscaping, Decor' },
    { name: 'Arts & Crafts', icon: '🎨', description: 'Art Supplies, Handmade, Creative' },
    { name: 'Non-profit', icon: '🤝', description: 'NGO, Charity, Social Impact, Foundations' },
    { name: 'Government', icon: '🏛️', description: 'Public Sector, Municipal, Federal' },
    { name: 'Other', icon: '🔧', description: 'Other industries not listed above' }
  ];

  const tones = [
    { name: 'Professional', color: 'from-gray-600 to-gray-800', description: 'Formal, authoritative, expert' },
    { name: 'Friendly', color: 'from-yellow-500 to-orange-500', description: 'Warm, approachable, casual' },
    { name: 'Authoritative', color: 'from-blue-800 to-indigo-900', description: 'Expert, commanding, trusted' },
    { name: 'Casual', color: 'from-green-500 to-teal-500', description: 'Relaxed, conversational, easy' },
    { name: 'Luxury', color: 'from-yellow-600 to-yellow-700', description: 'Premium, exclusive, refined' },
    { name: 'Playful', color: 'from-cyan-400 to-yellow-500', description: 'Fun, energetic, creative' },
    { name: 'Inspirational', color: 'from-blue-500 to-cyan-500', description: 'Motivating, uplifting, positive' },
    { name: 'Trustworthy', color: 'from-blue-600 to-blue-800', description: 'Reliable, honest, secure' },
    { name: 'Innovative', color: 'from-cyan-500 to-cyan-600', description: 'Modern, cutting-edge, bold' },
    { name: 'Traditional', color: 'from-amber-600 to-amber-800', description: 'Classic, established, timeless' }
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'French', flag: '🇫🇷' }
  ];

  const [userInitiated, setUserInitiated] = useState(false);

  const onSubmit = async (data: BrandBriefForm) => {
    console.log('Form submitted! Current step:', currentStep, 'Total steps:', steps.length, 'User initiated:', userInitiated);
    
    // Ensure we're on the final step AND user explicitly clicked the button
    if (currentStep !== steps.length) {
      console.log('Form submission prevented: not on final step');
      return;
    }

    if (!userInitiated) {
      console.log('Form submission prevented: not user-initiated');
      return;
    }

    if (!user || user.credits < 1) {
      toast.error('Insufficient credits to create a brief');
      setUserInitiated(false); // Reset the flag
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(endpoints.briefs.create, data);
      const brief = response.data.data;
      
      toast.success('Brand brief created successfully! AI is now crafting your strategy...');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create brief');
    } finally {
      setLoading(false);
      setUserInitiated(false); // Reset the flag
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      setUserInitiated(false); // Reset flag when moving between steps
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setUserInitiated(false); // Reset flag when moving between steps
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getFieldsForStep = (step: number): (keyof BrandBriefForm)[] => {
    switch (step) {
      case 1:
        return ['companyName', 'sector'];
      case 2:
        return ['tone', 'language'];
      case 3:
        return ['targetAudience'];
      case 4:
        return ['additionalInfo'];
      default:
        return [];
    }
  };

  const isStepComplete = (step: number): boolean => {
    const fields = getFieldsForStep(step);
    return fields.every(field => {
      if (field === 'additionalInfo') return true; // Optional field
      return watchedValues[field];
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Your Brand Strategy
            </h1>
            <p className="text-gray-600">
              Answer a few questions and let AI create your complete brand identity
            </p>
          </div>
          
          {/* Credits Display */}
          <div className="text-right">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cyan-50 to-yellow-50 rounded-xl">
              <SparklesIcon className="h-5 w-5 text-cyan-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                {user?.credits || 0} credits available
              </span>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="relative">
          <div className="overflow-hidden rounded-xl bg-gray-100 p-1">
            <div 
              className="h-2 bg-gradient-to-r from-cyan-500 to-yellow-500 rounded-lg transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
          
          {/* Step Indicators */}
          <div className="mt-4 grid grid-cols-4 gap-4">
            {steps.map((step) => (
              <div 
                key={step.id}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg transition-all cursor-pointer
                  ${currentStep === step.id 
                    ? 'bg-gradient-to-r from-cyan-50 to-yellow-50 shadow-sm' 
                    : isStepComplete(step.id)
                    ? 'bg-green-50'
                    : 'bg-white'
                  }
                `}
                onClick={() => {
                  if (step.id < currentStep || isStepComplete(step.id - 1)) {
                    setCurrentStep(step.id);
                  }
                }}
              >
                <div className={`
                  p-2 rounded-lg transition-all
                  ${currentStep === step.id 
                    ? 'bg-gradient-to-br from-cyan-500 to-yellow-500' 
                    : isStepComplete(step.id)
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                  }
                `}>
                  {isStepComplete(step.id) && currentStep !== step.id ? (
                    <CheckIcon className="h-5 w-5 text-white" />
                  ) : (
                    <step.icon className={`h-5 w-5 ${currentStep === step.id || isStepComplete(step.id) ? 'text-white' : 'text-gray-500'}`} />
                  )}
                </div>
                <div className="hidden md:block">
                  <p className={`text-xs font-medium ${currentStep === step.id ? 'text-cyan-700' : 'text-gray-700'}`}>
                    Step {step.id}
                  </p>
                  <p className={`text-sm ${currentStep === step.id ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                    {step.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Credits Warning */}
      {user && user.credits < 1 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Insufficient Credits
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                You need at least 1 credit to create a brand brief. 
              </p>
            </div>
            <button 
              onClick={() => navigate('/profile')}
              className="ml-4 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-all"
            >
              Get Credits
            </button>
          </div>
        </div>
      )}

      {/* Form Content */}
      <form 
        onSubmit={(e) => {
          // Prevent default form submission - only allow manual submission via button
          e.preventDefault();
          console.log('Form onSubmit prevented - use button instead');
        }}
        onKeyDown={(e) => {
          // Prevent Enter key from submitting the form except in textarea
          const target = e.target as HTMLElement;
          if (e.key === 'Enter' && target.tagName !== 'TEXTAREA') {
            e.preventDefault();
          }
        }}
      >
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 animate-fade-in">
          {/* Step 1: Company Details */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-yellow-500 rounded-2xl mb-4">
                  <BuildingOfficeIcon className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's start with your company</h2>
                <p className="text-gray-600">Basic information about your business</p>
              </div>

              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                  What's your company name? *
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
                  className={`
                    w-full px-4 py-3 border rounded-xl text-lg transition-all
                    ${errors.companyName 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }
                  `}
                  placeholder="e.g., TechHub Lagos"
                />
                {errors.companyName && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <InformationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Which industry are you in? *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {sectors.map((sector) => (
                    <label
                      key={sector.name}
                      className="relative cursor-pointer"
                    >
                      <input
                        {...register('sector', {
                          required: 'Please select an industry sector',
                        })}
                        type="radio"
                        value={sector.name}
                        className="sr-only"
                      />
                      <div className={`
                        p-4 rounded-xl border-2 transition-all
                        ${watchedValues.sector === sector.name 
                          ? 'border-blue-500 bg-gradient-to-r from-cyan-50 to-yellow-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }
                      `}>
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{sector.icon}</span>
                          <div>
                            <p className={`font-medium ${watchedValues.sector === sector.name ? 'text-blue-700' : 'text-gray-900'}`}>
                              {sector.name}
                            </p>
                            <p className={`text-xs mt-0.5 ${watchedValues.sector === sector.name ? 'text-blue-600' : 'text-gray-500'}`}>
                              {sector.description}
                            </p>
                          </div>
                        </div>
                        {watchedValues.sector === sector.name && (
                          <div className="absolute top-2 right-2">
                            <CheckIcon className="h-5 w-5 text-blue-600" />
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                {errors.sector && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <InformationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.sector.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Brand Personality */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl mb-4">
                  <MegaphoneIcon className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Define your brand personality</h2>
                <p className="text-gray-600">How should your brand communicate?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Choose your brand tone *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {tones.map((tone) => (
                    <label
                      key={tone.name}
                      className="relative cursor-pointer"
                      onMouseEnter={() => setHoveredTone(tone.name)}
                      onMouseLeave={() => setHoveredTone(null)}
                    >
                      <input
                        {...register('tone', {
                          required: 'Please select a brand tone',
                        })}
                        type="radio"
                        value={tone.name}
                        className="sr-only"
                      />
                      <div className={`
                        p-4 rounded-xl border-2 transition-all
                        ${watchedValues.tone === tone.name 
                          ? 'border-cyan-500 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }
                      `}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`
                              inline-flex px-3 py-1 rounded-full text-xs font-medium text-white mb-2
                              bg-gradient-to-r ${tone.color}
                            `}>
                              {tone.name}
                            </div>
                            <p className="text-sm text-gray-600">
                              {tone.description}
                            </p>
                          </div>
                          {watchedValues.tone === tone.name && (
                            <CheckIcon className="h-5 w-5 text-cyan-600 flex-shrink-0 ml-2" />
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.tone && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <InformationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.tone.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Primary language for content *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {languages.map((lang) => (
                    <label key={lang.code} className="relative cursor-pointer">
                      <input
                        {...register('language', {
                          required: 'Please select a language',
                        })}
                        type="radio"
                        value={lang.code}
                        className="sr-only"
                      />
                      <div className={`
                        p-4 rounded-xl border-2 transition-all text-center
                        ${watchedValues.language === lang.code 
                          ? 'border-cyan-500 bg-gradient-to-r from-yellow-50 to-yellow-100 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }
                      `}>
                        <span className="text-3xl mb-2 block">{lang.flag}</span>
                        <p className={`font-medium ${watchedValues.language === lang.code ? 'text-cyan-700' : 'text-gray-900'}`}>
                          {lang.name}
                        </p>
                        {watchedValues.language === lang.code && (
                          <div className="absolute top-2 right-2">
                            <CheckIcon className="h-5 w-5 text-cyan-600" />
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                {errors.language && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <InformationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.language.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Target Audience */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl mb-4">
                  <UserGroupIcon className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Who's your target audience?</h2>
                <p className="text-gray-600">Help us understand your ideal customers</p>
              </div>

              <div>
                <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your ideal customers *
                </label>
                
                {/* Example Cards */}
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 bg-gradient-to-r from-cyan-50 to-yellow-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-1">Example 1:</p>
                    <p className="text-sm text-blue-700">
                      "Young professionals aged 25-35 in urban African cities who value convenience and modern technology. They have disposable income and prefer mobile-first solutions."
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-900 mb-1">Example 2:</p>
                    <p className="text-sm text-green-700">
                      "Small business owners in West Africa who need affordable tools to manage their operations. They're tech-savvy but cost-conscious."
                    </p>
                  </div>
                </div>

                <textarea
                  {...register('targetAudience', {
                    required: 'Target audience description is required',
                    minLength: {
                      value: 20,
                      message: 'Please provide a more detailed description (at least 20 characters)',
                    },
                  })}
                  rows={5}
                  className={`
                    w-full px-4 py-3 border rounded-xl transition-all
                    ${errors.targetAudience 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                    }
                  `}
                  placeholder="Describe demographics, interests, pain points, behaviors, location, and what motivates them..."
                  onKeyDown={(e) => {
                    // Prevent Enter from submitting the form, but allow new lines in textarea
                    if (e.key === 'Enter') {
                      e.stopPropagation(); // Prevent event from bubbling up to form
                    }
                  }}
                />
                {errors.targetAudience && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <InformationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.targetAudience.message}
                  </p>
                )}
                
                <div className="mt-3 flex items-start space-x-2">
                  <LightBulbIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-600">
                    <strong>Tips:</strong> Include age range, location, interests, challenges they face, 
                    and what solutions they're looking for. The more specific, the better!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Additional Context */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-slide-up">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl mb-4">
                  <DocumentTextIcon className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Any additional context?</h2>
                <p className="text-gray-600">Optional details to make your brand even better</p>
              </div>

              <div>
                <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional information (optional)
                </label>
                
                {/* Suggestion Prompts */}
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500">Consider mentioning:</span>
                                  {['Competitors', 'Unique selling points', 'Brand values', 'Goals', 'Challenges'].map((prompt) => (
                  <span
                    key={prompt}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 cursor-pointer hover:bg-gray-200 transition-all"
                    onClick={() => {
                      const currentValue = getValues('additionalInfo') || '';
                      const newValue = currentValue + (currentValue ? '\n\n' : '') + `${prompt}: `;
                      setValue('additionalInfo', newValue);
                      // Focus the textarea
                      const textarea = document.getElementById('additionalInfo') as HTMLTextAreaElement;
                      if (textarea) {
                        textarea.focus();
                        // Move cursor to end
                        setTimeout(() => {
                          textarea.setSelectionRange(newValue.length, newValue.length);
                        }, 0);
                      }
                    }}
                  >
                    {prompt}
                  </span>
                ))}
                </div>

                <textarea
                  id="additionalInfo"
                  {...register('additionalInfo')}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="Tell us about your competitors, what makes you unique, your goals, or any specific requirements for your brand..."
                  onKeyDown={(e) => {
                    // Prevent Enter from submitting the form, but allow new lines in textarea
                    if (e.key === 'Enter') {
                      e.stopPropagation(); // Prevent event from bubbling up to form
                    }
                  }}
                />
                
                <p className="mt-2 text-sm text-gray-500">
                  This helps our AI create more personalized and relevant brand strategies
                </p>
              </div>

              {/* Preview Summary */}
              <div className="mt-8 p-6 bg-gradient-to-r from-cyan-50 to-yellow-50 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <SparklesIcon className="h-5 w-5 text-cyan-600 mr-2" />
                  Your Brand Brief Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Company</p>
                      <p className="text-sm text-gray-900">{watchedValues.companyName || 'Not specified'} • {watchedValues.sector || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MegaphoneIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Brand Voice</p>
                      <p className="text-sm text-gray-900">
                        {watchedValues.tone || 'Not specified'} • {watchedValues.language === 'en' ? 'English' : watchedValues.language === 'fr' ? 'French' : 'Not specified'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Target Audience</p>
                      <p className="text-sm text-gray-900 line-clamp-2">
                        {watchedValues.targetAudience || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* What You'll Get Section (visible on last step) */}
        {currentStep === steps.length && (
          <div className="bg-gradient-to-r from-cyan-500 to-yellow-500 rounded-2xl p-8 mb-8 text-white animate-scale-in">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <RocketLaunchIcon className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-xl font-bold mb-3">
                  What you'll receive in 2-3 minutes:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Complete brand positioning & strategy</span>
                    </li>
                    <li className="flex items-start">
                      <CheckIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">3 detailed customer personas</span>
                    </li>
                    <li className="flex items-start">
                      <CheckIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Brand voice & messaging guidelines</span>
                    </li>
                  </ul>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">6+ ready-to-use ad campaigns</span>
                    </li>
                    <li className="flex items-start">
                      <CheckIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Custom visuals for each platform</span>
                    </li>
                    <li className="flex items-start">
                      <CheckIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Export to Canva & Meta Ads</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-4 flex items-center">
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  <span className="font-medium">Cost: 1 credit only</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={prevStep}
            className={`
              inline-flex items-center px-6 py-3 rounded-xl font-medium transition-all
              ${currentStep === 1 
                ? 'invisible' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Previous
          </button>

          <div className="flex items-center space-x-4">
            {/* Step Counter */}
            <span className="text-sm text-gray-500">
              Step {currentStep} of {steps.length}
            </span>

            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-yellow-500 text-white font-medium rounded-xl hover:shadow-lg transform hover:scale-105 transition-all"
              >
                Next Step
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  console.log('User clicked submit button');
                  setUserInitiated(true);
                  // Trigger form submission manually
                  handleSubmit(onSubmit)();
                }}
                disabled={loading || !user || user.credits < 1}
                className={`
                  inline-flex items-center px-8 py-3 font-medium rounded-xl transition-all
                  ${loading || !user || user.credits < 1
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-yellow-500 text-white hover:shadow-lg transform hover:scale-105'
                  }
                `}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating Your Brand...
                  </>
                ) : (
                  <>
                    <RocketLaunchIcon className="h-5 w-5 mr-2" />
                    Generate My Brand Strategy
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default BrandBriefPage; 