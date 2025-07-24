package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"bezz-backend/internal/middleware"
	"bezz-backend/internal/models"
	"bezz-backend/internal/services"
)

// BrandBriefHandler handles brand brief endpoints
type BrandBriefHandler struct {
	briefService *services.BrandBriefService
	userService  *services.UserService
}

// NewBrandBriefHandler creates a new brand brief handler
func NewBrandBriefHandler(briefService *services.BrandBriefService, userService *services.UserService) *BrandBriefHandler {
	return &BrandBriefHandler{
		briefService: briefService,
		userService:  userService,
	}
}

// Create creates a new brand brief
func (h *BrandBriefHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "User not authenticated",
		})
		return
	}

	var req models.BrandBriefRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid request body",
		})
		return
	}

	// Check user credits
	user, err := h.userService.GetOrCreateUser(c.Request.Context(), userID, middleware.GetUserEmail(c), "", "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to get user information",
		})
		return
	}

	if user.Credits < 1 {
		c.JSON(http.StatusPaymentRequired, models.APIResponse{
			Success: false,
			Error:   "Insufficient credits",
		})
		return
	}

	// Deduct credits
	if err := h.userService.DeductCredits(c.Request.Context(), userID, 1); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to deduct credits",
		})
		return
	}

	// Create brief
	brief, err := h.briefService.CreateBrief(c.Request.Context(), userID, &req)
	if err != nil {
		// Refund credits on failure
		h.userService.AddCredits(c.Request.Context(), userID, 1)

		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to create brief",
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Data:    brief,
		Message: "Brand brief created successfully",
	})
}

// List lists brand briefs for the authenticated user
func (h *BrandBriefHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "User not authenticated",
		})
		return
	}

	limit := 20
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	briefs, err := h.briefService.ListBriefs(c.Request.Context(), userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to list briefs",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    briefs,
	})
}

// GetByID retrieves a specific brand brief
func (h *BrandBriefHandler) GetByID(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "User not authenticated",
		})
		return
	}

	briefID := c.Param("id")
	if briefID == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Brief ID is required",
		})
		return
	}

	brief, err := h.briefService.GetBrief(c.Request.Context(), briefID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Error:   "Brief not found",
		})
		return
	}

	// Check ownership
	if brief.UserID != userID {
		c.JSON(http.StatusForbidden, models.APIResponse{
			Success: false,
			Error:   "Access denied",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    brief,
	})
}

// Delete deletes a brand brief
func (h *BrandBriefHandler) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "User not authenticated",
		})
		return
	}

	briefID := c.Param("id")
	if briefID == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Brief ID is required",
		})
		return
	}

	err := h.briefService.DeleteBrief(c.Request.Context(), briefID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to delete brief",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Brief deleted successfully",
	})
}
