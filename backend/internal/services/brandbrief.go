package services

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"cloud.google.com/go/storage"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"bezz-backend/internal/models"

	"google.golang.org/api/iterator"
)

// BrandBriefService handles brand brief operations
type BrandBriefService struct {
	db         *firestore.Client
	aiService  *AIService
	storage    *storage.Client
	bucketName string
}

// NewBrandBriefService creates a new brand brief service
func NewBrandBriefService(db *firestore.Client, aiService *AIService, storage *storage.Client, bucketName string) *BrandBriefService {
	return &BrandBriefService{
		db:         db,
		aiService:  aiService,
		storage:    storage,
		bucketName: bucketName,
	}
}

// CreateBrief creates a new brand brief and starts processing
func (s *BrandBriefService) CreateBrief(ctx context.Context, userID string, req *models.BrandBriefRequest) (*models.BrandBrief, error) {
	log.Printf("🏗️ BRIEF SERVICE: Creating brief for user %s", userID)

	// Create brief document
	briefID := generateID()
	brief := &models.BrandBrief{
		ID:             briefID,
		UserID:         userID,
		CompanyName:    req.CompanyName,
		Sector:         req.Sector,
		Tone:           req.Tone,
		TargetAudience: req.TargetAudience,
		Language:       req.Language,
		AdditionalInfo: req.AdditionalInfo,
		Status:         "processing",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	log.Printf("📝 BRIEF SERVICE: Brief data - ID:%s, Company:%s, Sector:%s", briefID, req.CompanyName, req.Sector)

	// Save to Firestore
	log.Printf("💾 BRIEF SERVICE: Saving to Firestore...")
	_, err := s.db.Collection("briefs").Doc(brief.ID).Set(ctx, brief)
	if err != nil {
		log.Printf("❌ BRIEF SERVICE: Failed to save to Firestore: %v", err)
		return nil, err
	}

	log.Printf("✅ BRIEF SERVICE: Brief saved successfully")

	// Start async processing
	log.Printf("🚀 BRIEF SERVICE: Starting async AI processing...")
	go s.processBrief(context.Background(), brief)

	return brief, nil
}

// GetBrief retrieves a brand brief by ID
func (s *BrandBriefService) GetBrief(ctx context.Context, briefID string) (*models.BrandBrief, error) {
	log.Printf("📖 BRIEF SERVICE: Getting brief %s from Firestore", briefID)

	doc, err := s.db.Collection("briefs").Doc(briefID).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			log.Printf("❌ BRIEF SERVICE: Brief %s not found in Firestore", briefID)
			return nil, fmt.Errorf("brief not found")
		}
		log.Printf("❌ BRIEF SERVICE: Firestore error getting brief %s: %v", briefID, err)
		return nil, err
	}

	log.Printf("📄 BRIEF SERVICE: Brief %s retrieved, parsing data...", briefID)
	var brief models.BrandBrief
	if err := doc.DataTo(&brief); err != nil {
		log.Printf("❌ BRIEF SERVICE: Failed to parse brief %s data: %v", briefID, err)
		return nil, err
	}

	log.Printf("✅ BRIEF SERVICE: Brief %s parsed successfully (status: %s)", briefID, brief.Status)
	return &brief, nil
}

// ListBriefs lists briefs for a user
func (s *BrandBriefService) ListBriefs(ctx context.Context, userID string, limit int) ([]*models.BrandBrief, error) {
	log.Printf("📚 BRIEF SERVICE: Listing briefs for user %s (limit: %d)", userID, limit)

	// Query with ordering by creation date (newest first)
	// Note: This requires a composite index in Firestore (userId + createdAt DESC)
	query := s.db.Collection("briefs").
		Where("userId", "==", userID).
		OrderBy("createdAt", firestore.Desc).
		Limit(limit)

	log.Printf("🔍 BRIEF SERVICE: Executing Firestore query...")
	docs, err := query.Documents(ctx).GetAll()
	if err != nil {
		log.Printf("❌ BRIEF SERVICE: Firestore query failed: %v", err)
		return nil, err
	}

	log.Printf("📄 BRIEF SERVICE: Retrieved %d documents from Firestore", len(docs))

	briefs := make([]*models.BrandBrief, len(docs))
	for i, doc := range docs {
		log.Printf("📋 BRIEF SERVICE: Processing document %d: %s", i, doc.Ref.ID)
		var brief models.BrandBrief
		if err := doc.DataTo(&brief); err != nil {
			log.Printf("❌ BRIEF SERVICE: Failed to parse document %s: %v", doc.Ref.ID, err)
			return nil, err
		}
		briefs[i] = &brief
	}

	log.Printf("✅ BRIEF SERVICE: Successfully parsed %d briefs", len(briefs))
	return briefs, nil
}

