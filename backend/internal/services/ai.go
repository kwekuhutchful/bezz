package services

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"cloud.google.com/go/storage"

	openai "github.com/openai/openai-go/v2"
	"github.com/openai/openai-go/v2/shared"

	bezzmodels "bezz-backend/internal/models"
	"bezz-backend/internal/prompts"
)

// ModelCaps defines the capabilities and constraints of different AI models
type ModelCaps struct {
	SupportsSampling        bool // temperature/top_p/n presence/frequency penalties
	UsesMaxCompletionTokens bool // uses max_completion_tokens instead of max_tokens
	ForImages               bool // model is for image generation
}

// Model capability matrix - defines what each model supports
var modelCapabilities = map[string]ModelCaps{
	// GPT-5 family - beta-limited models; require max_completion_tokens on Chat Completions
	string(shared.ChatModelGPT5): {SupportsSampling: false, UsesMaxCompletionTokens: true, ForImages: false},
	"gpt-5-mini":                 {SupportsSampling: false, UsesMaxCompletionTokens: true, ForImages: false},
	"o4-mini":                    {SupportsSampling: false, UsesMaxCompletionTokens: true, ForImages: false},
	"o3-mini":                    {SupportsSampling: false, UsesMaxCompletionTokens: true, ForImages: false},
	"gpt-5-nano":                 {SupportsSampling: false, UsesMaxCompletionTokens: true, ForImages: false},

	// Legacy models - support full parameter control (official SDK)
	"gpt-4":              {SupportsSampling: true, UsesMaxCompletionTokens: false, ForImages: false},
	"gpt-4-1106-preview": {SupportsSampling: true, UsesMaxCompletionTokens: false, ForImages: false},
	"gpt-4o":             {SupportsSampling: true, UsesMaxCompletionTokens: false, ForImages: false},
	"gpt-3.5-turbo":      {SupportsSampling: true, UsesMaxCompletionTokens: false, ForImages: false},

	// Image models (official SDK)
	"gpt-image-1": {SupportsSampling: false, UsesMaxCompletionTokens: false, ForImages: true},
	"dall-e-3":    {SupportsSampling: false, UsesMaxCompletionTokens: false, ForImages: true},
	"dall-e-2":    {SupportsSampling: false, UsesMaxCompletionTokens: false, ForImages: true},
}

// ChatParams holds parameters for chat completion requests
type ChatParams struct {
	Model               string
	Messages            []openai.ChatCompletionMessageParamUnion
	MaxTokens           int
	MaxCompletionTokens int
	Temperature         *float64
	TopP                *float64
	N                   *int
	PresencePenalty     *float64
	FrequencyPenalty    *float64
}

// sanitizeParams adjusts parameters based on model capabilities
func sanitizeParams(model string, params *ChatParams) {
	caps, exists := modelCapabilities[model]
	if !exists {
		log.Printf("⚠️ AI PIPELINE: Unknown model %s, assuming legacy capabilities", model)
		caps = ModelCaps{SupportsSampling: true, UsesMaxCompletionTokens: false, ForImages: false}
	}

	log.Printf("🔧 AI PIPELINE: Sanitizing params for model %s (sampling: %t, completion_tokens: %t)",
		model, caps.SupportsSampling, caps.UsesMaxCompletionTokens)

	// Handle token limits
	if caps.UsesMaxCompletionTokens {
		if params.MaxTokens > 0 {
			params.MaxCompletionTokens = params.MaxTokens
			params.MaxTokens = 0 // Clear deprecated field
			log.Printf("🔧 AI PIPELINE: Converted max_tokens (%d) to max_completion_tokens for %s",
				params.MaxCompletionTokens, model)
		}
	} else {
		// Legacy models don't use MaxCompletionTokens
		params.MaxCompletionTokens = 0
	}

	// Handle sampling parameters for beta-limited models
	if !caps.SupportsSampling {
		if params.Temperature != nil {
			log.Printf("🔧 AI PIPELINE: Removing temperature (%.2f) for beta-limited model %s", *params.Temperature, model)
			params.Temperature = nil
		}
		if params.TopP != nil {
			log.Printf("🔧 AI PIPELINE: Removing top_p (%.2f) for beta-limited model %s", *params.TopP, model)
			params.TopP = nil
		}
		if params.N != nil {
			log.Printf("🔧 AI PIPELINE: Removing n (%d) for beta-limited model %s", *params.N, model)
			params.N = nil
		}
		if params.PresencePenalty != nil {
			log.Printf("🔧 AI PIPELINE: Removing presence_penalty (%.2f) for beta-limited model %s", *params.PresencePenalty, model)
			params.PresencePenalty = nil
		}
		if params.FrequencyPenalty != nil {
			log.Printf("🔧 AI PIPELINE: Removing frequency_penalty (%.2f) for beta-limited model %s", *params.FrequencyPenalty, model)
			params.FrequencyPenalty = nil
		}
	}
}

// createChatCompletionRequest creates a sanitized OpenAI chat completion request
func (s *AIService) createChatCompletionRequest(ctx context.Context, params ChatParams) (*openai.ChatCompletion, error) {
	// Sanitize parameters based on model capabilities
	sanitizeParams(params.Model, &params)

	// Build the request with only supported parameters
	requestParams := openai.ChatCompletionNewParams{
		Messages: params.Messages,
		Model:    shared.ChatModel(params.Model),
	}

	// Add token limits
	if params.MaxTokens > 0 {
		requestParams.MaxTokens = openai.Int(int64(params.MaxTokens))
	}
	if params.MaxCompletionTokens > 0 {
		requestParams.MaxCompletionTokens = openai.Int(int64(params.MaxCompletionTokens))
	}

	// Add sampling parameters if supported
	if params.Temperature != nil {
		requestParams.Temperature = openai.Float(*params.Temperature)
	}
	if params.TopP != nil {
		requestParams.TopP = openai.Float(*params.TopP)
	}
	if params.N != nil {
		requestParams.N = openai.Int(int64(*params.N))
	}
	if params.PresencePenalty != nil {
		requestParams.PresencePenalty = openai.Float(*params.PresencePenalty)
	}
	if params.FrequencyPenalty != nil {
		requestParams.FrequencyPenalty = openai.Float(*params.FrequencyPenalty)
	}

	log.Printf("🤖 AI PIPELINE: Making chat completion request to %s", params.Model)

	resp, err := s.client.Chat.Completions.New(ctx, requestParams)
	if err != nil {
		log.Printf("❌ AI PIPELINE: Chat completion failed for model %s: %v", params.Model, err)
		return resp, err
	}

	// Log response details for debugging
	if len(resp.Choices) == 0 {
		log.Printf("⚠️ AI PIPELINE: No choices returned from %s", params.Model)
	} else {
		contentLength := len(resp.Choices[0].Message.Content)
		log.Printf("✅ AI PIPELINE: Received response from %s (content length: %d)", params.Model, contentLength)
		if contentLength == 0 {
			log.Printf("⚠️ AI PIPELINE: Empty content returned from %s", params.Model)
		}
	}

	return resp, nil
}

