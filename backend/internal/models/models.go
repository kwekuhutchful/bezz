package models

import (
	"time"
)

// User represents a user in the system
type User struct {
	ID           string        `json:"id" firestore:"id"`
	Email        string        `json:"email" firestore:"email"`
	DisplayName  string        `json:"displayName,omitempty" firestore:"displayName,omitempty"`
	PhotoURL     string        `json:"photoURL,omitempty" firestore:"photoURL,omitempty"`
	CreatedAt    time.Time     `json:"createdAt" firestore:"createdAt"`
	UpdatedAt    time.Time     `json:"updatedAt" firestore:"updatedAt"`
	Credits      int           `json:"credits" firestore:"credits"`
	Subscription *Subscription `json:"subscription,omitempty" firestore:"subscription,omitempty"`
}

// Subscription represents a user's subscription
type Subscription struct {
	ID                string    `json:"id" firestore:"id"`
	Status            string    `json:"status" firestore:"status"` // active, canceled, past_due, unpaid
	Plan              string    `json:"plan" firestore:"plan"`     // starter, pro, enterprise
	CurrentPeriodEnd  time.Time `json:"currentPeriodEnd" firestore:"currentPeriodEnd"`
	CancelAtPeriodEnd bool      `json:"cancelAtPeriodEnd" firestore:"cancelAtPeriodEnd"`
}

// BrandBrief represents a brand brief submission
type BrandBrief struct {
	ID             string        `json:"id" firestore:"id"`
	UserID         string        `json:"userId" firestore:"userId"`
	CompanyName    string        `json:"companyName" firestore:"companyName"`
	Sector         string        `json:"sector" firestore:"sector"`
	Tone           string        `json:"tone" firestore:"tone"`
	TargetAudience string        `json:"targetAudience" firestore:"targetAudience"`
	Language       string        `json:"language" firestore:"language"` // en, fr
	AdditionalInfo string        `json:"additionalInfo,omitempty" firestore:"additionalInfo,omitempty"`
	Status         string        `json:"status" firestore:"status"` // processing, completed, failed
	CreatedAt      time.Time     `json:"createdAt" firestore:"createdAt"`
	UpdatedAt      time.Time     `json:"updatedAt" firestore:"updatedAt"`
	Results        *BrandResults `json:"results,omitempty" firestore:"results,omitempty"`
}

// BrandResults contains the AI-generated results
type BrandResults struct {
	Brief    ProcessedBrief `json:"brief" firestore:"brief"`
	Strategy BrandStrategy  `json:"strategy" firestore:"strategy"`
	Ads      []AdCampaign   `json:"ads" firestore:"ads"`
	VideoAds []VideoAd      `json:"videoAds,omitempty" firestore:"videoAds,omitempty"`
}

// ProcessedBrief represents the processed brand brief
type ProcessedBrief struct {
	CompanyName           string   `json:"companyName" firestore:"companyName"`
	Sector                string   `json:"sector" firestore:"sector"`
	TargetAudience        string   `json:"targetAudience" firestore:"targetAudience"`
	BrandPersonality      string   `json:"brandPersonality" firestore:"brandPersonality"`
	KeyMessages           []string `json:"keyMessages" firestore:"keyMessages"`
	CompetitiveAdvantages []string `json:"competitiveAdvantages" firestore:"competitiveAdvantages"`
	PainPoints            []string `json:"painPoints" firestore:"painPoints"`
	Goals                 []string `json:"goals" firestore:"goals"`
}

// BrandStrategy represents the brand strategy
type BrandStrategy struct {
	Positioning        string             `json:"positioning" firestore:"positioning"`
	ValueProposition   string             `json:"valueProposition" firestore:"valueProposition"`
	BrandPillars       []string           `json:"brandPillars" firestore:"brandPillars"`
	MessagingFramework MessagingFramework `json:"messagingFramework" firestore:"messagingFramework"`
	TonalGuidelines    TonalGuidelines    `json:"tonalGuidelines" firestore:"tonalGuidelines"`
	TargetSegments     []TargetSegment    `json:"targetSegments" firestore:"targetSegments"`
}

// MessagingFramework represents the messaging framework
type MessagingFramework struct {
	PrimaryMessage     string   `json:"primaryMessage" firestore:"primaryMessage"`
	SupportingMessages []string `json:"supportingMessages" firestore:"supportingMessages"`
}

// TonalGuidelines represents tonal guidelines
type TonalGuidelines struct {
	Voice       string     `json:"voice" firestore:"voice"`
	Personality []string   `json:"personality" firestore:"personality"`
	DoAndDonts  DoAndDonts `json:"doAndDonts" firestore:"doAndDonts"`
}

// DoAndDonts represents do's and don'ts
type DoAndDonts struct {
	Do   []string `json:"do" firestore:"do"`
	Dont []string `json:"dont" firestore:"dont"`
}

