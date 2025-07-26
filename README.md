# Bezz AI - AI-Powered Brand Strategy Platform

Bezz AI is a comprehensive platform that generates brand strategies and advertising campaigns using advanced AI. Built with React (frontend) and Go (backend), it leverages OpenAI's GPT-4 and DALL·E 3 for content generation.

## 🏗️ Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Go + Gin Framework
- **Authentication**: Firebase Auth (JWT-based)
- **Database**: Firestore
- **Storage**: Google Cloud Storage
- **AI Services**: OpenAI GPT-4 & DALL·E 3
- **Payments**: Stripe + Mobile Money integrations
- **Deployment**: Google Cloud Run + Firebase Hosting

## 🤖 AI Pipeline

Bezz AI employs a sophisticated multi-stage AI pipeline to transform brand briefs into complete brand strategies with ready-to-use ad campaigns:

### Stage 1: Brief Analysis (Brief-GPT)
- Processes raw founder inputs
- Extracts brand goals, audience insights, tone, and vision
- Structures unorganized information into actionable data

### Stage 2: Strategy Generation (Strategist-GPT)
- Creates comprehensive brand positioning
- Develops messaging frameworks and value propositions
- Generates 3 detailed target audience personas
- Identifies key campaign angles and brand pillars

### Stage 3: Creative Development (Creative-Director-GPT)
- Generates 3 diverse ad variations per brief
- Creates compelling headlines (≤20 words) and body copy (≤50 words)
- Produces detailed visual prompts for image generation
- Ensures brand consistency across all creative assets

### Stage 4: Visual Asset Creation (DALL-E 3)
- Generates high-quality 1024x1024 images for each ad
- Processes all images concurrently for optimal performance
- Implements retry logic with exponential backoff
- Stores assets in Google Cloud Storage with public URLs

### Stage 5: Final Assembly & Delivery
- Combines copy, visuals, and targeting into complete campaigns
- Updates brief status through each pipeline stage
- Provides real-time progress tracking to users
- Delivers exportable assets for various platforms

## 🎯 Key Features

### Brand Brief Processing
- AI-powered brief analysis and processing
- Multi-language support (English/French)
- Comprehensive brand personality extraction
- Real-time processing status updates

### Strategy Generation
- Brand positioning and value proposition development
- Messaging framework creation with primary and supporting messages
- Target audience segmentation with detailed personas
- Tonal guidelines and brand voice definition
- Campaign angle identification and resonance analysis

### Ad Copy & Image Generation ✨ **NEW**
- **Automated Creative Development**: AI-generated ad headlines, body copy, and visual concepts
- **DALL-E 3 Integration**: High-quality image generation with brand-consistent visuals
- **Multi-Variation Creation**: 3 diverse ad variations per brief targeting different audience segments
- **Concurrent Processing**: Parallel image generation for optimal performance
- **Cloud Storage Integration**: Automatic upload and management of generated assets
- **Platform Optimization**: Ready-to-use formats for Facebook, Instagram, and other platforms
- **Export Capabilities**: Direct integration with Canva and Meta Ads Manager

### Campaign Creation
- Multi-platform ad campaign generation (Facebook, Instagram, Google Ads, LinkedIn)
- AI-generated copy optimized for each platform
- Custom visual assets tailored to brand identity
- Export capabilities for Canva and Meta Ads Manager
- Performance tracking and optimization recommendations

### User Management
- Firebase Authentication integration
- Credit-based usage system
- Subscription management with Stripe
- User profile and preferences

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
   FIREBASE_API_KEY=your_firebase_web_api_key
   
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
│   │   ├── prompts/        # AI prompt templates
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

**Unit Tests**
```bash
cd backend
go test ./...                    # All unit tests
go test -race ./...             # Race condition detection
go test -cover ./...            # Coverage reports
```

