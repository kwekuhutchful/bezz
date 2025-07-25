# Bezz AI - AI-Powered Brand Strategy Platform

Bezz AI is a comprehensive platform that generates brand strategies and advertising campaigns using advanced AI. Built with React (frontend) and Go (backend), it leverages OpenAI's GPT-4 and DALL·E for content generation.

## 🏗️ Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Go + Gin Framework
- **Authentication**: Firebase Auth (JWT-based)
- **Database**: Firestore
- **Storage**: Google Cloud Storage
- **AI Services**: OpenAI GPT-4 & DALL·E 3
- **Payments**: Stripe + Mobile Money integrations
- **Deployment**: Google Cloud Run + Firebase Hosting

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Go 1.21+
- Docker & Docker Compose
- Firebase project
- Google Cloud Project
- OpenAI API key
- Stripe account

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bezz-ai
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables**
   ```bash
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_API_KEY=your_firebase_web_api_keu
   
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key
   
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   
   # Google Cloud Storage
   GCS_BUCKET_NAME=your_gcs_bucket_name
   ```

### Local Development

1. **Start the development environment**
   ```bash
   npm run dev
   ```

2. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Health check: http://localhost:8080/health

## 📁 Project Structure

```
bezz-ai/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and configurations
│   │   ├── types/          # TypeScript type definitions
│   │   └── contexts/       # React contexts
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Go backend application
│   ├── internal/
│   │   ├── handlers/       # HTTP request handlers
│   │   ├── services/       # Business logic services
│   │   ├── models/         # Data models
│   │   ├── middleware/     # HTTP middleware
│   │   └── config/         # Configuration management
│   ├── main.go             # Application entry point
│   └── go.mod
├── infra/                  # Infrastructure configurations
├── .github/workflows/      # CI/CD workflows
└── docker-compose.yml      # Local development setup
```

## 🔧 Development Workflow

### Frontend Development

```bash
cd frontend
npm install
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run test         # Run tests
```

### Backend Development

```bash
cd backend
go mod download      # Download dependencies
go run main.go       # Start development server
go test ./...        # Run tests
go build            # Build binary
```

### Docker Development

```bash
docker-compose up --build    # Start all services
docker-compose down          # Stop all services
docker-compose logs          # View logs
```

## 🎯 Key Features

### Brand Brief Processing
- AI-powered brief analysis and processing
- Multi-language support (English/French)
- Comprehensive brand personality extraction

### Strategy Generation
- Brand positioning and value proposition
- Messaging framework development
- Target audience segmentation
- Tonal guidelines and brand voice

### Campaign Creation
- Multi-platform ad campaign generation
- AI-generated copy and visuals
- Platform-specific optimization (Facebook, Instagram, Google Ads, etc.)
- Export capabilities for Canva and Meta Ads

### User Management
- Firebase Authentication integration
- Credit-based usage system
- Subscription management with Stripe
- User profile and preferences

## 🔐 Authentication & Security

- **JWT-based authentication** via Firebase
- **API rate limiting** and request validation
- **Content moderation** using OpenAI's moderation API
- **CORS configuration** for secure cross-origin requests
- **Environment-based configuration** for sensitive data

## 💳 Payment Integration

### Stripe Integration
- Subscription-based billing
- Multiple plan tiers (Starter, Pro, Enterprise)
- Webhook handling for payment events
- Credit allocation based on subscription

### Mobile Money Support
- MoMo payment integration (planned)
- Local payment method support for African markets

## 🌍 Deployment

### Google Cloud Platform

1. **Backend Deployment (Cloud Run)**
   - Containerized Go application
   - Auto-scaling based on demand
   - Environment variable management
   - Health checks and monitoring

2. **Frontend Deployment (Firebase Hosting)**
   - Static site hosting
   - Global CDN distribution
   - Custom domain support
   - SSL certificate management

### CI/CD Pipeline

The project uses GitHub Actions for automated testing and deployment:

1. **Testing Phase**
   - Frontend: ESLint, TypeScript compilation, unit tests
   - Backend: Go tests, linting, security checks

2. **Build Phase**
   - Docker image creation
   - Static asset optimization
   - Environment-specific builds

3. **Deployment Phase**
   - Cloud Run service deployment
   - Firebase Hosting deployment
   - Environment variable injection

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm run test         # Unit tests with Vitest
npm run test:e2e     # End-to-end tests (planned)
```

### Backend Testing
```bash
cd backend
go test ./...                    # Unit tests
go test -race ./...             # Race condition detection
go test -cover ./...            # Coverage reports
```

## 📊 Monitoring & Analytics

- **Application Performance Monitoring** via Google Cloud Monitoring
- **Error tracking** and logging
- **User analytics** and usage metrics
- **API performance** monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write comprehensive tests for new features
- Update documentation for API changes
- Use semantic commit messages
- Ensure all CI checks pass

## 📝 API Documentation

### Authentication
All API endpoints require a valid Firebase JWT token in the Authorization header:
```
Authorization: Bearer <firebase-jwt-token>
```

### Core Endpoints

#### Brand Briefs
- `POST /api/briefs` - Create a new brand brief
- `GET /api/briefs` - List user's brand briefs
- `GET /api/briefs/:id` - Get specific brand brief
- `DELETE /api/briefs/:id` - Delete brand brief

#### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

#### Payments
- `POST /api/payments/checkout` - Create Stripe checkout session
- `GET /api/payments/subscription` - Get subscription status
- `POST /api/payments/webhook` - Handle Stripe webhooks

## 🔍 Troubleshooting

### Common Issues

1. **Firebase Authentication Errors**
   - Verify Firebase configuration
   - Check API keys and project settings
   - Ensure proper CORS configuration

2. **OpenAI API Limits**
   - Monitor API usage and quotas
   - Implement proper error handling
   - Consider request queuing for high volume

3. **Database Connection Issues**
   - Verify Firestore permissions
   - Check service account credentials
   - Monitor connection limits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 and DALL·E APIs
- Firebase team for authentication and database services
- Stripe for payment processing
- Google Cloud Platform for hosting infrastructure
- The open-source community for the amazing tools and libraries

---

For more detailed documentation, please refer to the individual component READMEs in their respective directories.