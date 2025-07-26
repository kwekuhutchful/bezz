// User types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  subscription?: Subscription;
  credits: number;
}

export interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  plan: 'starter' | 'pro' | 'enterprise';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

// Brand brief types
export interface BrandBrief {
  id: string;
  userId: string;
  companyName: string;
  sector: string;
  tone: string;
  targetAudience: string;
  language: 'en' | 'fr';
  additionalInfo?: string;
  status: 'processing' | 'completed' | 'failed' | 'strategy_completed';
  createdAt: string;
  updatedAt: string;
  results?: BrandResults;
}

export interface BrandResults {
  brief: ProcessedBrief;
  strategy: BrandStrategy;
  ads: AdCampaign[];
  videoAds?: VideoAd[];
}

export interface ProcessedBrief {
  companyName: string;
  sector: string;
  targetAudience: string;
  brandPersonality: string;
  keyMessages: string[];
  competitiveAdvantages: string[];
  painPoints: string[];
  goals: string[];
}

export interface BrandStrategy {
  positioning: string;
  valueProposition: string;
  brandPillars: string[];
  messagingFramework: {
    primaryMessage: string;
    supportingMessages: string[];
  };
  tonalGuidelines: {
    voice: string;
    personality: string[];
    doAndDonts: {
      do: string[];
      dont: string[];
    };
  };
  targetSegments: TargetSegment[];
}

export interface TargetSegment {
  name: string;
  demographics: string;
  psychographics: string;
  painPoints: string[];
  motivations: string[];
  preferredChannels: string[];
}

export interface AdCampaign {
  id: string;
  title: string;
  format: 'social' | 'display' | 'video' | 'print';
  platform: string;
  copy: {
    headline: string;
    body: string;
    cta: string;
  };
  imagePrompt: string;
  imageUrl?: string;
  targetSegment: string;
  objectives: string[];
}

export interface VideoAd {
  id: string;
  title: string;
  script: string;
  duration: number;
  scenes: VideoScene[];
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface VideoScene {
  id: string;
  duration: number;
  description: string;
  visualPrompt: string;
  voiceover: string;
}

// Form types
export interface BrandBriefForm {
  companyName: string;
  sector: string;
  tone: string;
  targetAudience: string;
  language: 'en' | 'fr';
  additionalInfo?: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: string;
}

// Language types
export type Language = 'en' | 'fr';

export interface LanguageContent {
  [key: string]: {
    en: string;
    fr: string;
  };
} 