// extractJSON attempts to extract a valid JSON object or array from a raw string
func extractJSON(raw string) string {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return trimmed
	}
	startObj := strings.Index(trimmed, "{")
	endObj := strings.LastIndex(trimmed, "}")
	startArr := strings.Index(trimmed, "[")
	endArr := strings.LastIndex(trimmed, "]")

	best := trimmed
	if startObj != -1 && endObj != -1 && endObj > startObj {
		best = strings.TrimSpace(trimmed[startObj : endObj+1])
	}
	if startArr != -1 && endArr != -1 && endArr > startArr {
		candidate := strings.TrimSpace(trimmed[startArr : endArr+1])
		// prefer the longer candidate if both exist
		if len(candidate) > len(best) {
			best = candidate
		}
	}
	return best
}

// chatJSONWithFallback sends chat messages and tries models in order until JSON parses into out
func (s *AIService) chatJSONWithFallback(
	ctx context.Context,
	messages []openai.ChatCompletionMessageParamUnion,
	maxTokens int,
	temperature *float64,
	out any,
) (string, string, error) {
	models := s.getModelWithFallback()
	var lastErr error
	for _, model := range models {
		log.Printf("🤖 AI PIPELINE: Trying model: %s", model)
		params := ChatParams{
			Model:       model,
			Messages:    messages,
			MaxTokens:   maxTokens,
			Temperature: temperature,
		}
		resp, err := s.createChatCompletionRequest(ctx, params)
		if err != nil {
			lastErr = err
			continue
		}
		if len(resp.Choices) == 0 {
			lastErr = fmt.Errorf("no response from %s", model)
			continue
		}
		content := strings.TrimSpace(resp.Choices[0].Message.Content)
		if content == "" {
			lastErr = fmt.Errorf("empty content from %s", model)
			continue
		}
		clean := extractJSON(content)
		if err := json.Unmarshal([]byte(clean), out); err != nil {
			lastErr = fmt.Errorf("failed to parse JSON from %s: %w", model, err)
			continue
		}
		return model, clean, nil
	}
	return "", "", lastErr
}

// AIService handles AI-related operations
type AIService struct {
	client        *openai.Client
	storageClient *storage.Client
	bucketName    string
}

// getBestTextModel returns the best available text completion model
func (s *AIService) getBestTextModel() string {
	// Use GPT-5 Mini as primary
	return "gpt-5-mini"
}

// getModelWithFallback attempts to use the preferred model, with fallback options
func (s *AIService) getModelWithFallback() []string {
	return []string{
		"gpt-5-mini",    // Primary: lightweight GPT-5 variant
		"o4-mini",       // First fallback: optimized mini model
		"gpt-4",         // Stable and proven
		"gpt-3.5-turbo", // Fast and reliable
	}
}

// NewAIService creates a new AI service
func NewAIService(client *openai.Client, storageClient *storage.Client, bucketName string) *AIService {
	return &AIService{
		client:        client,
		storageClient: storageClient,
		bucketName:    bucketName,
	}
}

// ProcessBriefWithGPT processes a brand brief using Brief-GPT with fallback models
func (s *AIService) ProcessBriefWithGPT(ctx context.Context, brief *bezzmodels.BrandBrief) (*bezzmodels.BriefGPTResponse, error) {
	prompt := fmt.Sprintf(prompts.BriefGPTPrompt,
		brief.CompanyName,
		brief.BusinessDescription,
		brief.Sector,
		brief.TargetAudience,
		brief.Tone,
		brief.Language,
		brief.AdditionalInfo,
	)

	// Unified fallback JSON call
	temperature := float64(0.3)
	var briefResponse bezzmodels.BriefGPTResponse
	model, content, err := s.chatJSONWithFallback(ctx, []openai.ChatCompletionMessageParamUnion{
		openai.SystemMessage("You are Brief-GPT, an expert at structuring brand information. Always respond with valid JSON only."),
		openai.UserMessage(prompt),
	}, 800, &temperature, &briefResponse)
	if err != nil {
		return nil, fmt.Errorf("Brief-GPT processing failed: %w", err)
	}
	log.Printf("✅ AI PIPELINE: Brief-GPT succeeded with model %s", model)
	_ = content // already parsed; keep for potential future logging
	return &briefResponse, nil
}

// GenerateStrategyWithGPT generates brand strategy using Strategist-GPT with fallback models
func (s *AIService) GenerateStrategyWithGPT(ctx context.Context, briefSummary *bezzmodels.BriefGPTResponse) (*bezzmodels.StrategistGPTResponse, error) {
	// Convert brief summary to JSON string for the prompt
	briefJSON, err := json.Marshal(briefSummary)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal brief summary: %w", err)
	}

	prompt := fmt.Sprintf(prompts.StrategistGPTPrompt, string(briefJSON))

	// Unified fallback JSON call
	temperature := float64(0.4)
	strategyResponse := &bezzmodels.StrategistGPTResponse{}
	modelUsed, content, err := s.chatJSONWithFallback(ctx, []openai.ChatCompletionMessageParamUnion{
		openai.SystemMessage("You are Strategist-GPT, an expert brand strategist. Always respond with valid JSON only."),
		openai.UserMessage(prompt),
	}, 2000, &temperature, strategyResponse)
	if err != nil {
		return nil, fmt.Errorf("Strategist-GPT processing failed: %w", err)
	}
	log.Printf("✅ AI PIPELINE: Strategist-GPT succeeded with model %s", modelUsed)
	_ = content
	return strategyResponse, nil
}

