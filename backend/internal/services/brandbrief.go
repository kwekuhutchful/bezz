package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"cloud.google.com/go/firestore"
	"cloud.google.com/go/storage"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"bezz-backend/internal/models"
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

	// Simplified query without OrderBy to avoid composite index requirement
	query := s.db.Collection("briefs").
		Where("userId", "==", userID).
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

	// Update status to strategy completed
	log.Printf("💾 AI PIPELINE: Saving strategy to Firestore...")
	s.updateBriefStatusWithStrategy(ctx, brief.ID, "strategy_completed", strategy)

	// TODO: Continue with ad campaign generation if needed
	// For now, we mark as completed after strategy generation
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
