package services

import (
	"testing"
)

// Test helper to create a float64 pointer
func float64Ptr(f float64) *float64 {
	return &f
}

// Test helper to create an int pointer
func intPtr(i int) *int {
	return &i
}

func TestSanitizeParams_GPT5_StripsSamplingKnobs(t *testing.T) {
	// Test that GPT-5 strips sampling parameters and converts to max_completion_tokens
	params := &ChatParams{
		Model:            "gpt-5",
		MaxTokens:        1000,
		Temperature:      float64Ptr(0.7),
		TopP:             float64Ptr(0.9),
		N:                intPtr(1),
		PresencePenalty:  float64Ptr(0.1),
		FrequencyPenalty: float64Ptr(0.2),
	}

	sanitizeParams("gpt-5", params)

	// Verify max_tokens converted to max_completion_tokens
	if params.MaxCompletionTokens != 1000 {
		t.Errorf("Expected MaxCompletionTokens=1000, got %d", params.MaxCompletionTokens)
	}
	if params.MaxTokens != 0 {
		t.Errorf("Expected MaxTokens=0 (cleared), got %d", params.MaxTokens)
	}

	// Verify sampling parameters are stripped
	if params.Temperature != nil {
		t.Errorf("Expected Temperature=nil for GPT-5, got %v", *params.Temperature)
	}
	if params.TopP != nil {
		t.Errorf("Expected TopP=nil for GPT-5, got %v", *params.TopP)
	}
	if params.N != nil {
		t.Errorf("Expected N=nil for GPT-5, got %v", *params.N)
	}
	if params.PresencePenalty != nil {
		t.Errorf("Expected PresencePenalty=nil for GPT-5, got %v", *params.PresencePenalty)
	}
	if params.FrequencyPenalty != nil {
		t.Errorf("Expected FrequencyPenalty=nil for GPT-5, got %v", *params.FrequencyPenalty)
	}
}

func TestSanitizeParams_GPT5Nano_StripsSamplingKnobs(t *testing.T) {
	// Test that GPT-5-nano also strips sampling parameters
	params := &ChatParams{
		Model:            "gpt-5-nano",
		MaxTokens:        500,
		Temperature:      float64Ptr(0.3),
		TopP:             float64Ptr(0.8),
		N:                intPtr(2),
		PresencePenalty:  float64Ptr(0.5),
		FrequencyPenalty: float64Ptr(0.3),
	}

	sanitizeParams("gpt-5-nano", params)

	// Verify max_tokens converted to max_completion_tokens
	if params.MaxCompletionTokens != 500 {
		t.Errorf("Expected MaxCompletionTokens=500, got %d", params.MaxCompletionTokens)
	}
	if params.MaxTokens != 0 {
		t.Errorf("Expected MaxTokens=0 (cleared), got %d", params.MaxTokens)
	}

	// Verify all sampling parameters are stripped
	if params.Temperature != nil {
		t.Error("Expected Temperature=nil for gpt-5-nano")
	}
	if params.TopP != nil {
		t.Error("Expected TopP=nil for gpt-5-nano")
	}
	if params.N != nil {
		t.Error("Expected N=nil for gpt-5-nano")
	}
	if params.PresencePenalty != nil {
		t.Error("Expected PresencePenalty=nil for gpt-5-nano")
	}
	if params.FrequencyPenalty != nil {
		t.Error("Expected FrequencyPenalty=nil for gpt-5-nano")
	}
}

func TestSanitizeParams_O3Mini_StripsSamplingKnobs(t *testing.T) {
	// Test that o3-mini also strips sampling parameters
	params := &ChatParams{
		Model:            "o3-mini",
		MaxTokens:        800,
		Temperature:      float64Ptr(0.5),
		TopP:             float64Ptr(0.95),
		N:                intPtr(3),
		PresencePenalty:  float64Ptr(0.0),
		FrequencyPenalty: float64Ptr(0.1),
	}

	sanitizeParams("o3-mini", params)

	// Verify max_tokens converted to max_completion_tokens
	if params.MaxCompletionTokens != 800 {
		t.Errorf("Expected MaxCompletionTokens=800, got %d", params.MaxCompletionTokens)
	}
	if params.MaxTokens != 0 {
		t.Errorf("Expected MaxTokens=0 (cleared), got %d", params.MaxTokens)
	}

	// Verify all sampling parameters are stripped
	if params.Temperature != nil {
		t.Error("Expected Temperature=nil for o3-mini")
	}
	if params.TopP != nil {
		t.Error("Expected TopP=nil for o3-mini")
	}
	if params.N != nil {
		t.Error("Expected N=nil for o3-mini")
	}
	if params.PresencePenalty != nil {
		t.Error("Expected PresencePenalty=nil for o3-mini")
	}
	if params.FrequencyPenalty != nil {
		t.Error("Expected FrequencyPenalty=nil for o3-mini")
	}
}

