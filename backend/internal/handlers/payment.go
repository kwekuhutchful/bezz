package handlers

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"

	"bezz-backend/internal/middleware"
	"bezz-backend/internal/models"
	"bezz-backend/internal/services"
)

// PaymentHandler handles payment endpoints
type PaymentHandler struct {
	paymentService *services.PaymentService
	userService    *services.UserService
}

// NewPaymentHandler creates a new payment handler
func NewPaymentHandler(paymentService *services.PaymentService, userService *services.UserService) *PaymentHandler {
	return &PaymentHandler{
		paymentService: paymentService,
		userService:    userService,
	}
}

// CreateCheckoutSession creates a Stripe checkout session
func (h *PaymentHandler) CreateCheckoutSession(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "User not authenticated",
		})
		return
	}

	var req struct {
		Plan string `json:"plan" binding:"required,oneof=starter pro enterprise"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid request body",
		})
		return
	}

	user, err := h.userService.GetUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to get user information",
		})
		return
	}

	session, err := h.paymentService.CreateCheckoutSession(
		c.Request.Context(),
		userID,
		user.Email,
		req.Plan,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to create checkout session",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: map[string]string{
			"checkout_url": session.URL,
			"session_id":   session.ID,
		},
	})
}

// GetSubscription gets the current user's subscription
func (h *PaymentHandler) GetSubscription(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "User not authenticated",
		})
		return
	}

	user, err := h.userService.GetUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to get user information",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    user.Subscription,
	})
}

// HandleWebhook handles Stripe webhooks
func (h *PaymentHandler) HandleWebhook(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Failed to read request body",
		})
		return
	}

	signature := c.GetHeader("Stripe-Signature")
	if signature == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Missing Stripe signature",
		})
		return
	}

	event, err := h.paymentService.HandleWebhook(body, signature)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid webhook",
		})
		return
	}

	// Process the webhook event
	switch event.Type {
	case "checkout.session.completed":
		// Handle successful checkout
		if event.CheckoutSession != nil {
			userID := event.CheckoutSession.Metadata["user_id"]
			plan := event.CheckoutSession.Metadata["plan"]

			// Add credits based on plan
			credits := map[string]int{
				"starter":    10,
				"pro":        50,
				"enterprise": 200,
			}

			if creditAmount, exists := credits[plan]; exists {
				h.userService.AddCredits(c.Request.Context(), userID, creditAmount)
			}
		}

	case "customer.subscription.created", "customer.subscription.updated":
		// Handle subscription changes
		if event.Subscription != nil {
			// TODO: Update user subscription status
		}

	case "customer.subscription.deleted":
		// Handle subscription cancellation
		if event.Subscription != nil {
			// TODO: Update user subscription status
		}

	case "invoice.payment_failed":
		// Handle failed payments
		if event.Invoice != nil {
			// TODO: Handle payment failure
		}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Webhook processed successfully",
	})
}
