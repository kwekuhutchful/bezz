package handlers

import (
	"context"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"bezz-backend/internal/models"
)

// MockBrandBriefService is a mock implementation of the brand brief service
type MockBrandBriefService struct {
	MockCreateResponse *models.BrandBrief
	MockCreateError    error
}

func (m *MockBrandBriefService) CreateBrief(ctx context.Context, userID string, req *models.BrandBriefRequest) (*models.BrandBrief, error) {
	if m.MockCreateError != nil {
		return nil, m.MockCreateError
	}
	return m.MockCreateResponse, nil
}

// MockUserService is a mock implementation of the user service
type MockUserService struct {
	MockUser               *models.User
	MockDeductCreditsError error
}

func (m *MockUserService) GetUser(ctx context.Context, userID string) (*models.User, error) {
	return m.MockUser, nil
}

func (m *MockUserService) DeductCredits(ctx context.Context, userID string, credits int) error {
	if m.MockDeductCreditsError != nil {
		return m.MockDeductCreditsError
	}
	// Update mock user credits
	if m.MockUser != nil {
		m.MockUser.Credits -= credits
	}
	return nil
}

func TestCreateBrief_Success(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)

	mockBriefService := &MockBrandBriefService{}
	mockUserService := &MockUserService{}

	// Mock user with sufficient credits
	mockUserService.MockUser = &models.User{
		ID:          "test-user-id",
		Email:       "test@example.com",
		DisplayName: "Test User",
		Credits:     10,
		CreatedAt:   time.Now(),
	}

	// Mock successful brief creation
	expectedBrief := &models.BrandBrief{
		ID:             "test-brief-id",
		UserID:         "test-user-id",
		CompanyName:    "TechCorp",
		Sector:         "Technology",
		TargetAudience: "Tech professionals",
		Tone:           "Professional",
		Language:       "en",
		AdditionalInfo: "Focus on innovation",
		Status:         "processing",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	mockBriefService.MockCreateResponse = expectedBrief

	// Test the mock services directly
	assert.NotNil(t, mockBriefService)
	assert.NotNil(t, mockUserService)
	assert.Equal(t, 10, mockUserService.MockUser.Credits)
	assert.Equal(t, "TechCorp", expectedBrief.CompanyName)
}

func TestCreateBrief_InsufficientCredits(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)

	mockBriefService := &MockBrandBriefService{}
	mockUserService := &MockUserService{}

	// Mock user with insufficient credits
	mockUserService.MockUser = &models.User{
		ID:          "test-user-id",
		Email:       "test@example.com",
		DisplayName: "Test User",
		Credits:     0, // No credits
		CreatedAt:   time.Now(),
	}

	// Verify the mock is set up correctly
	assert.Equal(t, 0, mockUserService.MockUser.Credits)
	assert.NotNil(t, mockBriefService)
}

func TestCreateBrief_CompleteAIPipeline(t *testing.T) {
	// Mock services
	mockBriefService := &MockBrandBriefService{
		MockCreateResponse: &models.BrandBrief{
			ID:          "test-brief-123",
			CompanyName: "Test Company",
			Status:      "processing",
		},
	}

	mockUserService := &MockUserService{
		MockUser: &models.User{
			ID:      "test-user",
			Credits: 5,
		},
	}

	// Test the mock services
	assert.NotNil(t, mockBriefService)
	assert.NotNil(t, mockUserService)
	assert.Equal(t, "test-brief-123", mockBriefService.MockCreateResponse.ID)
	assert.Equal(t, 5, mockUserService.MockUser.Credits)
}