// DeleteBrief deletes a brand brief
func (s *BrandBriefService) DeleteBrief(ctx context.Context, briefID, userID string) error {
	// Verify ownership
	brief, err := s.GetBrief(ctx, briefID)
	if err != nil {
		return err
	}

	if brief.UserID != userID {
		return fmt.Errorf("access denied")
	}

	// Delete from Firestore
	_, err = s.db.Collection("briefs").Doc(briefID).Delete(ctx)
	return err
}

// RetryProcessing retries processing for a failed brief
func (s *BrandBriefService) RetryProcessing(ctx context.Context, briefID string) error {
	log.Printf("🔄 RETRY SERVICE: Starting retry for brief %s", briefID)

	// Get the brief
	brief, err := s.GetBrief(ctx, briefID)
	if err != nil {
		log.Printf("❌ RETRY SERVICE: Failed to get brief %s: %v", briefID, err)
		return fmt.Errorf("failed to get brief: %w", err)
	}

	// Check if brief is in a retryable state
	if brief.Status != "failed" && brief.Status != "ads_failed" && brief.Status != "images_failed" {
		log.Printf("❌ RETRY SERVICE: Brief %s is not in a retryable state (current status: %s)", briefID, brief.Status)
		return fmt.Errorf("brief is not in a retryable state: %s", brief.Status)
	}

	log.Printf("✅ RETRY SERVICE: Brief %s is retryable (status: %s)", briefID, brief.Status)

	// Start processing in a goroutine with a fresh background context
	// We can't use the HTTP request context because it gets cancelled when the request completes
	go func() {
		// Create a fresh background context for the retry processing
		backgroundCtx := context.Background()
		log.Printf("🔄 RETRY SERVICE: Starting background processing for brief %s", briefID)
		s.processBrief(backgroundCtx, brief)
	}()

	log.Printf("🚀 RETRY SERVICE: Started retry processing for brief %s", briefID)
	return nil
}

// processBrief processes a brand brief using the new GPT pipeline
func (s *BrandBriefService) processBrief(ctx context.Context, brief *models.BrandBrief) {
	log.Printf("🧠 AI PIPELINE: Starting processing for brief %s", brief.ID)

	// Update status to processing
	log.Printf("📊 AI PIPELINE: Updating status to processing...")
	s.updateBriefStatus(ctx, brief.ID, "processing")

	// Execute the Brief-GPT -> Strategist-GPT pipeline
	log.Printf("🤖 AI PIPELINE: Executing Brief-GPT -> Strategist-GPT pipeline...")
	strategy, err := s.aiService.ProcessBriefPipeline(ctx, brief)
	if err != nil {
		log.Printf("❌ AI PIPELINE: Strategy generation failed for brief %s: %v", brief.ID, err)
		s.updateBriefStatus(ctx, brief.ID, "failed")
		return
	}

	log.Printf("✅ AI PIPELINE: Strategy generated successfully for brief %s", brief.ID)

	// Generate brand name alternatives
	log.Printf("🏷️ AI PIPELINE: Starting brand name generation...")
	brandNames, err := s.aiService.GenerateBrandNames(ctx, brief, strategy)
	if err != nil {
		log.Printf("⚠️ AI PIPELINE: Brand name generation failed, continuing without alternatives: %v", err)
		brandNames = []models.BrandNameSuggestion{} // Graceful degradation
	}

	log.Printf("✅ AI PIPELINE: Generated %d brand name suggestions", len(brandNames))

	// Generate brand identity (logo + colors)
	log.Printf("🎨 AI PIPELINE: Starting brand identity generation...")
	brandIdentity, err := s.aiService.GenerateBrandIdentity(ctx, strategy, brief.CompanyName, brief.Sector, brief.TargetAudience)
	if err != nil {
		log.Printf("⚠️ AI PIPELINE: Brand identity generation failed, continuing without identity: %v", err)
		brandIdentity = nil // Graceful degradation
	}

	if brandIdentity != nil {
		log.Printf("✅ AI PIPELINE: Generated brand identity with %d colors", len(brandIdentity.ColorPalette))
	}

	// Update status to strategy completed
	log.Printf("💾 AI PIPELINE: Saving strategy, brand names, and identity to Firestore...")
	s.updateBriefStatusWithStrategyNamesAndIdentity(ctx, brief.ID, "strategy_completed", strategy, brandNames, brandIdentity)

	// Generate ad campaigns
	log.Printf("🎨 AI PIPELINE: Starting ad campaign generation...")
	adSpecs, err := s.aiService.GenerateAds(ctx, strategy)
	if err != nil {
		log.Printf("❌ AI PIPELINE: Ad generation failed for brief %s: %v", brief.ID, err)
		s.updateBriefStatus(ctx, brief.ID, "ads_failed")
		return
	}

	log.Printf("✅ AI PIPELINE: Generated %d ad specifications", len(adSpecs.Ads))

	// Generate images for ads
	log.Printf("🖼️ AI PIPELINE: Starting image generation...")
	ads, err := s.aiService.RenderImages(ctx, adSpecs.Ads, brief.CompanyName, brief.Sector)
	if err != nil {
		log.Printf("❌ AI PIPELINE: Image generation failed for brief %s: %v", brief.ID, err)
		s.updateBriefStatus(ctx, brief.ID, "images_failed")
		return
	}

	log.Printf("✅ AI PIPELINE: Generated %d complete ads with images", len(ads))

	// Update status with ads
	log.Printf("💾 AI PIPELINE: Saving ads to Firestore...")
	s.updateBriefStatusWithAds(ctx, brief.ID, "ads_completed", ads)

	// Mark as completed
	log.Printf("🎉 AI PIPELINE: Marking brief %s as completed", brief.ID)
	s.updateBriefStatus(ctx, brief.ID, "completed")
}

