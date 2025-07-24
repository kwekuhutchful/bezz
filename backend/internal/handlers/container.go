package handlers

import (
	"bezz-backend/internal/services"
)

// Container holds all handler dependencies
type Container struct {
	BrandBrief *BrandBriefHandler
	User       *UserHandler
	Payment    *PaymentHandler
	Admin      *AdminHandler
}

// NewContainer creates a new handler container
func NewContainer(services *services.Container) *Container {
	return &Container{
		BrandBrief: NewBrandBriefHandler(services.BrandBriefService, services.UserService),
		User:       NewUserHandler(services.UserService),
		Payment:    NewPaymentHandler(services.PaymentService, services.UserService),
		Admin:      NewAdminHandler(services.UserService, services.BrandBriefService),
	}
}
