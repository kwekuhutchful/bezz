package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/sashabaranov/go-openai"

	"bezz-backend/internal/models"
	"bezz-backend/internal/prompts"

	"github.com/stretchr/testify/assert"
)

// OpenAIClientInterface defines the interface for OpenAI client methods we use
type OpenAIClientInterface interface {
	CreateChatCompletion(ctx context.Context, request openai.ChatCompletionRequest) (openai.ChatCompletionResponse, error)
}

// MockOpenAIClient is a mock implementation of the OpenAI client interface
type MockOpenAIClient struct {
	MockResponse openai.ChatCompletionResponse
	MockError    error
}

func (m *MockOpenAIClient) CreateChatCompletion(ctx context.Context, request openai.ChatCompletionRequest) (openai.ChatCompletionResponse, error) {
	if m.MockError != nil {
		return openai.ChatCompletionResponse{}, m.MockError
	}
	return m.MockResponse, nil
}

// TestableAIService is a version of AIService that accepts an interface for testing
type TestableAIService struct {
	client OpenAIClientInterface
}

func NewTestableAIService(client OpenAIClientInterface) *TestableAIService {
	return &TestableAIService{client: client}
}

// Copy the methods from AIService but using our interface
func (s *TestableAIService) ProcessBriefWithGPT(ctx context.Context, brief *models.BrandBrief) (*models.BriefGPTResponse, error) {
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
		Temperature: 0.3,
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
		return nil, fmt.Errorf("failed to parse Brief-GPT response: %w", err)
	}

	return &briefResponse, nil
}

// GenerateAds generates ads using the testable AI service
func (s *TestableAIService) GenerateAds(ctx context.Context, strategy *models.BrandStrategy) (*models.CreativeDirectorGPTResponse, error) {
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
				Content: "You are Creative-Director-GPT, an expert at creating compelling ad campaigns. Always respond with valid JSON only.",
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		Temperature: 0.7,
		MaxTokens:   1500,
	})

	if err != nil {
		return nil, fmt.Errorf("Creative-Director-GPT API call failed: %w", err)
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from Creative-Director-GPT")
	}

	content := strings.TrimSpace(resp.Choices[0].Message.Content)

	var response models.CreativeDirectorGPTResponse
	if err := json.Unmarshal([]byte(content), &response); err != nil {
		return nil, fmt.Errorf("failed to parse Creative-Director-GPT response: %w", err)
	}

	return &response, nil
}

func TestProcessBriefWithGPT_Success(t *testing.T) {
	// Mock response from Brief-GPT
	mockBriefResponse := models.BriefGPTResponse{
		BrandGoal: "Build a premium tech brand",
		Audience:  "Tech-savvy professionals aged 25-40",
		Tone:      "Professional yet approachable",
		Vision:    "To be the leading provider of innovative tech solutions",
	}

	responseJSON, _ := json.Marshal(mockBriefResponse)
	mockClient := &MockOpenAIClient{
		MockResponse: openai.ChatCompletionResponse{
			Choices: []openai.ChatCompletionChoice{
				{
					Message: openai.ChatCompletionMessage{
						Content: string(responseJSON),
					},
				},
			},
		},
	}

	testService := NewTestableAIService(mockClient)

	// Test brief
	brief := &models.BrandBrief{
		ID:             "test-brief-id",
		CompanyName:    "TechCorp",
		Sector:         "Technology",
		TargetAudience: "Tech professionals",
		Tone:           "Professional",
		Language:       "en",
		AdditionalInfo: "Focus on innovation",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	ctx := context.Background()
	result, err := testService.ProcessBriefWithGPT(ctx, brief)

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if result.BrandGoal != mockBriefResponse.BrandGoal {
		t.Errorf("Expected brand goal %s, got %s", mockBriefResponse.BrandGoal, result.BrandGoal)
	}

	if result.Audience != mockBriefResponse.Audience {
		t.Errorf("Expected audience %s, got %s", mockBriefResponse.Audience, result.Audience)
	}
}

func TestProcessBriefWithGPT_Error(t *testing.T) {
	mockClient := &MockOpenAIClient{
		MockError: errors.New("API error"),
	}

	testService := NewTestableAIService(mockClient)

	brief := &models.BrandBrief{
		ID:             "test-brief-id",
		CompanyName:    "TechCorp",
		Sector:         "Technology",
		TargetAudience: "Tech professionals",
		Tone:           "Professional",
		Language:       "en",
		AdditionalInfo: "Focus on innovation",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	ctx := context.Background()
	_, err := testService.ProcessBriefWithGPT(ctx, brief)

	if err == nil {
		t.Fatal("Expected error, got nil")
	}
}

func TestGenerateAds_Success(t *testing.T) {
	mockClient := &MockOpenAIClient{
		MockResponse: openai.ChatCompletionResponse{
			Choices: []openai.ChatCompletionChoice{
				{
					Message: openai.ChatCompletionMessage{
						Content: `{
							"ads": [
								{
									"id": 1,
									"headline": "Transform Your Business Today",
									"body": "Discover innovative solutions that drive growth and success for your company.",
									"dalle_prompt": "Modern office setting with diverse professionals collaborating"
								},
								{
									"id": 2,
									"headline": "Unlock Your Potential",
									"body": "Join thousands of successful businesses already using our platform.",
									"dalle_prompt": "Upward trending graph with business people celebrating success"
								},
								{
									"id": 3,
									"headline": "Start Your Journey",
									"body": "Take the first step towards transforming your business operations.",
									"dalle_prompt": "Professional handshake sealing a business deal"
								}
							]
						}`,
					},
				},
			},
		},
	}

	service := NewTestableAIService(mockClient)

	strategy := &models.BrandStrategy{
		Positioning:      "Leading tech solution provider",
		ValueProposition: "We help businesses grow through technology",
		BrandPillars:     []string{"Innovation", "Reliability", "Growth"},
	}

	response, err := service.GenerateAds(context.Background(), strategy)

	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.Len(t, response.Ads, 3)

	// Verify first ad
	ad := response.Ads[0]
	assert.Equal(t, 1, ad.ID)
	assert.Equal(t, "Transform Your Business Today", ad.Headline)
	assert.Equal(t, "Discover innovative solutions that drive growth and success for your company.", ad.Body)
	assert.Contains(t, ad.DallePrompt, "Modern office setting")
}

func TestGenerateAds_Error(t *testing.T) {
	mockClient := &MockOpenAIClient{
		MockError: errors.New("API error"),
	}

	service := NewTestableAIService(mockClient)

	strategy := &models.BrandStrategy{
		Positioning: "Test positioning",
	}

	response, err := service.GenerateAds(context.Background(), strategy)

	assert.Error(t, err)
	assert.Nil(t, response)
	assert.Contains(t, err.Error(), "Creative-Director-GPT API call failed")
}

func TestGenerateAds_InvalidJSON(t *testing.T) {
	mockClient := &MockOpenAIClient{
		MockResponse: openai.ChatCompletionResponse{
			Choices: []openai.ChatCompletionChoice{
				{
					Message: openai.ChatCompletionMessage{
						Content: "invalid json response",
					},
				},
			},
		},
	}

	service := NewTestableAIService(mockClient)

	strategy := &models.BrandStrategy{
		Positioning: "Test positioning",
	}

	response, err := service.GenerateAds(context.Background(), strategy)

	assert.Error(t, err)
	assert.Nil(t, response)
	assert.Contains(t, err.Error(), "failed to parse Creative-Director-GPT response")
}
