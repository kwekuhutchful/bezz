package handlers

import (
	"bezz-backend/internal/services"
)

// Container holds all handler dependencies
type Container struct {
	Auth       *AuthHandler
	BrandBrief *BrandBriefHandler
	User       *UserHandler
	Payment    *PaymentHandler
	Admin      *AdminHandler
	Export     *ExportHandler
}

// NewContainer creates a new handler container
func NewContainer(services *services.Container) *Container {
	return &Container{
		Auth:       NewAuthHandler(services.AuthService, services.UserService),
		BrandBrief: NewBrandBriefHandler(services.BrandBriefService, services.UserService),
		User:       NewUserHandler(services.UserService),
		Payment:    NewPaymentHandler(services.PaymentService, services.UserService),
		Admin:      NewAdminHandler(services.UserService, services.BrandBriefService),
		Export:     NewExportHandler(services.ExportService),
	}
}
