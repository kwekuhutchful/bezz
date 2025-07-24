package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"bezz-backend/internal/models"
	"bezz-backend/internal/services"
)

// AdminHandler handles admin endpoints
type AdminHandler struct {
	userService  *services.UserService
	briefService *services.BrandBriefService
}

// NewAdminHandler creates a new admin handler
func NewAdminHandler(userService *services.UserService, briefService *services.BrandBriefService) *AdminHandler {
	return &AdminHandler{
		userService:  userService,
		briefService: briefService,
	}
}

// GetMetrics returns platform metrics
func (h *AdminHandler) GetMetrics(c *gin.Context) {
	// TODO: Implement metrics collection
	metrics := map[string]interface{}{
		"total_users":  0,
		"total_briefs": 0,
		"active_users": 0,
		"revenue":      0,
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    metrics,
	})
}

// GetUsers returns a list of users
func (h *AdminHandler) GetUsers(c *gin.Context) {
	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 200 {
			limit = parsed
		}
	}

	offset := 0
	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	users, err := h.userService.ListUsers(c.Request.Context(), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to list users",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    users,
	})
}