// ProcessBriefPipeline executes the complete Brief-GPT -> Strategist-GPT pipeline
func (s *AIService) ProcessBriefPipeline(ctx context.Context, brief *bezzmodels.BrandBrief) (*bezzmodels.BrandStrategy, error) {
	// Step 1: Process brief with Brief-GPT
	briefSummary, err := s.ProcessBriefWithGPT(ctx, brief)
	if err != nil {
		return nil, fmt.Errorf("Brief-GPT processing failed: %w", err)
	}

	// Step 2: Generate strategy with Strategist-GPT
	strategyResponse, err := s.GenerateStrategyWithGPT(ctx, briefSummary)
	if err != nil {
		return nil, fmt.Errorf("Strategist-GPT processing failed: %w", err)
	}

	// Step 3: Convert to bezzmodels.BrandStrategy format
	strategy := &bezzmodels.BrandStrategy{
		Positioning:      strategyResponse.PositioningStatement,
		ValueProposition: strategyResponse.ValueProposition,
		Tagline:          strategyResponse.Tagline,
		BrandPillars:     strategyResponse.BrandPillars,
		MessagingFramework: bezzmodels.MessagingFramework{
			PrimaryMessage:     strategyResponse.MessagingFramework.PrimaryMessage,
			SupportingMessages: strategyResponse.MessagingFramework.SupportingMessages,
		},
		TargetSegments: s.convertTargetSegments(strategyResponse.TargetSegments),
	}

	return strategy, nil
}

// convertTargetSegments converts StrategistGPT target segments to bezzmodels format
func (s *AIService) convertTargetSegments(segments []bezzmodels.StrategistTargetSegment) []bezzmodels.TargetSegment {
	result := make([]bezzmodels.TargetSegment, len(segments))
	for i, seg := range segments {
		result[i] = bezzmodels.TargetSegment{
			Name:              seg.Name,
			Role:              seg.Role,
			Demographics:      seg.Demographics,
			Psychographics:    seg.Psychographics,
			PainPoints:        seg.PainPoints,
			PreferredChannels: seg.PreferredChannels,
			Motivations:       []string{}, // Can be populated from other sources
		}
	}
	return result
}

// GenerateBrandStrategy generates a complete brand strategy from a brief
func (s *AIService) GenerateBrandStrategy(ctx context.Context, brief *bezzmodels.BrandBrief) (*bezzmodels.BrandResults, error) {
	// Step 1: Process the brief
	processedBrief, err := s.processBrief(ctx, brief)
	if err != nil {
		return nil, fmt.Errorf("failed to process brief: %w", err)
	}

	// Step 2: Generate strategy
	strategy, err := s.generateStrategy(ctx, brief, processedBrief)
	if err != nil {
		return nil, fmt.Errorf("failed to generate strategy: %w", err)
	}

	// Step 3: Generate ad campaigns
	ads, err := s.generateAdCampaigns(ctx, brief, processedBrief, strategy)
	if err != nil {
		return nil, fmt.Errorf("failed to generate ad campaigns: %w", err)
	}

	// Step 4: Generate images for ads (TODO: Implement DALL-E integration)
	for i := range ads {
		// TODO: Call DALL-E API to generate images
		ads[i].ImageURL = "" // Placeholder
	}

	return &bezzmodels.BrandResults{
		Brief:    *processedBrief,
		Strategy: *strategy,
		Ads:      ads,
		VideoAds: []bezzmodels.VideoAd{}, // TODO: Implement video generation
	}, nil
}

// processBrief processes the raw brief into structured data
func (s *AIService) processBrief(ctx context.Context, brief *bezzmodels.BrandBrief) (*bezzmodels.ProcessedBrief, error) {
	prompt := fmt.Sprintf(`
You are a brand strategist. Analyze the following brand brief and extract key insights:

Company: %s
Sector: %s
Target Audience: %s
Tone: %s
Additional Info: %s
Language: %s

Please provide a JSON response with the following structure:
{
  "companyName": "%s",
  "sector": "%s",
  "targetAudience": "%s",
  "brandPersonality": "string describing the brand personality",
  "keyMessages": ["array", "of", "key", "messages"],
  "competitiveAdvantages": ["array", "of", "advantages"],
  "painPoints": ["array", "of", "customer", "pain", "points"],
  "goals": ["array", "of", "brand", "goals"]
}

Respond only with valid JSON.`,
		brief.CompanyName, brief.Sector, brief.TargetAudience, brief.Tone, brief.AdditionalInfo, brief.Language,
		brief.CompanyName, brief.Sector, brief.TargetAudience)

	// Create parameters with desired settings
	temperature := float64(0.7)
	params := ChatParams{
		Model: s.getBestTextModel(),
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage("You are an expert brand strategist. Always respond with valid JSON."),
			openai.UserMessage(prompt),
		},
		MaxTokens:   1000,
		Temperature: &temperature,
	}

	resp, err := s.createChatCompletionRequest(ctx, params)

	if err != nil {
		return nil, err
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from OpenAI")
	}

	var processedBrief bezzmodels.ProcessedBrief
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &processedBrief); err != nil {
		log.Printf("Failed to parse AI response: %s", resp.Choices[0].Message.Content)
		return nil, fmt.Errorf("failed to parse AI response: %w", err)
	}

	return &processedBrief, nil
}