func TestSanitizeParams_LegacyModels_KeepsMaxTokens(t *testing.T) {
	// Test that legacy models (GPT-4, GPT-3.5) keep max_tokens and sampling parameters
	testCases := []string{"gpt-4", "gpt-4-1106-preview", "gpt-3.5-turbo"}

	for _, model := range testCases {
		t.Run(model, func(t *testing.T) {
			params := &ChatParams{
				Model:            model,
				MaxTokens:        1200,
				Temperature:      float64Ptr(0.6),
				TopP:             float64Ptr(0.85),
				N:                intPtr(1),
				PresencePenalty:  float64Ptr(0.2),
				FrequencyPenalty: float64Ptr(0.1),
			}

			sanitizeParams(model, params)

			// Verify max_tokens is preserved
			if params.MaxTokens != 1200 {
				t.Errorf("Expected MaxTokens=1200 for %s, got %d", model, params.MaxTokens)
			}
			if params.MaxCompletionTokens != 0 {
				t.Errorf("Expected MaxCompletionTokens=0 for %s, got %d", model, params.MaxCompletionTokens)
			}

			// Verify sampling parameters are preserved
			if params.Temperature == nil || *params.Temperature != 0.6 {
				t.Errorf("Expected Temperature=0.6 for %s, got %v", model, params.Temperature)
			}
			if params.TopP == nil || *params.TopP != 0.85 {
				t.Errorf("Expected TopP=0.85 for %s, got %v", model, params.TopP)
			}
			if params.N == nil || *params.N != 1 {
				t.Errorf("Expected N=1 for %s, got %v", model, params.N)
			}
			if params.PresencePenalty == nil || *params.PresencePenalty != 0.2 {
				t.Errorf("Expected PresencePenalty=0.2 for %s, got %v", model, params.PresencePenalty)
			}
			if params.FrequencyPenalty == nil || *params.FrequencyPenalty != 0.1 {
				t.Errorf("Expected FrequencyPenalty=0.1 for %s, got %v", model, params.FrequencyPenalty)
			}
		})
	}
}

func TestSanitizeParams_ImageModels_NoTokenLimits(t *testing.T) {
	// Test that image models don't use token limits
	imageModels := []string{"dall-e-3", "dall-e-2"}

	for _, model := range imageModels {
		t.Run(model, func(t *testing.T) {
			params := &ChatParams{
				Model:     model,
				MaxTokens: 1000,
			}

			sanitizeParams(model, params)

			// Image models should not use token limits
			if params.MaxTokens != 1000 {
				t.Errorf("Expected MaxTokens=1000 (unchanged) for %s, got %d", model, params.MaxTokens)
			}
			if params.MaxCompletionTokens != 0 {
				t.Errorf("Expected MaxCompletionTokens=0 for %s, got %d", model, params.MaxCompletionTokens)
			}
		})
	}
}

