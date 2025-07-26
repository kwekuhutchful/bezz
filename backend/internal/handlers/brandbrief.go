package handlers

import (
	"log"
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
	log.Printf("🚀 CREATE BRIEF: Starting request")

	userID := middleware.GetUserID(c)
	userEmail := middleware.GetUserEmail(c)
	log.Printf("📧 CREATE BRIEF: UserID=%s, Email=%s", userID, userEmail)

	if userID == "" {
		log.Printf("❌ CREATE BRIEF: User not authenticated")
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "User not authenticated",
		})
		return
	}

	var req models.BrandBriefRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("❌ CREATE BRIEF: Invalid request body: %v", err)
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid request body",
		})
		return
	}

	log.Printf("📝 CREATE BRIEF: Request data - Company: %s, Sector: %s", req.CompanyName, req.Sector)

	// Check user credits
	log.Printf("🔍 CREATE BRIEF: Checking user credits...")
	user, err := h.userService.GetOrCreateUser(c.Request.Context(), userID, userEmail, "", "")
	if err != nil {
		log.Printf("❌ CREATE BRIEF: Failed to get user information: %v", err)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to get user information",
		})
		return
	}

	log.Printf("💳 CREATE BRIEF: User credits: %d", user.Credits)

	if user.Credits < 1 {
		log.Printf("❌ CREATE BRIEF: Insufficient credits (%d)", user.Credits)
		c.JSON(http.StatusPaymentRequired, models.APIResponse{
			Success: false,
			Error:   "Insufficient credits",
		})
		return
	}

	// Deduct credits
	log.Printf("💰 CREATE BRIEF: Deducting 1 credit...")
	if err := h.userService.DeductCredits(c.Request.Context(), userID, 1); err != nil {
		log.Printf("❌ CREATE BRIEF: Failed to deduct credits: %v", err)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to deduct credits",
		})
		return
	}

	// Create brief
	log.Printf("📄 CREATE BRIEF: Creating brief document...")
	brief, err := h.briefService.CreateBrief(c.Request.Context(), userID, &req)
	if err != nil {
		log.Printf("❌ CREATE BRIEF: Failed to create brief: %v", err)
		// Refund credits on failure
		log.Printf("💸 CREATE BRIEF: Refunding credit due to failure...")
		h.userService.AddCredits(c.Request.Context(), userID, 1)

		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to create brief",
		})
		return
	}

	log.Printf("✅ CREATE BRIEF: Success! Brief ID: %s", brief.ID)
	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Data:    brief,
		Message: "Brief created successfully",
	})
}

// List lists brand briefs for the authenticated user
func (h *BrandBriefHandler) List(c *gin.Context) {
	log.Printf("📋 LIST BRIEFS: Starting request")

	userID := middleware.GetUserID(c)
	userEmail := middleware.GetUserEmail(c)
	log.Printf("👤 LIST BRIEFS: UserID=%s, Email=%s", userID, userEmail)

	if userID == "" {
		log.Printf("❌ LIST BRIEFS: User not authenticated")
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

	log.Printf("🔍 LIST BRIEFS: Fetching briefs with limit=%d", limit)

	briefs, err := h.briefService.ListBriefs(c.Request.Context(), userID, limit)
	if err != nil {
		log.Printf("❌ LIST BRIEFS: Failed to list briefs: %v", err)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to list briefs",
		})
		return
	}

	log.Printf("✅ LIST BRIEFS: Found %d briefs", len(briefs))
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    briefs,
	})
}

// GetByID retrieves a specific brand brief
func (h *BrandBriefHandler) GetByID(c *gin.Context) {
	log.Printf("🔍 GET BRIEF: Starting request")

	userID := middleware.GetUserID(c)
	userEmail := middleware.GetUserEmail(c)
	log.Printf("👤 GET BRIEF: UserID=%s, Email=%s", userID, userEmail)

	if userID == "" {
		log.Printf("❌ GET BRIEF: User not authenticated")
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "User not authenticated",
		})
		return
	}

	briefID := c.Param("id")
	log.Printf("📄 GET BRIEF: Requested brief ID=%s", briefID)

	if briefID == "" {
		log.Printf("❌ GET BRIEF: Brief ID is required")
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Brief ID is required",
		})
		return
	}

	log.Printf("🔍 GET BRIEF: Fetching brief from service...")
	brief, err := h.briefService.GetBrief(c.Request.Context(), briefID)
	if err != nil {
		log.Printf("❌ GET BRIEF: Failed to get brief: %v", err)
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Error:   "Brief not found",
		})
		return
	}

	log.Printf("🔐 GET BRIEF: Checking ownership (brief.UserID=%s, userID=%s)", brief.UserID, userID)
	// Check ownership
	if brief.UserID != userID {
		log.Printf("❌ GET BRIEF: Access denied - ownership mismatch")
		c.JSON(http.StatusForbidden, models.APIResponse{
			Success: false,
			Error:   "Access denied",
		})
		return
	}

	log.Printf("✅ GET BRIEF: Success! Returning brief %s (status: %s)", brief.ID, brief.Status)
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

// RefreshImageURLs refreshes expired signed URLs for brief images
func (h *BrandBriefHandler) RefreshImageURLs(c *gin.Context) {
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

	log.Printf("🔄 REFRESH URLS: Starting for brief %s", briefID)

	brief, err := h.briefService.RefreshImageURLs(c.Request.Context(), briefID, userID)
	if err != nil {
		log.Printf("❌ REFRESH URLS: Failed for brief %s: %v", briefID, err)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to refresh image URLs",
		})
		return
	}

	log.Printf("✅ REFRESH URLS: Success for brief %s", briefID)
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    brief,
		Message: "Image URLs refreshed successfully",
	})
}
