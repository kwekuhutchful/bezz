package handlers

import (
	"net/http"

	"bezz-backend/internal/services"

	"github.com/gin-gonic/gin"
)

// ExportHandler handles export-related requests
type ExportHandler struct {
	exportService *services.ExportService
}

// NewExportHandler creates a new export handler
func NewExportHandler(exportService *services.ExportService) *ExportHandler {
	return &ExportHandler{
		exportService: exportService,
	}
}

// CreateBatchExport generates a complete brand kit export
func (h *ExportHandler) CreateBatchExport(c *gin.Context) {
	briefID := c.Param("briefId")
	format := c.DefaultQuery("format", "zip") // Default to ZIP format

	// Validate format
	if format != "zip" && format != "pdf" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid format. Supported formats: zip, pdf",
		})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	// Generate batch export
	exportData, contentType, filename, err := h.exportService.GenerateBatchExport(c.Request.Context(), briefID, userID.(string), format)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate export: " + err.Error(),
		})
		return
	}

	// Set headers for file download
	c.Header("Content-Type", contentType)
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Length", string(rune(len(exportData))))

	// Send the file data
	c.Data(http.StatusOK, contentType, exportData)
}

// TestBrandIdentity tests brand identity generation for debugging
func (h *ExportHandler) TestBrandIdentity(c *gin.Context) {
	// This is a debug endpoint to test brand identity generation
	c.JSON(http.StatusOK, gin.H{
		"message": "Brand identity test endpoint - implement for debugging",
		"note":    "This endpoint can be used to test logo and color generation",
	})
}