// generateStrategy generates a brand strategy
func (s *AIService) generateStrategy(ctx context.Context, brief *bezzmodels.BrandBrief, processedBrief *bezzmodels.ProcessedBrief) (*bezzmodels.BrandStrategy, error) {
	prompt := fmt.Sprintf(`
Based on the following brand information, create a comprehensive brand strategy:

Company: %s
Sector: %s
Target Audience: %s
Brand Personality: %s
Key Messages: %v
Competitive Advantages: %v
Pain Points: %v
Goals: %v

Create a JSON response with this structure:
{
  "positioning": "brand positioning statement",
  "valueProposition": "clear value proposition",
  "brandPillars": ["pillar1", "pillar2", "pillar3"],
  "messagingFramework": {
    "primaryMessage": "main message",
    "supportingMessages": ["supporting1", "supporting2", "supporting3"]
  },
  "tonalGuidelines": {
    "voice": "brand voice description",
    "personality": ["trait1", "trait2", "trait3"],
    "doAndDonts": {
      "do": ["do1", "do2", "do3"],
      "dont": ["dont1", "dont2", "dont3"]
    }
  },
  "targetSegments": [
    {
      "name": "Segment Name",
      "demographics": "demographic description",
      "psychographics": "psychographic description",
      "painPoints": ["pain1", "pain2"],
      "motivations": ["motivation1", "motivation2"],
      "preferredChannels": ["channel1", "channel2"]
    }
  ]
}

Respond only with valid JSON.`,
		processedBrief.CompanyName, processedBrief.Sector, processedBrief.TargetAudience,
		processedBrief.BrandPersonality, processedBrief.KeyMessages, processedBrief.CompetitiveAdvantages,
		processedBrief.PainPoints, processedBrief.Goals)

	// Create parameters with desired settings
	temperature := float64(0.7)
	params := ChatParams{
		Model: s.getBestTextModel(),
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage("You are an expert brand strategist. Always respond with valid JSON."),
			openai.UserMessage(prompt),
		},
		MaxTokens:   2000,
		Temperature: &temperature,
	}

	resp, err := s.createChatCompletionRequest(ctx, params)

	if err != nil {
		return nil, err
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from OpenAI")
	}

	var strategy bezzmodels.BrandStrategy
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &strategy); err != nil {
		log.Printf("Failed to parse AI response: %s", resp.Choices[0].Message.Content)
		return nil, fmt.Errorf("failed to parse AI response: %w", err)
	}

	return &strategy, nil
}

// generateAdCampaigns generates advertising campaigns
func (s *AIService) generateAdCampaigns(ctx context.Context, brief *bezzmodels.BrandBrief, processedBrief *bezzmodels.ProcessedBrief, strategy *bezzmodels.BrandStrategy) ([]bezzmodels.AdCampaign, error) {
	prompt := fmt.Sprintf(`
Create 6 diverse advertising campaigns for the following brand:

Company: %s
Positioning: %s
Value Proposition: %s
Target Segments: %v
Tonal Guidelines: %v

Create campaigns for different platforms (Facebook, Instagram, Google Ads, LinkedIn, TikTok, YouTube).

Respond with JSON array of campaigns:
[
  {
    "id": "unique_id",
    "title": "Campaign Title",
    "format": "social|display|video|print",
    "platform": "Platform Name",
    "copy": {
      "headline": "Compelling headline",
      "body": "Engaging body text",
      "cta": "Call to action"
    },
    "imagePrompt": "Detailed prompt for DALL-E image generation",
    "targetSegment": "Target segment name",
    "objectives": ["objective1", "objective2"]
  }
]

Respond only with valid JSON array.`,
		processedBrief.CompanyName, strategy.Positioning, strategy.ValueProposition,
		strategy.TargetSegments, strategy.TonalGuidelines)

	// Create parameters with desired settings
	temperature := float64(0.8)
	params := ChatParams{
		Model: s.getBestTextModel(),
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage("You are an expert creative director. Always respond with valid JSON."),
			openai.UserMessage(prompt),
		},
		MaxTokens:   3000,
		Temperature: &temperature,
	}

	resp, err := s.createChatCompletionRequest(ctx, params)

	if err != nil {
		return nil, err
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from OpenAI")
	}

	var campaigns []bezzmodels.AdCampaign
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &campaigns); err != nil {
		log.Printf("Failed to parse AI response: %s", resp.Choices[0].Message.Content)
		return nil, fmt.Errorf("failed to parse AI response: %w", err)
	}

	return campaigns, nil
}

// GenerateImage generates an image using the best available model (gpt-image-1 with DALL-E 3 fallback)
func (s *AIService) GenerateImage(ctx context.Context, prompt string) (string, error) {
	// Use the generateImage method which handles gpt-image-1 with fallback
	return s.generateImage(ctx, prompt)
}

// ModerateContent checks content for policy violations
func (s *AIService) ModerateContent(ctx context.Context, content string) (bool, error) {
	params := openai.ModerationNewParams{
		Input: openai.ModerationNewParamsInputUnion{
			OfString: openai.String(content),
		},
	}

	resp, err := s.client.Moderations.New(ctx, params)

	if err != nil {
		return false, err
	}

	if len(resp.Results) == 0 {
		return true, nil
	}

	return !resp.Results[0].Flagged, nil
}

// GenerateAds calls Creative-Director-GPT to generate ad specifications
func (s *AIService) GenerateAds(ctx context.Context, strategy *bezzmodels.BrandStrategy, identity *bezzmodels.BrandIdentity) (*bezzmodels.CreativeDirectorGPTResponse, error) {
	log.Printf("🎨 AI PIPELINE: Starting Creative-Director-GPT for ad generation")

	// Convert strategy to JSON string for the prompt
	strategyJSON, err := json.Marshal(strategy)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal strategy: %w", err)
	}

	// Include brand identity (logo concept and color palette) to drive visual consistency in ads
	identityJSON := "{}"
	if identity != nil {
		if b, err := json.Marshal(identity); err == nil {
			identityJSON = string(b)
		}
	}

	prompt := fmt.Sprintf(prompts.CreativeDirectorGPTPrompt, string(strategyJSON), identityJSON)

	// Create parameters with desired settings (used via unified helper)
	temperature := float64(0.7)

	var response bezzmodels.CreativeDirectorGPTResponse
	modelUsed, content, err := s.chatJSONWithFallback(ctx, []openai.ChatCompletionMessageParamUnion{
		openai.SystemMessage("You are Creative-Director-GPT, an expert at creating compelling ad copy and visual concepts. Always respond with valid JSON only."),
		openai.UserMessage(prompt),
	}, 2000, &temperature, &response)
	if err != nil {
		log.Printf("❌ AI PIPELINE: Creative-Director-GPT API call failed: %v", err)
		return nil, fmt.Errorf("Creative-Director-GPT API call failed: %w", err)
	}

	log.Printf("🎨 AI PIPELINE: Creative-Director-GPT raw response: %s", content)
	log.Printf("✅ AI PIPELINE: Generated %d ad specifications using %s", len(response.Ads), modelUsed)
	return &response, nil
}

