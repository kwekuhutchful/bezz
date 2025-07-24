package services

import (
	"context"
	"fmt"
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
	// Create brief document
	brief := &models.BrandBrief{
		ID:             generateID(),
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

	// Save to Firestore
	_, err := s.db.Collection("briefs").Doc(brief.ID).Set(ctx, brief)
	if err != nil {
		return nil, err
	}

	// Start async processing
	go s.processBrief(context.Background(), brief)

	return brief, nil
}

// GetBrief retrieves a brand brief by ID
func (s *BrandBriefService) GetBrief(ctx context.Context, briefID string) (*models.BrandBrief, error) {
	doc, err := s.db.Collection("briefs").Doc(briefID).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, fmt.Errorf("brief not found")
		}
		return nil, err
	}

	var brief models.BrandBrief
	if err := doc.DataTo(&brief); err != nil {
		return nil, err
	}

	return &brief, nil
}

// ListBriefs lists briefs for a user
func (s *BrandBriefService) ListBriefs(ctx context.Context, userID string, limit int) ([]*models.BrandBrief, error) {
	query := s.db.Collection("briefs").
		Where("userId", "==", userID).
		OrderBy("createdAt", firestore.Desc).
		Limit(limit)

	docs, err := query.Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}

	briefs := make([]*models.BrandBrief, len(docs))
	for i, doc := range docs {
		var brief models.BrandBrief
		if err := doc.DataTo(&brief); err != nil {
			return nil, err
		}
		briefs[i] = &brief
	}

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

// processBrief processes a brand brief asynchronously
func (s *BrandBriefService) processBrief(ctx context.Context, brief *models.BrandBrief) {
	// Update status to processing
	s.updateBriefStatus(ctx, brief.ID, "processing")

	// Generate brand strategy using AI
	results, err := s.aiService.GenerateBrandStrategy(ctx, brief)
	if err != nil {
		s.updateBriefStatus(ctx, brief.ID, "failed")
		return
	}

	// Generate images for ads
	for i := range results.Ads {
		imageURL, err := s.aiService.GenerateImage(ctx, results.Ads[i].ImagePrompt)
		if err != nil {
			// Log error but continue processing
			continue
		}
		results.Ads[i].ImageURL = imageURL
	}

	// Update brief with results
	updates := []firestore.Update{
		{Path: "results", Value: results},
		{Path: "status", Value: "completed"},
		{Path: "updatedAt", Value: time.Now()},
	}

	_, err = s.db.Collection("briefs").Doc(brief.ID).Update(ctx, updates)
	if err != nil {
		s.updateBriefStatus(ctx, brief.ID, "failed")
		return
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
