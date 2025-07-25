package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"bezz-backend/internal/config"
	"bezz-backend/internal/handlers"
	"bezz-backend/internal/middleware"
	"bezz-backend/internal/services"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Load configuration
	cfg := config.Load()

	// Initialize services
	serviceContainer, err := services.NewContainer(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize services: %v", err)
	}
	defer serviceContainer.Close()

	// Initialize handlers
	handlerContainer := handlers.NewContainer(serviceContainer)

	// Setup Gin router
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// CORS configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "https://yourdomain.com"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().Unix(),
			"version":   "1.0.0",
		})
	})

	// API routes
	api := router.Group("/api")
	{
		// Auth routes (public)
		auth := api.Group("/auth")
		{
			auth.POST("/signup", handlerContainer.Auth.SignUp)
			auth.POST("/signin", handlerContainer.Auth.SignIn)
			auth.POST("/refresh", handlerContainer.Auth.RefreshToken)
			auth.POST("/reset-password", handlerContainer.Auth.ResetPassword)
		}

		// Brand briefs routes (protected)
		briefs := api.Group("/briefs")
		briefs.Use(middleware.AuthRequired(serviceContainer.Firebase))
		{
			briefs.POST("", handlerContainer.BrandBrief.Create)
			briefs.GET("", handlerContainer.BrandBrief.List)
			briefs.GET("/:id", handlerContainer.BrandBrief.GetByID)
			briefs.DELETE("/:id", handlerContainer.BrandBrief.Delete)
		}

		// User routes
		user := api.Group("/user")
		user.Use(middleware.AuthRequired(serviceContainer.Firebase))
		{
			user.GET("/profile", handlerContainer.User.GetProfile)
			user.PUT("/profile", handlerContainer.User.UpdateProfile)
		}

		// Payment routes
		payments := api.Group("/payments")
		payments.Use(middleware.AuthRequired(serviceContainer.Firebase))
		{
			payments.POST("/checkout", handlerContainer.Payment.CreateCheckoutSession)
			payments.GET("/subscription", handlerContainer.Payment.GetSubscription)
			payments.POST("/webhook", handlerContainer.Payment.HandleWebhook) // No auth required for webhooks
		}

		// Admin routes
		admin := api.Group("/admin")
		admin.Use(middleware.AuthRequired(serviceContainer.Firebase))
		admin.Use(middleware.AdminRequired())
		{
			admin.GET("/metrics", handlerContainer.Admin.GetMetrics)
			admin.GET("/users", handlerContainer.Admin.GetUsers)
		}
	}

	// Start server
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: router,
	}

	// Graceful shutdown
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	log.Printf("Server started on port %s", cfg.Port)

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}
