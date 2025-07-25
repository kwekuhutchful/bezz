package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
	"github.com/stripe/stripe-go/v76/customer"
	"github.com/stripe/stripe-go/v76/subscription"
	"github.com/stripe/stripe-go/v76/webhook"

	"bezz-backend/internal/models"
)

// PaymentService handles payment operations
type PaymentService struct {
	secretKey     string
	webhookSecret string
}

// NewPaymentService creates a new payment service
func NewPaymentService(secretKey, webhookSecret string) *PaymentService {
	return &PaymentService{
		secretKey:     secretKey,
		webhookSecret: webhookSecret,
	}
}

// CreateCheckoutSession creates a Stripe checkout session
func (s *PaymentService) CreateCheckoutSession(ctx context.Context, userID, email, plan string) (*stripe.CheckoutSession, error) {
	// Define price IDs for different plans
	priceIDs := map[string]string{
		"starter":    "price_starter_monthly", // Replace with actual Stripe price IDs
		"pro":        "price_pro_monthly",
		"enterprise": "price_enterprise_monthly",
	}

	priceID, exists := priceIDs[plan]
	if !exists {
		return nil, fmt.Errorf("invalid plan: %s", plan)
	}

	params := &stripe.CheckoutSessionParams{
		PaymentMethodTypes: stripe.StringSlice([]string{"card"}),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(1),
			},
		},
		Mode:          stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		SuccessURL:    stripe.String("https://yourdomain.com/success?session_id={CHECKOUT_SESSION_ID}"),
		CancelURL:     stripe.String("https://yourdomain.com/cancel"),
		CustomerEmail: stripe.String(email),
		Metadata: map[string]string{
			"user_id": userID,
			"plan":    plan,
		},
	}

	sess, err := session.New(params)
	if err != nil {
		return nil, err
	}

	return sess, nil
}

// GetSubscription retrieves subscription information for a user
func (s *PaymentService) GetSubscription(ctx context.Context, customerID string) (*models.Subscription, error) {
	params := &stripe.SubscriptionListParams{
		Customer: stripe.String(customerID),
		Status:   stripe.String("all"),
	}

	iter := subscription.List(params)
	for iter.Next() {
		sub := iter.Subscription()

		// Convert Stripe subscription to our model
		modelSub := &models.Subscription{
			ID:                sub.ID,
			Status:            string(sub.Status),
			Plan:              extractPlanFromPriceID(sub.Items.Data[0].Price.ID),
			CurrentPeriodEnd:  TimeFromUnix(sub.CurrentPeriodEnd),
			CancelAtPeriodEnd: sub.CancelAtPeriodEnd,
		}

		return modelSub, nil
	}

	return nil, fmt.Errorf("no subscription found")
}

// HandleWebhook handles Stripe webhooks
func (s *PaymentService) HandleWebhook(body []byte, signature string) (*WebhookEvent, error) {
	event, err := webhook.ConstructEvent(body, signature, s.webhookSecret)
	if err != nil {
		return nil, fmt.Errorf("webhook signature verification failed: %w", err)
	}

	webhookEvent := &WebhookEvent{
		Type: string(event.Type),
		Data: event.Data.Raw,
	}

	switch event.Type {
	case "checkout.session.completed":
		var session stripe.CheckoutSession
		if err := json.Unmarshal(event.Data.Raw, &session); err != nil {
			return nil, err
		}
		webhookEvent.CheckoutSession = &session

	case "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted":
		var sub stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
			return nil, err
		}
		webhookEvent.Subscription = &sub

	case "invoice.payment_succeeded", "invoice.payment_failed":
		var invoice stripe.Invoice
		if err := json.Unmarshal(event.Data.Raw, &invoice); err != nil {
			return nil, err
		}
		webhookEvent.Invoice = &invoice
	}

	return webhookEvent, nil
}

// CreateCustomer creates a Stripe customer
func (s *PaymentService) CreateCustomer(ctx context.Context, userID, email, name string) (*stripe.Customer, error) {
	params := &stripe.CustomerParams{
		Email: stripe.String(email),
		Name:  stripe.String(name),
		Metadata: map[string]string{
			"user_id": userID,
		},
	}

	return customer.New(params)
}

// WebhookEvent represents a processed webhook event
type WebhookEvent struct {
	Type            string                  `json:"type"`
	Data            json.RawMessage         `json:"data"`
	CheckoutSession *stripe.CheckoutSession `json:"checkout_session,omitempty"`
	Subscription    *stripe.Subscription    `json:"subscription,omitempty"`
	Invoice         *stripe.Invoice         `json:"invoice,omitempty"`
}

// Helper functions
func extractPlanFromPriceID(priceID string) string {
	// Map price IDs back to plan names
	priceToplan := map[string]string{
		"price_starter_monthly":    "starter",
		"price_pro_monthly":        "pro",
		"price_enterprise_monthly": "enterprise",
	}

	if plan, exists := priceToplan[priceID]; exists {
		return plan
	}
	return "unknown"
}

func TimeFromUnix(timestamp int64) time.Time {
	return time.Unix(timestamp, 0)
}
