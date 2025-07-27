package config

import (
	"context"
	"fmt"
	"log"
	"os"

	secretmanager "cloud.google.com/go/secretmanager/apiv1"
	"cloud.google.com/go/secretmanager/apiv1/secretmanagerpb"
)

// Config holds all configuration for the application
type Config struct {
	Environment string
	Port        string

	// CORS
	CORSAllowedOrigins string

	// Firebase
	FirebaseProjectID string
	FirebaseAPIKey    string

	// OpenAI
	OpenAIAPIKey string

	// Stripe
	StripeSecretKey     string
	StripeWebhookSecret string

	// Google Cloud Storage
	GCSBucketName string

	// Database
	DatabaseURL string

	// Google Cloud Project ID for Secret Manager
	ProjectID string
}

// Load loads configuration from environment variables or Secret Manager
func Load() *Config {
	projectID := getEnv("GOOGLE_CLOUD_PROJECT", "bezz-777eb")
	environment := getEnv("NODE_ENV", "development")

	config := &Config{
		Environment: environment,
		Port:        getEnv("PORT", "8080"),
		ProjectID:   projectID,
	}

	// In production, read from Secret Manager; in development, use env vars
	if environment == "production" {
		log.Println("Loading configuration from Google Cloud Secret Manager...")
		config.loadFromSecretManager()
	} else {
		log.Println("Loading configuration from environment variables...")
		config.loadFromEnv()
	}

	return config
}

// loadFromEnv loads configuration from environment variables (development)
func (c *Config) loadFromEnv() {
	c.CORSAllowedOrigins = getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001")
	c.FirebaseProjectID = getEnv("FIREBASE_PROJECT_ID", "")
	c.FirebaseAPIKey = getEnv("FIREBASE_API_KEY", "")
	c.OpenAIAPIKey = getEnv("OPENAI_API_KEY", "")
	c.StripeSecretKey = getEnv("STRIPE_SECRET_KEY", "")
	c.StripeWebhookSecret = getEnv("STRIPE_WEBHOOK_SECRET", "")
	c.GCSBucketName = getEnv("GCS_BUCKET_NAME", "")
	c.DatabaseURL = getEnv("DATABASE_URL", "")
}

// loadFromSecretManager loads configuration from Google Cloud Secret Manager (production)
func (c *Config) loadFromSecretManager() {
	ctx := context.Background()
	client, err := secretmanager.NewClient(ctx)
	if err != nil {
		log.Fatalf("Failed to create Secret Manager client: %v", err)
	}
	defer client.Close()

	// Production CORS origins
	c.CORSAllowedOrigins = "https://bezz-frontend-981046325818.us-central1.run.app"

	c.FirebaseProjectID = c.getSecret(ctx, client, "firebase-project-id")
	c.FirebaseAPIKey = c.getSecret(ctx, client, "firebase-api-key")
	c.OpenAIAPIKey = c.getSecret(ctx, client, "openai-api-key")
	c.StripeSecretKey = c.getSecret(ctx, client, "stripe-secret-key")
	c.StripeWebhookSecret = c.getSecret(ctx, client, "stripe-webhook-secret")
	c.GCSBucketName = c.getSecret(ctx, client, "gcs-bucket-name")
	c.DatabaseURL = getEnv("DATABASE_URL", "") // Keep as env var if needed
}

// getSecret retrieves a secret from Google Cloud Secret Manager
func (c *Config) getSecret(ctx context.Context, client *secretmanager.Client, secretName string) string {
	req := &secretmanagerpb.AccessSecretVersionRequest{
		Name: fmt.Sprintf("projects/%s/secrets/%s/versions/latest", c.ProjectID, secretName),
	}

	result, err := client.AccessSecretVersion(ctx, req)
	if err != nil {
		log.Printf("Failed to access secret %s: %v", secretName, err)
		return ""
	}

	return string(result.Payload.Data)
}

// getEnv gets an environment variable with a fallback value
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
