package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"testing"
	"time"

	openai "github.com/openai/openai-go/v2"
	"github.com/openai/openai-go/v2/shared"

	"bezz-backend/internal/models"
	"bezz-backend/internal/prompts"

	"github.com/stretchr/testify/assert"
)

// OpenAIClientInterface defines the interface for OpenAI client methods we use
type OpenAIClientInterface interface {
	Chat() ChatServiceInterface
}

// ChatServiceInterface defines the interface for chat completions
type ChatServiceInterface interface {
	Completions() ChatCompletionsServiceInterface
}

// ChatCompletionsServiceInterface defines the interface for chat completions
type ChatCompletionsServiceInterface interface {
	New(ctx context.Context, params openai.ChatCompletionNewParams) (*openai.ChatCompletion, error)
}

// MockChatCompletionsService is a mock implementation of the chat completions service
type MockChatCompletionsService struct {
	MockResponse *openai.ChatCompletion
	MockError    error
}

func (m *MockChatCompletionsService) New(ctx context.Context, params openai.ChatCompletionNewParams) (*openai.ChatCompletion, error) {
	if m.MockError != nil {
		return nil, m.MockError
	}
	return m.MockResponse, nil
}

// MockChatService is a mock implementation of the chat service
type MockChatService struct {
	completions *MockChatCompletionsService
}

func (m *MockChatService) Completions() ChatCompletionsServiceInterface {
	return m.completions
}

// MockOpenAIClient is a mock implementation of the OpenAI client interface
type MockOpenAIClient struct {
	chat *MockChatService
}

func (m *MockOpenAIClient) Chat() ChatServiceInterface {
	return m.chat
}

// NewMockOpenAIClient creates a new mock client with the given response
func NewMockOpenAIClient(response *openai.ChatCompletion, err error) *MockOpenAIClient {
	return &MockOpenAIClient{
		chat: &MockChatService{
			completions: &MockChatCompletionsService{
				MockResponse: response,
				MockError:    err,
			},
		},
	}
}

// TestableAIService is a version of AIService that accepts an interface for testing
type TestableAIService struct {
	client OpenAIClientInterface
}

func NewTestableAIService(client OpenAIClientInterface) *TestableAIService {
	return &TestableAIService{client: client}
}

// ProcessBriefWithGPT processes a brand brief using GPT (test version)
func (s *TestableAIService) ProcessBriefWithGPT(ctx context.Context, brief *models.BrandBrief) (*models.BriefGPTResponse, error) {
	prompt := fmt.Sprintf(prompts.BriefGPTPrompt,
		brief.CompanyName,
		brief.BusinessDescription,
		brief.Sector,
		brief.TargetAudience,
		brief.Tone,
		brief.Language,
		brief.AdditionalInfo,
	)

	// Create parameters using the new SDK structure
	temperature := float64(0.3)
	params := openai.ChatCompletionNewParams{
		Model: shared.ChatModelGPT5,
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage("You are Brief-GPT, an expert at structuring brand information. Always respond with valid JSON only."),
			openai.UserMessage(prompt),
		},
		MaxTokens:   openai.Int(int64(800)),
		Temperature: openai.Float(temperature),
	}

	resp, err := s.client.Chat().Completions().New(ctx, params)

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

	// Create parameters using the new SDK structure
	temperature := float64(0.7)
	params := openai.ChatCompletionNewParams{
		Model: shared.ChatModelGPT5,
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage("You are Creative-Director-GPT, an expert at creating compelling ad campaigns. Always respond with valid JSON only."),
			openai.UserMessage(prompt),
		},
		MaxTokens:   openai.Int(int64(1500)),
		Temperature: openai.Float(temperature),
	}

	resp, err := s.client.Chat().Completions().New(ctx, params)

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

	// Create mock response using the new SDK structure
	mockResponse := &openai.ChatCompletion{
		Choices: []openai.ChatCompletionChoice{
			{
				Message: openai.ChatCompletionMessage{
					Content: string(responseJSON),
				},
			},
		},
	}

	mockClient := NewMockOpenAIClient(mockResponse, nil)
	testService := NewTestableAIService(mockClient)

	// Test brief
	brief := &models.BrandBrief{
		ID:                  "test-brief-id",
		CompanyName:         "TechCorp",
		BusinessDescription: "We provide cloud-based software solutions for small businesses",
		Sector:              "Technology",
		TargetAudience:      "Tech professionals",
		Tone:                "Professional",
		Language:            "en",
		AdditionalInfo:      "Focus on innovation",
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
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
	mockClient := NewMockOpenAIClient(nil, errors.New("API error"))
	testService := NewTestableAIService(mockClient)

	brief := &models.BrandBrief{
		ID:                  "test-brief-id",
		CompanyName:         "TechCorp",
		BusinessDescription: "We provide cloud-based software solutions for small businesses",
		Sector:              "Technology",
		TargetAudience:      "Tech professionals",
		Tone:                "Professional",
		Language:            "en",
		AdditionalInfo:      "Focus on innovation",
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}

	ctx := context.Background()
	_, err := testService.ProcessBriefWithGPT(ctx, brief)

	if err == nil {
		t.Fatal("Expected error, got nil")
	}
}

func TestGenerateAds_Success(t *testing.T) {
	// Create mock response using the new SDK structure
	mockResponse := &openai.ChatCompletion{
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
	}

	mockClient := NewMockOpenAIClient(mockResponse, nil)
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
	mockClient := NewMockOpenAIClient(nil, errors.New("API error"))
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
	// Create mock response with invalid JSON
	mockResponse := &openai.ChatCompletion{
		Choices: []openai.ChatCompletionChoice{
			{
				Message: openai.ChatCompletionMessage{
					Content: "invalid json response",
				},
			},
		},
	}

	mockClient := NewMockOpenAIClient(mockResponse, nil)
	service := NewTestableAIService(mockClient)

	strategy := &models.BrandStrategy{
		Positioning: "Test positioning",
	}

	response, err := service.GenerateAds(context.Background(), strategy)

	assert.Error(t, err)
	assert.Nil(t, response)
	assert.Contains(t, err.Error(), "failed to parse Creative-Director-GPT response")
}
