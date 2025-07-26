package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"cloud.google.com/go/storage"

	"github.com/sashabaranov/go-openai"

	"bezz-backend/internal/models"
	"bezz-backend/internal/prompts"
)

// AIService handles AI-related operations
type AIService struct {
	client        *openai.Client
	storageClient *storage.Client
	bucketName    string
}

// NewAIService creates a new AI service
func NewAIService(client *openai.Client, storageClient *storage.Client, bucketName string) *AIService {
	return &AIService{
		client:        client,
		storageClient: storageClient,
		bucketName:    bucketName,
	}
}

// ProcessBriefWithGPT processes a brand brief using Brief-GPT
func (s *AIService) ProcessBriefWithGPT(ctx context.Context, brief *models.BrandBrief) (*models.BriefGPTResponse, error) {
	prompt := fmt.Sprintf(prompts.BriefGPTPrompt,
		brief.CompanyName,
		brief.Sector,
		brief.TargetAudience,
		brief.Tone,
		brief.Language,
		brief.AdditionalInfo,
	)

	resp, err := s.client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: openai.GPT4,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: "You are Brief-GPT, an expert at structuring brand information. Always respond with valid JSON only.",
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		Temperature: 0.3, // Lower temperature for more consistent JSON output
		MaxTokens:   800,
	})

	if err != nil {
		return nil, fmt.Errorf("Brief-GPT API call failed: %w", err)
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from Brief-GPT")
	}

	content := strings.TrimSpace(resp.Choices[0].Message.Content)

	var briefResponse models.BriefGPTResponse
	if err := json.Unmarshal([]byte(content), &briefResponse); err != nil {
		log.Printf("Brief-GPT response parsing failed. Content: %s", content)
		return nil, fmt.Errorf("failed to parse Brief-GPT response: %w", err)
	}

	return &briefResponse, nil
}

// GenerateStrategyWithGPT generates brand strategy using Strategist-GPT
func (s *AIService) GenerateStrategyWithGPT(ctx context.Context, briefSummary *models.BriefGPTResponse) (*models.StrategistGPTResponse, error) {
	// Convert brief summary to JSON string for the prompt
	briefJSON, err := json.Marshal(briefSummary)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal brief summary: %w", err)
	}

	prompt := fmt.Sprintf(prompts.StrategistGPTPrompt, string(briefJSON))

	resp, err := s.client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: openai.GPT4,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: "You are Strategist-GPT, an expert brand strategist. Always respond with valid JSON only.",
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		Temperature: 0.4,
		MaxTokens:   2000,
	})

	if err != nil {
		return nil, fmt.Errorf("Strategist-GPT API call failed: %w", err)
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from Strategist-GPT")
	}

	content := strings.TrimSpace(resp.Choices[0].Message.Content)

	var strategyResponse models.StrategistGPTResponse
	if err := json.Unmarshal([]byte(content), &strategyResponse); err != nil {
		log.Printf("Strategist-GPT response parsing failed. Content: %s", content)
		return nil, fmt.Errorf("failed to parse Strategist-GPT response: %w", err)
	}

	return &strategyResponse, nil
}

// ProcessBriefPipeline executes the complete Brief-GPT -> Strategist-GPT pipeline
func (s *AIService) ProcessBriefPipeline(ctx context.Context, brief *models.BrandBrief) (*models.BrandStrategy, error) {
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

	// Step 3: Convert to models.BrandStrategy format
	strategy := &models.BrandStrategy{
		Positioning:      strategyResponse.PositioningStatement,
		ValueProposition: strategyResponse.ValueProposition,
		BrandPillars:     strategyResponse.BrandPillars,
		MessagingFramework: models.MessagingFramework{
			PrimaryMessage:     strategyResponse.MessagingFramework.PrimaryMessage,
			SupportingMessages: strategyResponse.MessagingFramework.SupportingMessages,
		},
		TargetSegments: s.convertTargetSegments(strategyResponse.TargetSegments),
	}

	return strategy, nil
}

