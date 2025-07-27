package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"firebase.google.com/go/v4/auth"
)

// FirebaseAuthResponse represents the response from Firebase Auth REST API
type FirebaseAuthResponse struct {
	IDToken      string `json:"idToken"`
	RefreshToken string `json:"refreshToken"`
	ExpiresIn    string `json:"expiresIn"`
	LocalID      string `json:"localId"`
	Email        string `json:"email"`
}

// AuthService handles Firebase authentication operations
type AuthService struct {
	authClient *auth.Client
	apiKey     string
}

// NewAuthService creates a new auth service
func NewAuthService(authClient *auth.Client, apiKey string) *AuthService {
	if apiKey == "" {
		log.Printf("WARNING: Firebase API key not provided. Firebase Auth REST API will not work.")
		apiKey = "your_firebase_api_key_here" // Placeholder
	} else {
		log.Printf("Firebase API key loaded successfully: %s...", apiKey[:8])
	}

	return &AuthService{
		authClient: authClient,
		apiKey:     apiKey,
	}
}

// CreateUser creates a new user in Firebase Auth
func (s *AuthService) CreateUser(ctx context.Context, email, password, displayName string) (*auth.UserRecord, error) {
	params := (&auth.UserToCreate{}).
		Email(email).
		Password(password).
		DisplayName(displayName).
		EmailVerified(false)

	userRecord, err := s.authClient.CreateUser(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return userRecord, nil
}

// VerifyPassword verifies user credentials using Firebase Auth REST API
func (s *AuthService) VerifyPassword(ctx context.Context, email, password string) (*auth.UserRecord, *FirebaseAuthResponse, error) {
	log.Printf("VerifyPassword called for email: %s", email)

	// Use Firebase Auth REST API to verify password
	url := fmt.Sprintf("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=%s", s.apiKey)
	log.Printf("Firebase Auth URL: %s", url)

	payload := map[string]interface{}{
		"email":             email,
		"password":          password,
		"returnSecureToken": true,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Failed to marshal request payload: %v", err)
		return nil, nil, err
	}

	log.Printf("Sending request to Firebase Auth REST API...")
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("HTTP request failed: %v", err)
		return nil, nil, fmt.Errorf("failed to verify password: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read response body: %v", err)
		return nil, nil, err
	}

	log.Printf("Firebase Auth response status: %d", resp.StatusCode)
	log.Printf("Firebase Auth response body: %s", string(body))

	if resp.StatusCode != http.StatusOK {
		var errorResp map[string]interface{}
		json.Unmarshal(body, &errorResp)
		log.Printf("Firebase Auth error response: %+v", errorResp)
		return nil, nil, fmt.Errorf("invalid credentials")
	}

	var authResp FirebaseAuthResponse
	if err := json.Unmarshal(body, &authResp); err != nil {
		log.Printf("Failed to unmarshal auth response: %v", err)
		return nil, nil, err
	}

	log.Printf("Successfully got Firebase auth response for user: %s", authResp.LocalID)

	// Get user record
	log.Printf("Getting user record from Firebase Admin SDK...")
	userRecord, err := s.authClient.GetUser(ctx, authResp.LocalID)
	if err != nil {
		log.Printf("Failed to get user record: %v", err)
		return nil, nil, fmt.Errorf("failed to get user record: %w", err)
	}

	log.Printf("Successfully retrieved user record for UID: %s", userRecord.UID)
	return userRecord, &authResp, nil
}

// CreateCustomToken creates a custom token for the user
func (s *AuthService) CreateCustomToken(ctx context.Context, uid string) (string, error) {
	token, err := s.authClient.CustomToken(ctx, uid)
	if err != nil {
		return "", fmt.Errorf("failed to create custom token: %w", err)
	}

	return token, nil
}

// VerifyIDToken verifies an ID token
func (s *AuthService) VerifyIDToken(ctx context.Context, idToken string) (*auth.Token, error) {
	token, err := s.authClient.VerifyIDToken(ctx, idToken)
	if err != nil {
		return nil, fmt.Errorf("failed to verify ID token: %w", err)
	}

	return token, nil
}

// SendPasswordResetEmail sends a password reset email using Firebase Auth REST API
func (s *AuthService) SendPasswordResetEmail(ctx context.Context, email string) error {
	url := fmt.Sprintf("https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=%s", s.apiKey)

	payload := map[string]interface{}{
		"requestType": "PASSWORD_RESET",
		"email":       email,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to send password reset email: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		var errorResp map[string]interface{}
		json.Unmarshal(body, &errorResp)
		return fmt.Errorf("failed to send password reset email")
	}

	return nil
}

// GetUser gets a user by UID
func (s *AuthService) GetUser(ctx context.Context, uid string) (*auth.UserRecord, error) {
	userRecord, err := s.authClient.GetUser(ctx, uid)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return userRecord, nil
}

// UpdateUser updates a user's information
func (s *AuthService) UpdateUser(ctx context.Context, uid string, displayName, email string) (*auth.UserRecord, error) {
	params := (&auth.UserToUpdate{}).
		DisplayName(displayName).
		Email(email)

	userRecord, err := s.authClient.UpdateUser(ctx, uid, params)
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return userRecord, nil
}

// DeleteUser deletes a user
func (s *AuthService) DeleteUser(ctx context.Context, uid string) error {
	err := s.authClient.DeleteUser(ctx, uid)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	return nil
}
