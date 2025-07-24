package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"bezz-backend/internal/middleware"
	"bezz-backend/internal/models"
	"bezz-backend/internal/services"
)

// UserHandler handles user endpoints
type UserHandler struct {
	userService *services.UserService
}

// NewUserHandler creates a new user handler
func NewUserHandler(userService *services.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// GetProfile gets the current user's profile
func (h *UserHandler) GetProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "User not authenticated",
		})
		return
	}

	user, err := h.userService.GetOrCreateUser(
		c.Request.Context(),
		userID,
		middleware.GetUserEmail(c),
		"", // displayName will be updated if provided
		"", // photoURL will be updated if provided
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to get user profile",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    user,
	})
}

// UpdateProfile updates the current user's profile
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "User not authenticated",
		})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid request body",
		})
		return
	}

	// Remove fields that shouldn't be updated directly
	delete(updates, "id")
	delete(updates, "email")
	delete(updates, "createdAt")
	delete(updates, "credits")
	delete(updates, "subscription")

	user, err := h.userService.UpdateUser(c.Request.Context(), userID, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to update profile",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    user,
		Message: "Profile updated successfully",
	})
}
