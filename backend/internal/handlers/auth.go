package handlers

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"bezz-backend/internal/models"
	"bezz-backend/internal/services"
)

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	authService *services.AuthService
	userService *services.UserService
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authService *services.AuthService, userService *services.UserService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		userService: userService,
	}
}

// SignUp handles user registration
func (h *AuthHandler) SignUp(c *gin.Context) {
	log.Printf("SignUp request received")

	var req models.SignUpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Failed to bind JSON: %v", err)
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid request format",
		})
		return
	}

	log.Printf("SignUp request data: email=%s, display_name=%s", req.Email, req.DisplayName)

	// Validate required fields
	if req.Email == "" || req.Password == "" || req.DisplayName == "" {
		log.Printf("Missing required fields: email=%s, password=%s, display_name=%s",
			req.Email,
			func() string {
				if req.Password == "" {
					return "empty"
				} else {
					return "provided"
				}
			}(),
			req.DisplayName)
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Email, password, and display name are required",
		})
		return
	}

	// Create user in Firebase Auth
	log.Printf("Creating user in Firebase Auth...")
	userRecord, err := h.authService.CreateUser(c.Request.Context(), req.Email, req.Password, req.DisplayName)
	if err != nil {
		log.Printf("Failed to create user in Firebase: %v", err)
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	log.Printf("User created in Firebase with UID: %s", userRecord.UID)

	// Create user profile in Firestore
	user := &models.User{
		ID:          userRecord.UID,
		Email:       req.Email,
		DisplayName: req.DisplayName,
		Credits:     10, // Welcome credits
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	log.Printf("Creating user profile in Firestore...")
	if err := h.userService.CreateUser(c.Request.Context(), user); err != nil {
		log.Printf("Failed to create user profile in Firestore: %v", err)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to create user profile",
		})
		return
	}

	log.Printf("User profile created successfully")

	// Sign in the user to get ID token
	log.Printf("Signing in user to get ID token...")
	_, authResp, err := h.authService.VerifyPassword(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		log.Printf("Failed to sign in user: %v", err)
		// User created but couldn't sign in - return success anyway
		c.JSON(http.StatusCreated, models.APIResponse{
			Success: true,
			Message: "Account created successfully. Please sign in.",
			Data: models.AuthResponse{
				Token: "", // No token
				User:  *user,
			},
		})
		return
	}

	log.Printf("SignUp completed successfully for user: %s", req.Email)

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Data: models.AuthResponse{
			Token: authResp.IDToken,
			User:  *user,
		},
	})
}

// SignIn handles user login
func (h *AuthHandler) SignIn(c *gin.Context) {
	log.Printf("SignIn request received")

	var req models.SignInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Failed to bind JSON: %v", err)
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid request format",
		})
		return
	}

	log.Printf("SignIn request data: email=%s", req.Email)

	// Validate required fields
	if req.Email == "" || req.Password == "" {
		log.Printf("Missing required fields: email=%s, password=%s",
			req.Email,
			func() string {
				if req.Password == "" {
					return "empty"
				} else {
					return "provided"
				}
			}())
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Email and password are required",
		})
		return
	}

	// Verify user credentials with Firebase Auth
	log.Printf("Verifying user credentials with Firebase...")
	userRecord, authResp, err := h.authService.VerifyPassword(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		log.Printf("Failed to verify credentials: %v", err)
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "Invalid email or password",
		})
		return
	}

	log.Printf("User authenticated successfully: UID=%s", userRecord.UID)

	// Get user profile from Firestore
	log.Printf("Getting user profile from Firestore...")
	user, err := h.userService.GetOrCreateUser(c.Request.Context(), userRecord.UID, userRecord.Email, userRecord.DisplayName, userRecord.PhotoURL)
	if err != nil {
		log.Printf("Failed to get user profile: %v", err)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to retrieve user profile",
		})
		return
	}

	log.Printf("SignIn completed successfully for user: %s", req.Email)

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: models.AuthResponse{
			Token: authResp.IDToken,
			User:  *user,
		},
	})
}

// RefreshToken handles token refresh
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req models.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid request format",
		})
		return
	}

	// Verify the current token
	token, err := h.authService.VerifyIDToken(c.Request.Context(), req.Token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "Invalid token",
		})
		return
	}

	// Generate new custom token
	newToken, err := h.authService.CreateCustomToken(c.Request.Context(), token.UID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to generate new token",
		})
		return
	}

	// Get updated user profile
	user, err := h.userService.GetUser(c.Request.Context(), token.UID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to retrieve user profile",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: models.AuthResponse{
			Token: newToken,
			User:  *user,
		},
	})
}

// ResetPassword handles password reset
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req models.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid request format",
		})
		return
	}

	if req.Email == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Email is required",
		})
		return
	}

	// Send password reset email via Firebase
	err := h.authService.SendPasswordResetEmail(c.Request.Context(), req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to send password reset email",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Password reset email sent successfully",
	})
}