// RenderImages takes AdSpecs and returns AdCampaigns with image URLs
func (s *AIService) RenderImages(ctx context.Context, adSpecs []bezzmodels.AdSpec, companyName string, sector string) ([]bezzmodels.AdCampaign, error) {
	log.Printf("🖼️ AI PIPELINE: Starting gpt-image-1 image generation for %d ads (DALL-E 3 fallback)", len(adSpecs))

	var wg sync.WaitGroup
	results := make([]bezzmodels.AdCampaign, len(adSpecs))
	errors := make([]error, len(adSpecs))

	// Generate images concurrently
	for i, spec := range adSpecs {
		wg.Add(1)
		go func(index int, adSpec bezzmodels.AdSpec) {
			defer wg.Done()

			campaign, err := s.generateSingleAd(ctx, adSpec, companyName, sector)
			if err != nil {
				log.Printf("❌ AI PIPELINE: Failed to generate ad %d: %v", adSpec.ID, err)
				errors[index] = err
				// Create a campaign without image on failure
				campaign = &bezzmodels.AdCampaign{
					ID:            fmt.Sprintf("ad_%d_%d", adSpec.ID, time.Now().Unix()),
					Title:         fmt.Sprintf("Ad Campaign %d", adSpec.ID),
					Format:        "social",
					Platform:      "facebook",
					TargetSegment: "Primary Audience",
					Copy: bezzmodels.AdCopy{
						Headline: adSpec.Headline,
						Body:     adSpec.Body,
						CTA:      "Learn More",
					},
					ImagePrompt: adSpec.DallePrompt,
					Objectives:  []string{"Brand Awareness", "Engagement"},
				}
			}
			results[index] = *campaign
		}(i, spec)
	}

	wg.Wait()

	// Check for critical errors - require ALL images to succeed for completion
	successCount := 0
	for _, err := range errors {
		if err == nil {
			successCount++
		}
	}

	log.Printf("🖼️ AI PIPELINE: Generated %d/%d images successfully", successCount, len(adSpecs))

	// Require ALL images to succeed for the pipeline to be considered complete
	if successCount < len(adSpecs) {
		return nil, fmt.Errorf("image generation incomplete: only %d/%d images generated successfully", successCount, len(adSpecs))
	}

	return results, nil
}

// generateSingleAd generates a single ad with image
func (s *AIService) generateSingleAd(ctx context.Context, spec bezzmodels.AdSpec, companyName string, sector string) (*bezzmodels.AdCampaign, error) {
	const maxRetries = 2
	var lastErr error

	for attempt := 0; attempt <= maxRetries; attempt++ {
		if attempt > 0 {
			log.Printf("🔄 AI PIPELINE: Retrying image generation for ad %d (attempt %d/%d)", spec.ID, attempt+1, maxRetries+1)
			time.Sleep(time.Duration(attempt) * 2 * time.Second) // Exponential backoff
		}

		// Enhance DALL-E prompt for realism
		enhancedPrompt := s.enhancePromptForRealism(spec.DallePrompt, companyName, sector)

		// Log enhanced prompts for analysis
		log.Printf("🎨 ORIGINAL DALL-E PROMPT: %s", spec.DallePrompt)
		log.Printf("🎨 ENHANCED DALL-E PROMPT: %s", enhancedPrompt)
		log.Printf("📊 PROMPT VALIDATION: %t", s.validateRealisticPrompt(enhancedPrompt))

		// Generate image with enhanced prompt
		imageURL, err := s.generateImage(ctx, enhancedPrompt)
		if err != nil {
			lastErr = err
			continue
		}

		// Upload to GCS
		objectName := fmt.Sprintf("ads/%s_ad_%d_%d", companyName, spec.ID, time.Now().Unix())
		gcsURL, err := s.uploadImageToGCS(ctx, imageURL, objectName)
		if err != nil {
			log.Printf("⚠️ AI PIPELINE: GCS upload failed, using direct URL: %v", err)
			gcsURL = imageURL // Fallback to direct URL
			objectName = ""   // Clear object name if upload failed
		}

		// Create AdCampaign
		campaign := &bezzmodels.AdCampaign{
			ID:            fmt.Sprintf("ad_%d_%d", spec.ID, time.Now().Unix()),
			Title:         fmt.Sprintf("Ad Campaign %d", spec.ID),
			Format:        "social",
			Platform:      "facebook",
			TargetSegment: "Primary Audience",
			Copy: bezzmodels.AdCopy{
				Headline: spec.Headline,
				Body:     spec.Body,
				CTA:      "Learn More",
			},
			ImagePrompt: spec.DallePrompt,
			ImageURL:    gcsURL,
			ObjectName:  objectName, // Store the actual object name
			Objectives:  []string{"Brand Awareness", "Engagement"},
		}

		log.Printf("✅ AI PIPELINE: Successfully generated ad %d with image", spec.ID)
		return campaign, nil
	}

	return nil, fmt.Errorf("failed to generate ad after %d attempts: %w", maxRetries+1, lastErr)
}