// convertTargetSegments converts StrategistGPT target segments to models format
func (s *AIService) convertTargetSegments(segments []models.StrategistTargetSegment) []models.TargetSegment {
	result := make([]models.TargetSegment, len(segments))
	for i, seg := range segments {
		result[i] = models.TargetSegment{
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
func (s *AIService) GenerateBrandStrategy(ctx context.Context, brief *models.BrandBrief) (*models.BrandResults, error) {
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

	return &models.BrandResults{
		Brief:    *processedBrief,
		Strategy: *strategy,
		Ads:      ads,
		VideoAds: []models.VideoAd{}, // TODO: Implement video generation
	}, nil
}

// processBrief processes the raw brief into structured data
func (s *AIService) processBrief(ctx context.Context, brief *models.BrandBrief) (*models.ProcessedBrief, error) {
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

	resp, err := s.client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: openai.GPT4,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: "You are an expert brand strategist. Always respond with valid JSON.",
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		Temperature: 0.7,
		MaxTokens:   1000,
	})

	if err != nil {
		return nil, err
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from OpenAI")
	}

	var processedBrief models.ProcessedBrief
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &processedBrief); err != nil {
		log.Printf("Failed to parse AI response: %s", resp.Choices[0].Message.Content)
		return nil, fmt.Errorf("failed to parse AI response: %w", err)
	}

	return &processedBrief, nil
}

// generateStrategy generates a brand strategy
func (s *AIService) generateStrategy(ctx context.Context, brief *models.BrandBrief, processedBrief *models.ProcessedBrief) (*models.BrandStrategy, error) {
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

	resp, err := s.client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: openai.GPT4,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: "You are an expert brand strategist. Always respond with valid JSON.",
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		Temperature: 0.7,
		MaxTokens:   2000,
	})

	if err != nil {
		return nil, err
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from OpenAI")
	}

	var strategy models.BrandStrategy
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &strategy); err != nil {
		log.Printf("Failed to parse AI response: %s", resp.Choices[0].Message.Content)
		return nil, fmt.Errorf("failed to parse AI response: %w", err)
	}

	return &strategy, nil
}

// generateAdCampaigns generates advertising campaigns
func (s *AIService) generateAdCampaigns(ctx context.Context, brief *models.BrandBrief, processedBrief *models.ProcessedBrief, strategy *models.BrandStrategy) ([]models.AdCampaign, error) {
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

	resp, err := s.client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: openai.GPT4,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: "You are an expert creative director. Always respond with valid JSON.",
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		Temperature: 0.8,
		MaxTokens:   3000,
	})

	if err != nil {
		return nil, err
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from OpenAI")
	}

	var campaigns []models.AdCampaign
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &campaigns); err != nil {
		log.Printf("Failed to parse AI response: %s", resp.Choices[0].Message.Content)
		return nil, fmt.Errorf("failed to parse AI response: %w", err)
	}

	return campaigns, nil
}

// GenerateImage generates an image using DALL-E
func (s *AIService) GenerateImage(ctx context.Context, prompt string) (string, error) {
	// TODO: Implement DALL-E image generation
	resp, err := s.client.CreateImage(ctx, openai.ImageRequest{
		Prompt: prompt,
		N:      1,
		Size:   openai.CreateImageSize1024x1024,
	})

	if err != nil {
		return "", err
	}

	if len(resp.Data) == 0 {
		return "", fmt.Errorf("no image generated")
	}

	return resp.Data[0].URL, nil
}

// ModerateContent checks content for policy violations
func (s *AIService) ModerateContent(ctx context.Context, content string) (bool, error) {
	resp, err := s.client.Moderations(ctx, openai.ModerationRequest{
		Input: content,
	})

	if err != nil {
		return false, err
	}

	if len(resp.Results) == 0 {
		return true, nil
	}

	return !resp.Results[0].Flagged, nil
}

// GenerateAds calls Creative-Director-GPT to generate ad specifications
func (s *AIService) GenerateAds(ctx context.Context, strategy *models.BrandStrategy) (*models.CreativeDirectorGPTResponse, error) {
	log.Printf("🎨 AI PIPELINE: Starting Creative-Director-GPT for ad generation")

	// Convert strategy to JSON string for the prompt
	strategyJSON, err := json.Marshal(strategy)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal strategy: %w", err)
	}

	prompt := fmt.Sprintf(prompts.CreativeDirectorGPTPrompt, string(strategyJSON))

	resp, err := s.client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: openai.GPT4,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: "You are Creative-Director-GPT, an expert at creating compelling ad copy and visual concepts. Always respond with valid JSON only.",
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		Temperature: 0.7,
		MaxTokens:   2000,
	})

	if err != nil {
		log.Printf("❌ AI PIPELINE: Creative-Director-GPT API call failed: %v", err)
		return nil, fmt.Errorf("Creative-Director-GPT API call failed: %w", err)
	}

	if len(resp.Choices) == 0 {
		log.Printf("❌ AI PIPELINE: No response from Creative-Director-GPT")
		return nil, fmt.Errorf("no response from Creative-Director-GPT")
	}

	content := strings.TrimSpace(resp.Choices[0].Message.Content)
	log.Printf("🎨 AI PIPELINE: Creative-Director-GPT raw response: %s", content)

	var response models.CreativeDirectorGPTResponse
	if err := json.Unmarshal([]byte(content), &response); err != nil {
		log.Printf("❌ AI PIPELINE: Failed to parse Creative-Director-GPT JSON: %v", err)
		return nil, fmt.Errorf("failed to parse Creative-Director-GPT response: %w", err)
	}

	log.Printf("✅ AI PIPELINE: Generated %d ad specifications", len(response.Ads))
	return &response, nil
}