// updateBriefStatusWithStrategy updates brief with strategy data
func (s *BrandBriefService) updateBriefStatusWithStrategy(ctx context.Context, briefID, status string, strategy *models.BrandStrategy) {
	updates := []firestore.Update{
		{Path: "status", Value: status},
		{Path: "results.strategy", Value: strategy},
		{Path: "updatedAt", Value: time.Now()},
	}

	_, err := s.db.Collection("briefs").Doc(briefID).Update(ctx, updates)
	if err != nil {
		log.Printf("Failed to update brief %s with strategy: %v", briefID, err)
	}
}

// updateBriefStatusWithStrategyAndNames updates brief with strategy data and brand names
func (s *BrandBriefService) updateBriefStatusWithStrategyAndNames(ctx context.Context, briefID, status string, strategy *models.BrandStrategy, brandNames []models.BrandNameSuggestion) {
	updates := []firestore.Update{
		{Path: "status", Value: status},
		{Path: "results.strategy", Value: strategy},
		{Path: "results.brandNames", Value: brandNames},
		{Path: "updatedAt", Value: time.Now()},
	}

	_, err := s.db.Collection("briefs").Doc(briefID).Update(ctx, updates)
	if err != nil {
		log.Printf("Failed to update brief %s with strategy and brand names: %v", briefID, err)
	}
}

// updateBriefStatusWithStrategyNamesAndIdentity updates brief with strategy, names, and brand identity
func (s *BrandBriefService) updateBriefStatusWithStrategyNamesAndIdentity(ctx context.Context, briefID, status string, strategy *models.BrandStrategy, brandNames []models.BrandNameSuggestion, brandIdentity *models.BrandIdentity) {
	updates := []firestore.Update{
		{Path: "status", Value: status},
		{Path: "results.strategy", Value: strategy},
		{Path: "results.brandNames", Value: brandNames},
		{Path: "updatedAt", Value: time.Now()},
	}

	// Only add brand identity if it was generated successfully
	if brandIdentity != nil {
		updates = append(updates, firestore.Update{Path: "results.brandIdentity", Value: brandIdentity})
	}

	_, err := s.db.Collection("briefs").Doc(briefID).Update(ctx, updates)
	if err != nil {
		log.Printf("Failed to update brief %s with strategy, names, and identity: %v", briefID, err)
	}
}

// updateBriefStatusWithAds updates brief with ads data
func (s *BrandBriefService) updateBriefStatusWithAds(ctx context.Context, briefID, status string, ads []models.AdCampaign) {
	updates := []firestore.Update{
		{Path: "status", Value: status},
		{Path: "results.ads", Value: ads},
		{Path: "updatedAt", Value: time.Now()},
	}

	_, err := s.db.Collection("briefs").Doc(briefID).Update(ctx, updates)
	if err != nil {
		log.Printf("Failed to update brief %s with ads: %v", briefID, err)
	}
}