// generateImage generates an image using the best available model
func (s *AIService) generateImage(ctx context.Context, prompt string) (string, error) {
	log.Printf("🎨 AI PIPELINE: Generating image with gpt-image-1: %.100s...", prompt)

	// Try gpt-image-1 first (OpenAI's latest image model)
	imageURL, err := s.generateImageWithGPTImage1(ctx, prompt)
	if err != nil {
		log.Printf("⚠️ AI PIPELINE: gpt-image-1 generation failed, falling back to DALL-E 3: %v", err)
		return s.generateImageWithDALLE(ctx, prompt)
	}

	log.Printf("✅ AI PIPELINE: Image generated successfully with gpt-image-1: %s", imageURL)
	return imageURL, nil
}

// generateImageWithGPTImage1 generates an image using the official SDK with gpt-image-1 model
func (s *AIService) generateImageWithGPTImage1(ctx context.Context, prompt string) (string, error) {
	log.Printf("🎨 AI PIPELINE: Using gpt-image-1 model for image generation")

	params := openai.ImageGenerateParams{
		Model:  openai.ImageModel("gpt-image-1"), // Use the new gpt-image-1 model
		Prompt: prompt,
		Size:   openai.ImageGenerateParamsSize("1024x1024"),
		N:      openai.Int(int64(1)),
	}

	resp, err := s.client.Images.Generate(ctx, params)

	if err != nil {
		log.Printf("❌ AI PIPELINE: gpt-image-1 API call failed: %v", err)
		return "", fmt.Errorf("gpt-image-1 API call failed: %w", err)
	}

	if len(resp.Data) == 0 {
		return "", fmt.Errorf("no image generated by gpt-image-1")
	}

	data := resp.Data[0]
	if data.URL != "" {
		log.Printf("✅ AI PIPELINE: Image generated successfully with gpt-image-1: %s", data.URL)
		return data.URL, nil
	}

	if data.B64JSON != "" {
		imgBytes, decErr := decodeBase64Image(data.B64JSON)
		if decErr != nil {
			return "", fmt.Errorf("failed to decode base64 image: %w", decErr)
		}
		objectName := fmt.Sprintf("generated/%d", time.Now().Unix())
		signedURL, upErr := s.uploadImageBytesToGCS(ctx, imgBytes, objectName)
		if upErr != nil {
			return "", upErr
		}
		log.Printf("✅ AI PIPELINE: Image (b64) uploaded to GCS: %s", signedURL)
		return signedURL, nil
	}

	return "", fmt.Errorf("gpt-image-1 returned neither URL nor base64 data")
}

// uploadImageBytesToGCS uploads raw image bytes to GCS and returns a signed URL
func (s *AIService) uploadImageBytesToGCS(ctx context.Context, imageData []byte, objectName string) (string, error) {
	bucket := s.storageClient.Bucket(s.bucketName)
	obj := bucket.Object(objectName + ".png")

	writer := obj.NewWriter(ctx)
	writer.ContentType = "image/png"

	if _, err := io.Copy(writer, bytes.NewReader(imageData)); err != nil {
		writer.Close()
		return "", fmt.Errorf("failed to write to GCS: %w", err)
	}

	if err := writer.Close(); err != nil {
		return "", fmt.Errorf("failed to close GCS writer: %w", err)
	}

	signedURL, err := s.GenerateSignedURL(ctx, objectName+".png")
	if err != nil {
		return "", fmt.Errorf("failed to generate signed URL: %w", err)
	}

	return signedURL, nil
}

// decodeBase64Image decodes a base64-encoded image string
func decodeBase64Image(s string) ([]byte, error) {
	// Strip data URL header if present
	if idx := strings.Index(s, ","); idx != -1 && strings.Contains(strings.ToLower(s[:idx]), "base64") {
		s = s[idx+1:]
	}
	return base64.StdEncoding.DecodeString(s)
}

// generateImageWithDALLE generates an image using DALL-E 3 (fallback)
func (s *AIService) generateImageWithDALLE(ctx context.Context, prompt string) (string, error) {
	log.Printf("🎨 AI PIPELINE: Falling back to DALL-E 3 for image generation")

	params := openai.ImageGenerateParams{
		Model:  openai.ImageModel("dall-e-3"),
		Prompt: prompt,
		Size:   openai.ImageGenerateParamsSize("1024x1024"),
		N:      openai.Int(int64(1)),
	}

	resp, err := s.client.Images.Generate(ctx, params)

	if err != nil {
		log.Printf("❌ AI PIPELINE: DALL-E 3 API call failed: %v", err)
		return "", fmt.Errorf("DALL-E 3 API call failed: %w", err)
	}

	if len(resp.Data) == 0 {
		return "", fmt.Errorf("no image generated by DALL-E 3")
	}

	imageURL := resp.Data[0].URL
	log.Printf("✅ AI PIPELINE: Image generated successfully with DALL-E 3: %s", imageURL)
	return imageURL, nil
}

// uploadImageToGCS uploads an image to Google Cloud Storage and returns a signed URL
func (s *AIService) uploadImageToGCS(ctx context.Context, imageURL, objectName string) (string, error) {
	log.Printf("☁️ AI PIPELINE: Uploading image to GCS: %s", objectName)

	if imageURL == "" {
		return "", fmt.Errorf("failed to download image: empty URL")
	}
	// If already a GCS URL, don't re-upload
	if strings.Contains(imageURL, "storage.googleapis.com") {
		return imageURL, nil
	}

	// Download image from URL
	resp, err := http.Get(imageURL)
	if err != nil {
		return "", fmt.Errorf("failed to download image: %w", err)
	}
	defer resp.Body.Close()

	imageData, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read image data: %w", err)
	}

	// Upload to GCS
	bucket := s.storageClient.Bucket(s.bucketName)
	obj := bucket.Object(objectName + ".png")

	writer := obj.NewWriter(ctx)
	writer.ContentType = "image/png"

	if _, err := io.Copy(writer, bytes.NewReader(imageData)); err != nil {
		writer.Close()
		return "", fmt.Errorf("failed to write to GCS: %w", err)
	}

	if err := writer.Close(); err != nil {
		return "", fmt.Errorf("failed to close GCS writer: %w", err)
	}

	// Generate signed URL (valid for 24 hours)
	signedURL, err := s.GenerateSignedURL(ctx, objectName+".png")
	if err != nil {
		log.Printf("⚠️ AI PIPELINE: Failed to generate signed URL, using fallback: %v", err)
		return imageURL, err // Fallback to direct OpenAI URL
	}

	log.Printf("✅ AI PIPELINE: Image uploaded to GCS with signed URL")
	return signedURL, nil
}