// RenderImages takes AdSpecs and returns AdCampaigns with image URLs
func (s *AIService) RenderImages(ctx context.Context, adSpecs []models.AdSpec, companyName string) ([]models.AdCampaign, error) {
	log.Printf("🖼️ AI PIPELINE: Starting DALL-E 3 image generation for %d ads", len(adSpecs))

	var wg sync.WaitGroup
	results := make([]models.AdCampaign, len(adSpecs))
	errors := make([]error, len(adSpecs))

	// Generate images concurrently
	for i, spec := range adSpecs {
		wg.Add(1)
		go func(index int, adSpec models.AdSpec) {
			defer wg.Done()

			campaign, err := s.generateSingleAd(ctx, adSpec, companyName)
			if err != nil {
				log.Printf("❌ AI PIPELINE: Failed to generate ad %d: %v", adSpec.ID, err)
				errors[index] = err
				// Create a campaign without image on failure
				campaign = &models.AdCampaign{
					ID:            fmt.Sprintf("ad_%d_%d", adSpec.ID, time.Now().Unix()),
					Title:         fmt.Sprintf("Ad Campaign %d", adSpec.ID),
					Format:        "social",
					Platform:      "facebook",
					TargetSegment: "Primary Audience",
					Copy: models.AdCopy{
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

	// Check for critical errors (if all failed)
	successCount := 0
	for _, err := range errors {
		if err == nil {
			successCount++
		}
	}

	log.Printf("🖼️ AI PIPELINE: Generated %d/%d images successfully", successCount, len(adSpecs))

	if successCount == 0 {
		return nil, fmt.Errorf("all image generation attempts failed")
	}

	return results, nil
}

// generateSingleAd generates a single ad with image
func (s *AIService) generateSingleAd(ctx context.Context, spec models.AdSpec, companyName string) (*models.AdCampaign, error) {
	const maxRetries = 2
	var lastErr error

	for attempt := 0; attempt <= maxRetries; attempt++ {
		if attempt > 0 {
			log.Printf("🔄 AI PIPELINE: Retrying image generation for ad %d (attempt %d/%d)", spec.ID, attempt+1, maxRetries+1)
			time.Sleep(time.Duration(attempt) * 2 * time.Second) // Exponential backoff
		}

		// Generate image with DALL-E 3
		imageURL, err := s.generateImage(ctx, spec.DallePrompt)
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
		campaign := &models.AdCampaign{
			ID:            fmt.Sprintf("ad_%d_%d", spec.ID, time.Now().Unix()),
			Title:         fmt.Sprintf("Ad Campaign %d", spec.ID),
			Format:        "social",
			Platform:      "facebook",
			TargetSegment: "Primary Audience",
			Copy: models.AdCopy{
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

// generateImage generates an image using DALL-E 3
func (s *AIService) generateImage(ctx context.Context, prompt string) (string, error) {
	log.Printf("🎨 AI PIPELINE: Generating image with prompt: %.100s...", prompt)

	resp, err := s.client.CreateImage(ctx, openai.ImageRequest{
		Prompt:         prompt,
		Model:          openai.CreateImageModelDallE3,
		N:              1,
		Size:           openai.CreateImageSize1024x1024,
		Quality:        openai.CreateImageQualityStandard,
		ResponseFormat: openai.CreateImageResponseFormatURL,
	})

	if err != nil {
		log.Printf("❌ AI PIPELINE: DALL-E 3 API call failed: %v", err)
		return "", fmt.Errorf("DALL-E 3 API call failed: %w", err)
	}

	if len(resp.Data) == 0 {
		return "", fmt.Errorf("no image generated by DALL-E 3")
	}

	imageURL := resp.Data[0].URL
	log.Printf("✅ AI PIPELINE: Image generated successfully: %s", imageURL)
	return imageURL, nil
}

// uploadImageToGCS uploads an image to Google Cloud Storage and returns a signed URL
func (s *AIService) uploadImageToGCS(ctx context.Context, imageURL, objectName string) (string, error) {
	log.Printf("☁️ AI PIPELINE: Uploading image to GCS: %s", objectName)

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