func TestSanitizeParams_UnknownModel_AssumesLegacy(t *testing.T) {
	// Test that unknown models are treated as legacy (full parameter support)
	params := &ChatParams{
		Model:            "unknown-model-xyz",
		MaxTokens:        1500,
		Temperature:      float64Ptr(0.9),
		TopP:             float64Ptr(0.95),
		N:                intPtr(2),
		PresencePenalty:  float64Ptr(0.3),
		FrequencyPenalty: float64Ptr(0.4),
	}

	sanitizeParams("unknown-model-xyz", params)

	// Verify legacy behavior (preserve all parameters)
	if params.MaxTokens != 1500 {
		t.Errorf("Expected MaxTokens=1500 for unknown model, got %d", params.MaxTokens)
	}
	if params.MaxCompletionTokens != 0 {
		t.Errorf("Expected MaxCompletionTokens=0 for unknown model, got %d", params.MaxCompletionTokens)
	}

	// Verify all sampling parameters are preserved
	if params.Temperature == nil || *params.Temperature != 0.9 {
		t.Error("Expected Temperature preserved for unknown model")
	}
	if params.TopP == nil || *params.TopP != 0.95 {
		t.Error("Expected TopP preserved for unknown model")
	}
	if params.N == nil || *params.N != 2 {
		t.Error("Expected N preserved for unknown model")
	}
	if params.PresencePenalty == nil || *params.PresencePenalty != 0.3 {
		t.Error("Expected PresencePenalty preserved for unknown model")
	}
	if params.FrequencyPenalty == nil || *params.FrequencyPenalty != 0.4 {
		t.Error("Expected FrequencyPenalty preserved for unknown model")
	}
}

func TestModelCapabilities_CorrectDefinitions(t *testing.T) {
	// Test that model capability matrix is correctly defined
	testCases := []struct {
		model                    string
		expectedSampling         bool
		expectedCompletionTokens bool
		expectedForImages        bool
	}{
		// GPT-5 family
		{"gpt-5", false, true, false},
		{"gpt-5-nano", false, true, false},
		{"o3-mini", false, true, false},

		// Legacy models
		{"gpt-4", true, false, false},
		{"gpt-4-1106-preview", true, false, false},
		{"gpt-3.5-turbo", true, false, false},

		// Image models
		{"dall-e-3", false, false, true},
		{"dall-e-2", false, false, true},
	}

	for _, tc := range testCases {
		t.Run(tc.model, func(t *testing.T) {
			caps, exists := modelCapabilities[tc.model]
			if !exists {
				t.Fatalf("Model %s not found in capability matrix", tc.model)
			}

			if caps.SupportsSampling != tc.expectedSampling {
				t.Errorf("Expected SupportsSampling=%t for %s, got %t", tc.expectedSampling, tc.model, caps.SupportsSampling)
			}
			if caps.UsesMaxCompletionTokens != tc.expectedCompletionTokens {
				t.Errorf("Expected UsesMaxCompletionTokens=%t for %s, got %t", tc.expectedCompletionTokens, tc.model, caps.UsesMaxCompletionTokens)
			}
			if caps.ForImages != tc.expectedForImages {
				t.Errorf("Expected ForImages=%t for %s, got %t", tc.expectedForImages, tc.model, caps.ForImages)
			}
		})
	}
}

func TestGetBestTextModel_ReturnsGPT5(t *testing.T) {
	// Test that getBestTextModel returns "gpt-5"
	service := &AIService{}
	model := service.getBestTextModel()

	if model != "gpt-5" {
		t.Errorf("Expected getBestTextModel() to return 'gpt-5', got '%s'", model)
	}
}

func TestSanitizeParams_NilPointers_DoesNotPanic(t *testing.T) {
	// Test that sanitizeParams handles nil pointers gracefully
	params := &ChatParams{
		Model:            "gpt-5",
		MaxTokens:        1000,
		Temperature:      nil,
		TopP:             nil,
		N:                nil,
		PresencePenalty:  nil,
		FrequencyPenalty: nil,
	}

	// Should not panic
	sanitizeParams("gpt-5", params)

	// Verify conversion still works
	if params.MaxCompletionTokens != 1000 {
		t.Errorf("Expected MaxCompletionTokens=1000, got %d", params.MaxCompletionTokens)
	}
	if params.MaxTokens != 0 {
		t.Errorf("Expected MaxTokens=0, got %d", params.MaxTokens)
	}
}

func TestSanitizeParams_ZeroMaxTokens_DoesNotConvert(t *testing.T) {
	// Test that zero MaxTokens is not converted for GPT-5
	params := &ChatParams{
		Model:     "gpt-5",
		MaxTokens: 0,
	}

	sanitizeParams("gpt-5", params)

	// Should not convert zero MaxTokens
	if params.MaxCompletionTokens != 0 {
		t.Errorf("Expected MaxCompletionTokens=0 when MaxTokens=0, got %d", params.MaxCompletionTokens)
	}
	if params.MaxTokens != 0 {
		t.Errorf("Expected MaxTokens=0 (unchanged), got %d", params.MaxTokens)
	}
}