// TargetSegment represents a target segment
type TargetSegment struct {
	Name              string   `json:"name" firestore:"name"`
	Role              string   `json:"role" firestore:"role"`
	Demographics      string   `json:"demographics" firestore:"demographics"`
	Psychographics    string   `json:"psychographics" firestore:"psychographics"`
	PainPoints        []string `json:"painPoints" firestore:"painPoints"`
	Motivations       []string `json:"motivations" firestore:"motivations"`
	PreferredChannels []string `json:"preferredChannels" firestore:"preferredChannels"`
}

// AdCampaign represents an advertising campaign
type AdCampaign struct {
	ID            string   `json:"id" firestore:"id"`
	Title         string   `json:"title" firestore:"title"`
	Format        string   `json:"format" firestore:"format"` // social, display, video, print
	Platform      string   `json:"platform" firestore:"platform"`
	Copy          AdCopy   `json:"copy" firestore:"copy"`
	ImagePrompt   string   `json:"imagePrompt" firestore:"imagePrompt"`
	ImageURL      string   `json:"imageUrl,omitempty" firestore:"imageUrl,omitempty"`
	ObjectName    string   `json:"objectName,omitempty" firestore:"objectName,omitempty"` // GCS object name for signed URL generation
	TargetSegment string   `json:"targetSegment" firestore:"targetSegment"`
	Objectives    []string `json:"objectives" firestore:"objectives"`
}

// AdCopy represents ad copy
type AdCopy struct {
	Headline string `json:"headline" firestore:"headline"`
	Body     string `json:"body" firestore:"body"`
	CTA      string `json:"cta" firestore:"cta"`
}

// VideoAd represents a video advertisement
type VideoAd struct {
	ID           string       `json:"id" firestore:"id"`
	Title        string       `json:"title" firestore:"title"`
	Script       string       `json:"script" firestore:"script"`
	Duration     int          `json:"duration" firestore:"duration"`
	Scenes       []VideoScene `json:"scenes" firestore:"scenes"`
	VideoURL     string       `json:"videoUrl,omitempty" firestore:"videoUrl,omitempty"`
	ThumbnailURL string       `json:"thumbnailUrl,omitempty" firestore:"thumbnailUrl,omitempty"`
}

// VideoScene represents a scene in a video ad
type VideoScene struct {
	ID           string `json:"id" firestore:"id"`
	Duration     int    `json:"duration" firestore:"duration"`
	Description  string `json:"description" firestore:"description"`
	VisualPrompt string `json:"visualPrompt" firestore:"visualPrompt"`
	Voiceover    string `json:"voiceover" firestore:"voiceover"`
}

// APIResponse represents a standard API response
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// BrandBriefRequest represents a brand brief creation request
type BrandBriefRequest struct {
	CompanyName    string `json:"companyName" binding:"required"`
	Sector         string `json:"sector" binding:"required"`
	Tone           string `json:"tone" binding:"required"`
	TargetAudience string `json:"targetAudience" binding:"required"`
	Language       string `json:"language" binding:"required,oneof=en fr"`
	AdditionalInfo string `json:"additionalInfo,omitempty"`
}

// Auth request/response models
type SignUpRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password" binding:"required,min=6"`
	DisplayName string `json:"display_name" binding:"required"`
}

type SignInRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RefreshTokenRequest struct {
	Token string `json:"token" binding:"required"`
}

type ResetPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// AI Pipeline Models

// BriefGPTResponse represents the response from Brief-GPT
type BriefGPTResponse struct {
	BrandGoal string `json:"brand_goal"`
	Audience  string `json:"audience"`
	Tone      string `json:"tone"`
	Vision    string `json:"vision"`
}

// StrategistGPTResponse represents the response from Strategist-GPT
type StrategistGPTResponse struct {
	PositioningStatement string                       `json:"positioning_statement"`
	ValueProposition     string                       `json:"value_proposition"`
	BrandPillars         []string                     `json:"brand_pillars"`
	MessagingFramework   StrategistMessagingFramework `json:"messaging_framework"`
	TargetSegments       []StrategistTargetSegment    `json:"target_segments"`
	CampaignAngles       []CampaignAngle              `json:"campaign_angles"`
}

// StrategistMessagingFramework represents messaging framework from Strategist-GPT
type StrategistMessagingFramework struct {
	PrimaryMessage     string   `json:"primary_message"`
	SupportingMessages []string `json:"supporting_messages"`
}

// StrategistTargetSegment represents target segment from Strategist-GPT
type StrategistTargetSegment struct {
	Name              string   `json:"name"`
	Role              string   `json:"role"`
	Demographics      string   `json:"demographics"`
	Psychographics    string   `json:"psychographics"`
	PainPoints        []string `json:"pain_points"`
	PreferredChannels []string `json:"preferred_channels"`
}

// CampaignAngle represents a campaign angle
type CampaignAngle struct {
	Hook      string `json:"hook"`
	Resonance string `json:"resonance"`
}

// CreativeDirectorGPTResponse represents the response from Creative-Director-GPT
type CreativeDirectorGPTResponse struct {
	Ads []AdSpec `json:"ads"`
}

// AdSpec represents an ad specification before image generation
type AdSpec struct {
	ID          int    `json:"id"`
	Headline    string `json:"headline"`
	Body        string `json:"body"`
	DallePrompt string `json:"dalle_prompt"`
}
