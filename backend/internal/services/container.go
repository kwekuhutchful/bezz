package services

import (
	"context"
	"log"

	"cloud.google.com/go/firestore"
	"cloud.google.com/go/storage"
	firebase "firebase.google.com/go/v4"
	"github.com/sashabaranov/go-openai"
	"github.com/stripe/stripe-go/v76"

	"bezz-backend/internal/config"
)

// Container holds all service dependencies
type Container struct {
	Config            *config.Config
	Firebase          *firebase.App
	Firestore         *firestore.Client
	Storage           *storage.Client
	OpenAI            *openai.Client
	AuthService       *AuthService
	AIService         *AIService
	UserService       *UserService
	BrandBriefService *BrandBriefService
	PaymentService    *PaymentService
}

// NewContainer creates a new service container
func NewContainer(cfg *config.Config) (*Container, error) {
	ctx := context.Background()

	// Initialize Firebase
	firebaseApp, err := firebase.NewApp(ctx, &firebase.Config{
		ProjectID: cfg.FirebaseProjectID,
	})
	if err != nil {
		return nil, err
	}

	// Initialize Firestore
	firestoreClient, err := firebaseApp.Firestore(ctx)
	if err != nil {
		return nil, err
	}

	// Initialize Cloud Storage
	storageClient, err := storage.NewClient(ctx)
	if err != nil {
		return nil, err
	}

	// Initialize OpenAI client
	openaiClient := openai.NewClient(cfg.OpenAIAPIKey)

	// Initialize Stripe
	stripe.Key = cfg.StripeSecretKey

	// Get Firebase Auth client
	authClient, err := firebaseApp.Auth(context.Background())
	if err != nil {
		return nil, err
	}

	// Create service instances
	authService := NewAuthService(authClient)
	aiService := NewAIService(openaiClient)
	userService := NewUserService(firestoreClient)
	brandBriefService := NewBrandBriefService(firestoreClient, aiService, storageClient, cfg.GCSBucketName)
	paymentService := NewPaymentService(cfg.StripeSecretKey, cfg.StripeWebhookSecret)

	container := &Container{
		Config:            cfg,
		Firebase:          firebaseApp,
		Firestore:         firestoreClient,
		Storage:           storageClient,
		OpenAI:            openaiClient,
		AuthService:       authService,
		AIService:         aiService,
		UserService:       userService,
		BrandBriefService: brandBriefService,
		PaymentService:    paymentService,
	}

	return container, nil
}

// Close closes all service connections
func (c *Container) Close() {
	if c.Firestore != nil {
		if err := c.Firestore.Close(); err != nil {
			log.Printf("Error closing Firestore client: %v", err)
		}
	}

	if c.Storage != nil {
		if err := c.Storage.Close(); err != nil {
			log.Printf("Error closing Storage client: %v", err)
		}
	}
}
