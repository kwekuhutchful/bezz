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