**AI Pipeline Testing** ✨ **NEW**
```bash
# Test individual AI service components
go test ./internal/services -v -run TestGenerateAds
go test ./internal/services -v -run TestProcessBriefWithGPT
go test ./internal/services -v -run TestGenerateStrategyWithGPT

# Test complete pipeline integration
go test ./internal/handlers -v -run TestCreateBrief_CompleteAIPipeline

# Test with race condition detection
go test -race ./internal/services -v -run TestRenderImages
```

**Integration Testing**
```bash
# Test complete brief creation flow
curl -X POST http://localhost:8080/api/briefs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "companyName": "Test Company",
    "sector": "Technology",
    "tone": "Professional", 
    "targetAudience": "Business owners and decision makers",
    "language": "en",
    "additionalInfo": "Focus on innovation and scalability"
  }'

# Monitor processing status
curl -X GET http://localhost:8080/api/briefs/{brief-id} \
  -H "Authorization: Bearer your-jwt-token"

# Verify complete results with ads
curl -X GET http://localhost:8080/api/briefs/{brief-id} \
  -H "Authorization: Bearer your-jwt-token" \
  | jq '.data.results.ads | length'  # Should return 3
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
- `GET /api/briefs/:id` - Get specific brand brief with complete results
- `DELETE /api/briefs/:id` - Delete brand brief

**Enhanced Brief Response Structure** ✨ **UPDATED**
```json
{
  "success": true,
  "data": {
    "id": "brief_123456789",
    "companyName": "Acme Corp",
    "sector": "Technology",
    "status": "completed",
    "createdAt": "2024-01-15T10:30:00Z",
    "results": {
      "strategy": {
        "positioning": "Leading innovative solutions provider...",
        "valueProposition": "We help businesses transform...",
        "brandPillars": ["Innovation", "Reliability", "Growth"],
        "messagingFramework": {
          "primaryMessage": "Transform your business with cutting-edge solutions",
          "supportingMessages": [
            "Proven track record of success",
            "24/7 dedicated support",
            "Scalable solutions for any size business"
          ]
        },
        "targetSegments": [
          {
            "name": "Tech-Forward SMBs",
            "role": "Business Owner",
            "demographics": "35-50 years, $50K-$150K revenue",
            "psychographics": "Innovation-driven, efficiency-focused",
            "painPoints": ["Manual processes", "Limited tech expertise"],
            "preferredChannels": ["LinkedIn", "Email", "Industry publications"]
          }
        ]
      },
      "ads": [
        {
          "id": "ad_1_1642248600",
          "title": "Ad Campaign 1",
          "format": "social",
          "platform": "facebook",
          "copy": {
            "headline": "Transform Your Business Operations Today",
            "body": "Join thousands of successful businesses using our innovative platform to streamline operations and boost productivity.",
            "cta": "Learn More"
          },
          "imageUrl": "https://storage.googleapis.com/bucket/ads/acme_corp_ad_1_1642248600.png",
          "imagePrompt": "Modern office environment with diverse professionals collaborating around digital screens showing business growth charts and technology interfaces",
          "targetSegment": "Tech-Forward SMBs", 
          "objectives": ["Brand Awareness", "Lead Generation"]
        },
        {
          "id": "ad_2_1642248601", 
          "title": "Ad Campaign 2",
          "format": "social",
          "platform": "linkedin",
          "copy": {
            "headline": "Unlock Your Business Potential",
            "body": "Discover how leading companies are achieving 40% efficiency gains with our proven solutions.",
            "cta": "Get Started"
          },
          "imageUrl": "https://storage.googleapis.com/bucket/ads/acme_corp_ad_2_1642248601.png",
          "imagePrompt": "Professional business leaders in a boardroom analyzing upward trending analytics dashboards with confident expressions",
          "targetSegment": "Growth-Focused Executives",
          "objectives": ["Lead Generation", "Conversion"]
        },
        {
          "id": "ad_3_1642248602",
          "title": "Ad Campaign 3", 
          "format": "social",
          "platform": "instagram",
          "copy": {
            "headline": "Ready to Scale Your Success?",
            "body": "From startup to enterprise - our solutions grow with you. Start your transformation journey today.",
            "cta": "Start Free Trial"
          },
          "imageUrl": "https://storage.googleapis.com/bucket/ads/acme_corp_ad_3_1642248602.png",
          "imagePrompt": "Dynamic startup office space with young entrepreneurs celebrating achievements while working on laptops with growth metrics visible on screens",
          "targetSegment": "Ambitious Startups",
          "objectives": ["Trial Conversion", "Brand Awareness"]
        }
      ]
    }
  }
}
```

**Processing Status Tracking**
Briefs progress through multiple stages with real-time status updates:
- `processing` → Initial brief analysis
- `strategy_completed` → Brand strategy generated
- `ads_completed` → Ad copy and visuals created  
- `completed` → Full pipeline finished
- `failed` → Processing error occurred

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

2. **OpenAI API Limits & Errors** ⚠️ **UPDATED**
   - Monitor API usage and quotas for both GPT-4 and DALL-E 3
   - Implement proper error handling for rate limits
   - Consider request queuing for high volume
   - **DALL-E 3 specific**: Content policy violations may cause image generation failures
   - **GPT-4 specific**: Token limits may truncate strategy responses

3. **Image Generation Issues** ✨ **NEW**
   - **DALL-E 3 Rate Limits**: 50 requests per minute for standard quality
   - **Content Policy Violations**: Certain prompts may be rejected
   - **GCS Upload Failures**: Check bucket permissions and authentication
   - **Image Quality**: Ensure prompts are detailed enough for consistent results
   
   **Debugging DALL-E Issues:**
   ```bash
   # Check backend logs for image generation errors
   grep "AI PIPELINE.*DALL-E" backend.log
   
   # Test individual image generation
   curl -X POST http://localhost:8080/api/test/generate-image \
     -H "Content-Type: application/json" \
     -d '{"prompt": "professional business office"}'
   ```

4. **Database Connection Issues**
   - Verify Firestore permissions
   - Check service account credentials
   - Monitor connection limits

5. **AI Pipeline Processing Failures** ✨ **NEW**
   - **Brief-GPT Issues**: Check input validation and prompt formatting
   - **Strategy Generation**: Ensure JSON response parsing is working
   - **Creative Director**: Verify ad specification structure
   - **Pipeline Interruption**: Check status updates in Firestore
   
   **Pipeline Debugging:**
   ```bash
   # Monitor pipeline progress
   grep "AI PIPELINE" backend.log | tail -20
   
   # Check specific brief status
   curl -X GET http://localhost:8080/api/briefs/{brief-id} \
     -H "Authorization: Bearer token" | jq '.data.status'
   
   # Test individual pipeline stages
   go test ./internal/services -v -run TestProcessBriefPipeline
   ```

6. **Performance & Concurrency Issues** ✨ **NEW**
   - **Concurrent Image Generation**: Monitor goroutine performance
   - **Memory Usage**: DALL-E image processing can be memory intensive
   - **Timeout Issues**: Increase timeout for long-running AI operations
   
   **Performance Monitoring:**
   ```bash
   # Check goroutine usage
   curl http://localhost:8080/debug/pprof/goroutine
   
   # Monitor memory usage during image generation
   curl http://localhost:8080/debug/pprof/heap
   ```

---

## 📚 Additional Documentation

- **[AI Pipeline Technical Guide](documentation/ai-pipeline-technical-guide.md)** - Comprehensive technical documentation for the AI pipeline implementation
- **[Product Documentation](documentation/product-documentation.md)** - Product requirements and user stories
- **[Core User Stories](documentation/core-user-stories.md)** - Detailed user journey documentation

For more detailed documentation, please refer to the individual component READMEs in their respective directories.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 and DALL·E 3 APIs ✨ **Enhanced**
- Firebase team for authentication and database services
- Stripe for payment processing
- Google Cloud Platform for hosting and storage infrastructure
- The open-source community for the amazing tools and libraries