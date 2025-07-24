package middleware

import (
	"context"
	"net/http"
	"strings"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"github.com/gin-gonic/gin"

	"bezz-backend/internal/models"
)

// AuthRequired middleware validates Firebase JWT tokens
func AuthRequired(firebaseApp *firebase.App) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Error:   "Authorization header required",
			})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Error:   "Invalid authorization header format",
			})
			c.Abort()
			return
		}

		token := parts[1]

		// Verify the token
		client, err := firebaseApp.Auth(context.Background())
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Error:   "Failed to initialize Firebase Auth client",
			})
			c.Abort()
			return
		}

		decodedToken, err := client.VerifyIDToken(context.Background(), token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Error:   "Invalid or expired token",
			})
			c.Abort()
			return
		}

		// Store user information in context
		c.Set("userID", decodedToken.UID)
		c.Set("userEmail", decodedToken.Claims["email"])
		c.Set("firebaseToken", decodedToken)

		c.Next()
	}
}

// AdminRequired middleware checks if user has admin privileges
func AdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get Firebase token from context
		tokenInterface, exists := c.Get("firebaseToken")
		if !exists {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Error:   "No authentication token found",
			})
			c.Abort()
			return
		}

		token, ok := tokenInterface.(*auth.Token)
		if !ok {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Error:   "Invalid token format",
			})
			c.Abort()
			return
		}

		// Check for admin claim
		if adminClaim, exists := token.Claims["admin"]; !exists || adminClaim != true {
			c.JSON(http.StatusForbidden, models.APIResponse{
				Success: false,
				Error:   "Admin privileges required",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// GetUserID extracts user ID from context
func GetUserID(c *gin.Context) string {
	if userID, exists := c.Get("userID"); exists {
		if uid, ok := userID.(string); ok {
			return uid
		}
	}
	return ""
}

// GetUserEmail extracts user email from context
func GetUserEmail(c *gin.Context) string {
	if email, exists := c.Get("userEmail"); exists {
		if emailStr, ok := email.(string); ok {
			return emailStr
		}
	}
	return ""
}
