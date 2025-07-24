package services

import (
	"context"
	"fmt"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"bezz-backend/internal/models"
)

// UserService handles user-related operations
type UserService struct {
	db *firestore.Client
}

// NewUserService creates a new user service
func NewUserService(db *firestore.Client) *UserService {
	return &UserService{
		db: db,
	}
}

// GetUser retrieves a user by ID
func (s *UserService) GetUser(ctx context.Context, userID string) (*models.User, error) {
	doc, err := s.db.Collection("users").Doc(userID).Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}

	var user models.User
	if err := doc.DataTo(&user); err != nil {
		return nil, err
	}

	return &user, nil
}

// CreateUser creates a new user
func (s *UserService) CreateUser(ctx context.Context, user *models.User) error {
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	user.Credits = 5 // Default credits for new users

	_, err := s.db.Collection("users").Doc(user.ID).Set(ctx, user)
	return err
}

// UpdateUser updates an existing user
func (s *UserService) UpdateUser(ctx context.Context, userID string, updates map[string]interface{}) (*models.User, error) {
	updates["updatedAt"] = time.Now()

	_, err := s.db.Collection("users").Doc(userID).Update(ctx, []firestore.Update{
		{Path: "updatedAt", Value: time.Now()},
	})
	if err != nil {
		return nil, err
	}

	// Apply updates
	for field, value := range updates {
		_, err = s.db.Collection("users").Doc(userID).Update(ctx, []firestore.Update{
			{Path: field, Value: value},
		})
		if err != nil {
			return nil, err
		}
	}

	return s.GetUser(ctx, userID)
}

// GetOrCreateUser gets a user or creates one if it doesn't exist
func (s *UserService) GetOrCreateUser(ctx context.Context, userID, email, displayName, photoURL string) (*models.User, error) {
	user, err := s.GetUser(ctx, userID)
	if err == nil {
		return user, nil
	}

	// User doesn't exist, create new one
	newUser := &models.User{
		ID:          userID,
		Email:       email,
		DisplayName: displayName,
		PhotoURL:    photoURL,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Credits:     5, // Default credits
	}

	if err := s.CreateUser(ctx, newUser); err != nil {
		return nil, err
	}

	return newUser, nil
}

// DeductCredits deducts credits from a user's account
func (s *UserService) DeductCredits(ctx context.Context, userID string, amount int) error {
	return s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		doc := s.db.Collection("users").Doc(userID)

		// Get current user data
		docSnap, err := tx.Get(doc)
		if err != nil {
			return err
		}

		var user models.User
		if err := docSnap.DataTo(&user); err != nil {
			return err
		}

		// Check if user has enough credits
		if user.Credits < amount {
			return fmt.Errorf("insufficient credits: has %d, needs %d", user.Credits, amount)
		}

		// Deduct credits
		user.Credits -= amount
		user.UpdatedAt = time.Now()

		return tx.Set(doc, user)
	})
}

// AddCredits adds credits to a user's account
func (s *UserService) AddCredits(ctx context.Context, userID string, amount int) error {
	return s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		doc := s.db.Collection("users").Doc(userID)

		// Get current user data
		docSnap, err := tx.Get(doc)
		if err != nil {
			return err
		}

		var user models.User
		if err := docSnap.DataTo(&user); err != nil {
			return err
		}

		// Add credits
		user.Credits += amount
		user.UpdatedAt = time.Now()

		return tx.Set(doc, user)
	})
}

// UpdateSubscription updates a user's subscription
func (s *UserService) UpdateSubscription(ctx context.Context, userID string, subscription *models.Subscription) error {
	updates := []firestore.Update{
		{Path: "subscription", Value: subscription},
		{Path: "updatedAt", Value: time.Now()},
	}

	_, err := s.db.Collection("users").Doc(userID).Update(ctx, updates)
	return err
}

// ListUsers lists all users (admin only)
func (s *UserService) ListUsers(ctx context.Context, limit int, offset int) ([]*models.User, error) {
	query := s.db.Collection("users").
		OrderBy("createdAt", firestore.Desc).
		Limit(limit).
		Offset(offset)

	docs, err := query.Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}

	users := make([]*models.User, len(docs))
	for i, doc := range docs {
		var user models.User
		if err := doc.DataTo(&user); err != nil {
			return nil, err
		}
		users[i] = &user
	}

	return users, nil
}