// updateBriefStatus updates the status of a brief
func (s *BrandBriefService) updateBriefStatus(ctx context.Context, briefID, status string) {
	updates := []firestore.Update{
		{Path: "status", Value: status},
		{Path: "updatedAt", Value: time.Now()},
	}

	s.db.Collection("briefs").Doc(briefID).Update(ctx, updates)
}

// generateID generates a unique ID for documents
func generateID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

// RefreshImageURLs refreshes expired signed URLs for all campaign images in a brief
func (s *BrandBriefService) RefreshImageURLs(ctx context.Context, briefID, userID string) (*models.BrandBrief, error) {
	log.Printf("🔄 REFRESH IMAGE URLS: Starting for brief %s", briefID)

	// Get the brief first
	brief, err := s.GetBrief(ctx, briefID)
	if err != nil {
		return nil, err
	}

	// Verify ownership
	if brief.UserID != userID {
		return nil, fmt.Errorf("access denied")
	}

	// Check if brief has ads with images
	if brief.Results == nil || brief.Results.Ads == nil {
		return brief, nil // No ads to refresh
	}

	log.Printf("🔄 REFRESH IMAGE URLS: Found %d campaigns to refresh", len(brief.Results.Ads))

	// Refresh signed URLs for each campaign image
	for i, campaign := range brief.Results.Ads {
		if campaign.ImageURL == "" {
			continue
		}

		// Use stored object name if available, otherwise try to discover it
		objectName := campaign.ObjectName
		if objectName == "" {
			// Backward compatibility: try to discover object name from existing URL
			discoveredName, err := s.discoverObjectName(ctx, campaign.ImageURL, brief.CompanyName, i)
			if err != nil {
				log.Printf("⚠️ REFRESH IMAGE URLS: No object name found for campaign %d, skipping: %v", i, err)
				continue
			}
			objectName = discoveredName
			log.Printf("🔍 REFRESH IMAGE URLS: Discovered object name for campaign %d: %s", i, objectName)
		}

		// Generate new signed URL
		newSignedURL, err := s.aiService.GenerateSignedURL(ctx, objectName+".png")
		if err != nil {
			log.Printf("⚠️ REFRESH IMAGE URLS: Failed to refresh URL for campaign %d: %v", i, err)
			continue // Skip this image, keep the old URL
		}

		// Update the campaign with new signed URL
		brief.Results.Ads[i].ImageURL = newSignedURL
		log.Printf("✅ REFRESH IMAGE URLS: Refreshed URL for campaign %d using object: %s", i, objectName)
	}

	// Update the brief in Firestore
	updates := []firestore.Update{
		{Path: "results.ads", Value: brief.Results.Ads},
		{Path: "updatedAt", Value: firestore.ServerTimestamp},
	}

	_, err = s.db.Collection("briefs").Doc(briefID).Update(ctx, updates)
	if err != nil {
		return nil, fmt.Errorf("failed to update brief with refreshed URLs: %w", err)
	}

	log.Printf("✅ REFRESH IMAGE URLS: Successfully refreshed all URLs for brief %s", briefID)
	return brief, nil
}

// discoverObjectName attempts to discover the GCS object name for backward compatibility
func (s *BrandBriefService) discoverObjectName(ctx context.Context, imageURL, companyName string, campaignIndex int) (string, error) {
	// Try to list objects in the bucket that match the company name pattern
	bucket := s.storage.Bucket(s.bucketName)

	// Create a prefix to search for objects
	prefix := fmt.Sprintf("ads/%s_ad_", companyName)

	// List objects with the prefix
	query := &storage.Query{Prefix: prefix}
	objectIterator := bucket.Objects(ctx, query)

	// Look for objects that might match this campaign
	var possibleObjects []string
	for {
		objAttrs, err := objectIterator.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return "", fmt.Errorf("failed to list objects: %w", err)
		}

		// Remove the .png extension to get the object name
		objectName := strings.TrimSuffix(objAttrs.Name, ".png")
		possibleObjects = append(possibleObjects, objectName)
	}

	log.Printf("🔍 DISCOVER: Found %d possible objects for %s: %v", len(possibleObjects), companyName, possibleObjects)

	// If we have objects, try to pick the most likely match
	// Simple heuristic: if there are exactly as many objects as campaigns, use them in order
	if len(possibleObjects) > campaignIndex {
		return possibleObjects[campaignIndex], nil
	}

	return "", fmt.Errorf("no matching object found for campaign %d", campaignIndex)
}
