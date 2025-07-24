package config

import (
	"os"
)

// Config holds all configuration for the application
type Config struct {
	Environment string
	Port        string

	// Firebase
	FirebaseProjectID string

	// OpenAI
	OpenAIAPIKey string

	// Stripe
	StripeSecretKey     string
	StripeWebhookSecret string

	// Google Cloud Storage
	GCSBucketName string

	// Database
	DatabaseURL string
}

// Load loads configuration from environment variables
func Load() *Config {
	return &Config{
		Environment: getEnv("NODE_ENV", "development"),
		Port:        getEnv("PORT", "8080"),

		// Firebase
		FirebaseProjectID: getEnv("FIREBASE_PROJECT_ID", ""),

		// OpenAI
		OpenAIAPIKey: getEnv("OPENAI_API_KEY", ""),

		// Stripe
		StripeSecretKey:     getEnv("STRIPE_SECRET_KEY", ""),
		StripeWebhookSecret: getEnv("STRIPE_WEBHOOK_SECRET", ""),

		// Google Cloud Storage
		GCSBucketName: getEnv("GCS_BUCKET_NAME", ""),

		// Database
		DatabaseURL: getEnv("DATABASE_URL", ""),
	}
}

// getEnv gets an environment variable with a fallback value
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