// GenerateSignedURL creates a signed URL for private GCS objects
func (s *AIService) GenerateSignedURL(ctx context.Context, objectName string) (string, error) {
	opts := &storage.SignedURLOptions{
		Scheme:  storage.SigningSchemeV4,
		Method:  "GET",
		Expires: time.Now().Add(24 * time.Hour), // Valid for 24 hours
	}

	bucket := s.storageClient.Bucket(s.bucketName)
	signedURL, err := bucket.SignedURL(objectName, opts)
	if err != nil {
		return "", fmt.Errorf("failed to generate signed URL: %w", err)
	}

	return signedURL, nil
}

// enhancePromptForRealism enhances DALL-E prompts for photorealistic advertising images
func (s *AIService) enhancePromptForRealism(basePrompt string, companyName string, sector string) string {
	// Photography style mapping based on sector with ultra-specific technical details
	photographyStyles := map[string]string{
		"Technology":              "professional tech photography, Canon EOS R5, 85mm f/1.4 lens, soft natural lighting from floor-to-ceiling windows, shallow depth of field with blurred contemporary workspace, polished surfaces and reflections",
		"Healthcare":              "clinical photography, professional medical photography, 100mm macro lens f/2.8, bright even lighting with soft shadows, sterile white environment, authentic medical setting",
		"Finance":                 "corporate lifestyle photography, 50mm f/1.8 lens, warm professional lighting, polished marble surfaces and modern glass architecture, upscale business environment",
		"E-commerce":              "product photography, 100mm macro lens f/8, studio lighting with large softbox setup, white seamless background, perfect even lighting, commercial product photography",
		"Food & Beverage":         "food photography, 100mm macro lens f/2.8, warm golden hour lighting through café window, rustic wooden surfaces, visible steam and texture details, authentic restaurant setting",
		"Fashion":                 "high-end fashion photography, 85mm f/1.4 lens, dramatic studio lighting with key light and rim light, textured fabrics and materials, professional fashion studio",
		"Travel":                  "travel lifestyle photography, 35mm f/2 lens, natural outdoor lighting, authentic cultural settings, candid documentary style, real locations",
		"Real Estate":             "architectural photography, 24mm f/8 lens, bright natural lighting through large windows, clean modern interiors, professional real estate photography",
		"Automotive":              "automotive photography, 50mm f/2.8 lens, dynamic lighting with reflections on polished metal, urban setting, professional car photography",
		"Entertainment":           "event photography, 50mm f/1.8 lens, dynamic stage lighting, authentic crowd atmosphere, professional concert photography, candid moments",
		"Sports & Fitness":        "sports photography, 70-200mm f/2.8 lens, energetic gym lighting, authentic workout environment, action photography with motion blur",
		"Manufacturing":           "industrial photography, 24mm f/5.6 lens, clean professional lighting, modern machinery and equipment, authentic factory setting",
		"Agriculture":             "agricultural photography, 35mm f/4 lens, natural outdoor lighting, authentic farm environment, documentary style, real agricultural setting",
		"Energy":                  "industrial energy photography, 24mm f/8 lens, dramatic lighting with industrial structures, authentic power plant or renewable energy site",
		"Telecommunications":      "technology photography, 85mm f/2.8 lens, modern clean lighting, contemporary office with communication devices, professional business setting",
		"Legal Services":          "professional corporate photography, 50mm f/2.8 lens, formal professional lighting, upscale law office environment with legal books and documents",
		"Marketing & Advertising": "creative studio photography, 50mm f/1.8 lens, artistic lighting setup, modern creative workspace with design elements, professional commercial photography",
		"Consulting":              "business photography, 35mm f/2.8 lens, professional meeting lighting, upscale conference room environment, authentic business interaction",
		"Logistics":               "logistics photography, 24mm f/5.6 lens, industrial warehouse lighting, modern distribution center, authentic logistics operation",
		"Pet Care":                "pet lifestyle photography, 85mm f/1.8 lens, warm natural lighting in home setting, authentic pet-owner interaction, candid moments",
		"Home & Garden":           "lifestyle photography, 35mm f/2.8 lens, bright natural lighting through windows, beautiful modern home interior, authentic living space",
		"Arts & Crafts":           "artistic photography, 100mm macro f/2.8 lens, creative lighting setup, handmade items with visible textures and craftsmanship details",
		"Non-profit":              "documentary photography, 35mm f/2 lens, natural authentic lighting, real community settings, photojournalistic style, genuine human moments",
		"Government":              "formal institutional photography, 50mm f/4 lens, professional government building lighting, official environment with architectural details",
	}

	style := photographyStyles[sector]
	if style == "" {
		style = "professional commercial photography, Canon EOS R5, 50mm f/1.8 lens, soft natural lighting from large windows, shallow depth of field with blurred modern office background"
	}

	// Check if prompt already starts with professional photography terms
	lowerPrompt := strings.ToLower(basePrompt)
	if strings.HasPrefix(lowerPrompt, "professional dslr photo") ||
		strings.HasPrefix(lowerPrompt, "professional photo") ||
		strings.HasPrefix(lowerPrompt, "dslr photo") ||
		strings.Contains(lowerPrompt, "canon eos") ||
		strings.Contains(lowerPrompt, "85mm") {
		// Prompt already enhanced, return as-is
		return basePrompt
	}

	// More aggressive enhancement with specific camera and settings
	enhancedPrompt := fmt.Sprintf(
		"Professional DSLR photo of %s, %s, high resolution commercial photography, sharp focus, photojournalistic style, authentic realistic photography, no illustration or cartoon elements",
		basePrompt, style)

	return enhancedPrompt
}

// validateRealisticPrompt validates that a prompt follows photorealistic best practices
func (s *AIService) validateRealisticPrompt(prompt string) bool {
	lowerPrompt := strings.ToLower(prompt)

	// Check for realistic photography indicators
	hasPhotographyTerm := strings.Contains(lowerPrompt, "photo of") ||
		strings.Contains(lowerPrompt, "dslr") ||
		strings.Contains(lowerPrompt, "photography")
	hasLighting := strings.Contains(lowerPrompt, "lighting")
	hasCameraDetails := strings.Contains(lowerPrompt, "lens") ||
		strings.Contains(lowerPrompt, "aperture") ||
		strings.Contains(lowerPrompt, "focus")

	// Avoid artistic terms that make images less realistic
	hasArtisticTerms := strings.Contains(lowerPrompt, "illustration") ||
		strings.Contains(lowerPrompt, "painting") ||
		strings.Contains(lowerPrompt, "cartoon") ||
		strings.Contains(lowerPrompt, "drawing") ||
		strings.Contains(lowerPrompt, "sketch")

	return hasPhotographyTerm && hasLighting && hasCameraDetails && !hasArtisticTerms
}

// GenerateBrandNames generates alternative brand name suggestions
func (s *AIService) GenerateBrandNames(ctx context.Context, brief *bezzmodels.BrandBrief, strategy *bezzmodels.BrandStrategy) ([]bezzmodels.BrandNameSuggestion, error) {
	log.Printf("🏷️ AI PIPELINE: Starting Brand-Name-GPT for brand name suggestions")

	// Convert brand pillars to string for the prompt
	brandPillars := strings.Join(strategy.BrandPillars, ", ")

	prompt := fmt.Sprintf(prompts.BrandNameGPTPrompt,
		brief.CompanyName,
		brief.Sector,
		strategy.Positioning,
		strategy.ValueProposition,
		brief.TargetAudience,
		brandPillars,
	)

	// Create parameters with desired settings (used via unified helper)
	temperature := float64(0.8) // Higher temperature for more creative name variations

	var response bezzmodels.BrandNameGPTResponse
	modelUsed, content, err := s.chatJSONWithFallback(ctx, []openai.ChatCompletionMessageParamUnion{
		openai.SystemMessage("You are Brand-Name-GPT, an expert at creating compelling brand names. Always respond with valid JSON only."),
		openai.UserMessage(prompt),
	}, 1000, &temperature, &response)
	if err != nil {
		log.Printf("❌ AI PIPELINE: Brand-Name-GPT API call failed: %v", err)
		return nil, fmt.Errorf("Brand-Name-GPT API call failed: %w", err)
	}

	log.Printf("🏷️ AI PIPELINE: Brand-Name-GPT raw response: %s", content)
	log.Printf("✅ AI PIPELINE: Generated %d brand name suggestions using %s", len(response.BrandNames), modelUsed)
	return response.BrandNames, nil
}

// GenerateBrandIdentity generates logo concept, color palette, and logo image
func (s *AIService) GenerateBrandIdentity(ctx context.Context, strategy *bezzmodels.BrandStrategy, companyName string, sector string, targetAudience string) (*bezzmodels.BrandIdentity, error) {
	log.Printf("🎨 AI PIPELINE: Starting Logo-Designer-GPT for brand identity")

	// Convert brand pillars to string for the prompt
	brandPillars := strings.Join(strategy.BrandPillars, ", ")

	prompt := fmt.Sprintf(prompts.LogoDesignerGPTPrompt,
		companyName,
		sector,
		strategy.Positioning,
		strategy.ValueProposition,
		brandPillars,
		targetAudience,
		strategy.Tagline,
	)

	// Create parameters with desired settings (used via unified helper)
	temperature := float64(0.7) // Balanced creativity and consistency

	var response bezzmodels.LogoDesignerGPTResponse
	modelUsed, content, err := s.chatJSONWithFallback(ctx, []openai.ChatCompletionMessageParamUnion{
		openai.SystemMessage("You are Logo-Designer-GPT, an expert brand identity designer. Always respond with valid JSON only."),
		openai.UserMessage(prompt),
	}, 1500, &temperature, &response)
	if err != nil {
		log.Printf("❌ AI PIPELINE: Logo-Designer-GPT API call failed: %v", err)
		return nil, fmt.Errorf("Logo-Designer-GPT API call failed: %w", err)
	}

	log.Printf("🎨 AI PIPELINE: Logo-Designer-GPT raw response: %s", content)
	log.Printf("✅ AI PIPELINE: Logo-Designer-GPT succeeded using %s", modelUsed)

	// Generate logo image using gpt-image-1 (with DALL-E 3 fallback) - REQUIRED
	log.Printf("🖼️ AI PIPELINE: Generating logo image with gpt-image-1")
	logoImageURL, err := s.generateImage(ctx, response.DallePrompt)
	if err != nil {
		log.Printf("❌ AI PIPELINE: Logo image generation failed: %v", err)
		return nil, fmt.Errorf("logo image generation failed: %w", err)
	}

	// Upload logo to GCS if generated successfully
	var logoObjectName string
	var gcsLogoURL string
	if logoImageURL != "" {
		logoObjectName = fmt.Sprintf("logos/%s_logo_%d", companyName, time.Now().Unix())
		gcsLogoURL, err = s.uploadImageToGCS(ctx, logoImageURL, logoObjectName)
		if err != nil {
			log.Printf("⚠️ AI PIPELINE: Logo upload to GCS failed: %v", err)
			gcsLogoURL = logoImageURL // Fallback to original URL
		}
	}

	brandIdentity := &bezzmodels.BrandIdentity{
		LogoConcept:    response.LogoConcept,
		ColorPalette:   response.ColorPalette,
		LogoImageURL:   gcsLogoURL,
		LogoObjectName: logoObjectName,
	}

	log.Printf("✅ AI PIPELINE: Generated brand identity with %d colors", len(response.ColorPalette))
	return brandIdentity, nil
}
