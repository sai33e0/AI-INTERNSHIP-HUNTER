# 🤖 AI Internship Hunter

An intelligent, AI-powered platform that revolutionizes the internship search and application process. Leveraging cutting-edge GPT-4 technology, web automation, and real-time analytics, this tool helps students and recent graduates land their dream internships with unprecedented efficiency.

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## ✨ Features

### 🔍 Smart Internship Discovery
- **Multi-Platform Scraping**: Automatically aggregates internships from LinkedIn, Indeed, and Glassdoor
- **AI-Powered Matching**: Uses GPT-4 and advanced embeddings to match opportunities based on skills, experience, and preferences
- **Real-time Monitoring**: Continuously scans for new postings and updates existing listings
- **Advanced Filtering**: Filter by location, company size, salary range, remote options, and more

### 📝 Intelligent Application Tools
- **Personalized Cover Letters**: GPT-4 generates compelling, tailored cover letters for each application
- **Resume Optimization**: AI analyzes and improves your resume for specific positions and industries
- **Smart Application**: Automated form filling and submission where APIs are available
- **Template Management**: Save and customize successful application templates

### 📊 Advanced Tracking & Analytics
- **Kanban Board**: Visual, drag-and-drop interface for application management
- **Real-time Status Updates**: Live monitoring of application progress through all stages
- **Intelligent Reminders**: AI-powered follow-up suggestions and deadline alerts
- **Success Analytics**: Comprehensive dashboard with response rates, interview statistics, and offer conversion metrics

### 🎯 AI-Powered Career Tools
- **Interview Preparation**: Generates practice questions and company-specific interview tips
- **Salary Intelligence**: Data-driven compensation insights and negotiation strategies
- **Skill Gap Analysis**: Identifies areas for improvement based on target roles and industry requirements
- **Career Path Planning**: AI suggests optimal career progression and skill development paths

## 🚀 Technology Stack

### Frontend Excellence
- **Next.js 14**: Latest React framework with App Router for optimal performance
- **TypeScript**: Full type safety and enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework for rapid, responsive development
- **React Hook Form**: Optimized form handling with minimal re-renders
- **Lucide React**: Beautiful, consistent icon system
- **React Hot Toast**: Elegant, accessible notification system

### Backend & APIs
- **OpenAI GPT-4**: State-of-the-art AI for content generation and analysis
- **Playwright**: Advanced web scraping and browser automation
- **Supabase**: Real-time database with built-in authentication and Row Level Security
- **Next.js API Routes**: Serverless backend functions with edge runtime support
- **Zod**: Runtime type validation and schema management

### Database & Infrastructure
- **PostgreSQL**: Robust relational database via Supabase
- **Real-time Subscriptions**: Instant updates for application status changes
- **File Storage**: Secure resume and document management
- **Edge Functions**: Global CDN deployment with Vercel

## 📋 Prerequisites

Before you begin, ensure you have the following:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Git** version control
- **Supabase** account (free tier is sufficient)
- **OpenAI** API access with billing enabled

## 🛠️ Installation & Setup

### 1. Clone and Install
```bash
# Clone the repository
git clone https://github.com/yourusername/ai-internship-hunter.git
cd ai-internship-hunter

# Install dependencies
npm install

# Install peer dependencies if needed
npm install autoprefixer postcss
```

### 2. Environment Configuration
```bash
# Copy the environment template
cp .env.local.example .env.local

# Edit with your API keys and configuration
```

**Essential Environment Variables:**
```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Authentication (if using NextAuth.js)
NEXTAUTH_SECRET=your-super-secret-string-here
NEXTAUTH_URL=http://localhost:3000

# Optional: GitHub for enhanced profile features
GITHUB_TOKEN=ghp_your-github-token

# Development
NODE_ENV=development
```

### 3. Database Setup
```bash
# Option 1: Automatic setup (recommended)
npm run db:setup

# Option 2: Manual setup
# 1. Create a new project at supabase.com
# 2. Run the SQL migration files from supabase/migrations/
# 3. Configure Row Level Security (RLS) policies
```

### 4. Launch Development Server
```bash
npm run dev
```

🎉 **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 🗄️ Database Architecture

### Core Tables

**Users Profile Management**
```sql
users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  resume_url TEXT,
  skills JSONB,              -- Extracted skills from resume
  preferences JSONB,         -- Job preferences, locations, etc.
  resume_embeddings VECTOR,  -- For semantic matching
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

**Internships Discovery**
```sql
internships (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  location TEXT,
  remote BOOLEAN DEFAULT false,
  link TEXT,
  description TEXT,
  requirements TEXT,
  salary_range TEXT,
  posted_date TIMESTAMP,
  deadline TIMESTAMP,
  source_site VARCHAR(50),
  job_embeddings VECTOR,     -- For semantic matching
  match_score DECIMAL(3,2),  -- AI-calculated match score
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

**Application Tracking**
```sql
applications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  internship_id UUID REFERENCES internships(id),
  status VARCHAR(20) DEFAULT 'pending', -- pending, submitted, reviewing, accepted, rejected
  cover_letter TEXT,
  notes TEXT,
  applied_on TIMESTAMP,
  interview_dates JSONB,
  offer_details JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

## 📁 Project Architecture

```
ai-internship-hunter/
├── 🎯 app/                          # Next.js App Router
│   ├── (auth)/                      # Authentication routes group
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/                   # Main command center
│   │   └── page.tsx                # AI dashboard and insights
│   ├── tracker/                     # Application tracking
│   │   └── page.tsx                # Kanban board and timeline
│   ├── internships/                 # Internship discovery
│   │   └── page.tsx                # Browse and filter opportunities
│   ├── upload/                      # Onboarding flow
│   │   └── page.tsx                # Resume and profile setup
│   ├── api/                         # Backend API endpoints
│   │   ├── scrape/                 # Web scraping endpoints
│   │   │   └── route.ts
│   │   ├── match/                  # AI matching engine
│   │   │   └── route.ts
│   │   ├── coverletter/            # Cover letter generation
│   │   │   └── route.ts
│   │   ├── apply/                  # Application automation
│   │   │   └── route.ts
│   │   ├── applications/           # Application CRUD
│   │   │   └── route.ts
│   │   └── users/                  # User management
│   │       └── route.ts
│   ├── globals.css                 # Global styles and Tailwind
│   ├── layout.tsx                  # Root layout with providers
│   └── page.tsx                    # Landing page
├── 🎨 components/                   # Reusable UI components
│   ├── ui/                         # Base UI primitives
│   │   ├── Button.tsx             # Enhanced button with variants
│   │   ├── Card.tsx               # Card component with slots
│   │   ├── Input.tsx              # Form input with validation
│   │   ├── Modal.tsx              # Accessible modal dialog
│   │   ├── Badge.tsx              # Status badges and tags
│   │   └── FileUpload.tsx         # Secure file upload
│   ├── auth/                       # Authentication components
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── forms/                      # Application forms
│   │   ├── ProfileForm.tsx
│   │   └── PreferencesForm.tsx
│   └── layout/                     # Layout components
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── 🧠 lib/                          # Core business logic
│   ├── agents/                     # AI-powered agents
│   │   ├── scraperAgent.ts        # Web scraping automation
│   │   ├── matcherAgent.ts        # Resume-job matching
│   │   ├── writerAgent.ts         # Cover letter generation
│   │   └── trackerAgent.ts        # Application status tracking
│   ├── database/                   # Database helpers
│   │   ├── users.ts               # User queries and mutations
│   │   ├── internships.ts         # Internship management
│   │   └── applications.ts        # Application CRUD operations
│   ├── validation.ts               # Zod schema definitions
│   ├── realtime.ts                 # Real-time subscription manager
│   ├── errors.ts                   # Error handling utilities
│   ├── supabaseClient.ts           # Supabase configuration
│   └── utils.ts                    # General utility functions
├── 🗃️ supabase/                     # Database configuration
│   ├── migrations/                 # SQL migration files
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_internships.sql
│   │   ├── 003_create_applications.sql
│   │   └── 004_setup_rls.sql
│   ├── seed.sql                    # Initial seed data
│   └── types.ts                    # Database type definitions
├── 🔧 types/                        # TypeScript definitions
│   ├── auth.ts                    # Authentication types
│   ├── database.ts                # Database schema types
│   ├── api.ts                     # API response types
│   └── index.ts                   # Export all types
├── 🎯 hooks/                        # Custom React hooks
│   ├── useRealtime.ts             # Real-time subscription hook
│   ├── useAuth.ts                 # Authentication state management
│   └── useApplications.ts         # Application data management
├── 📄 public/                       # Static assets
│   ├── icons/                     # Favicon and app icons
│   ├── images/                    # Static images
│   └── manifest.json              # PWA manifest
├── 📊 middleware.ts                 # Next.js middleware for security
├── ⚙️ next.config.js               # Next.js configuration
├── 📝 tailwind.config.js           # Tailwind CSS configuration
├── 🔄 postcss.config.js            # PostCSS configuration
├── 📦 package.json                 # Dependencies and scripts
└── 🔒 .env.local.example           # Environment variable template
```

## 🎯 Usage Guide

### 1. Quick Start - Your First 10 Minutes

**Step 1: Create Your Profile**
- Sign up with email or GitHub OAuth
- Upload your resume (PDF/DOCX supported)
- Add your GitHub profile for automatic skill extraction
- Set preferences for locations, company size, and remote work

**Step 2: Discover Opportunities**
- Click "Start Scraping" to find internships from multiple platforms
- Use AI-powered filters to find perfect matches
- Save interesting opportunities to your dashboard

**Step 3: Apply Smartly**
- Generate personalized cover letters with one click
- Use smart application features where available
- Track all applications in the central dashboard

### 2. Advanced Features

**AI-Powered Matching**
```typescript
// The system uses semantic similarity to match your profile
const matchScore = await aiMatcher.calculateMatch(
  userResume,
  jobDescription,
  userPreferences
);
// Returns score 0-100 with detailed breakdown
```

**Cover Letter Generation**
- Choose from multiple tones: Professional, Casual, Enthusiastic
- Custom length options: Short, Medium, Long
- AI extracts relevant achievements from your resume
- Company research integration for personalization

**Real-time Application Tracking**
- Instant notifications when application status changes
- Follow-up reminders based on company response patterns
- Timeline view of entire application journey
- Analytics on response rates and success metrics

## 🔧 API Reference

### Scraping Endpoints

**Start Scraping**
```http
POST /api/scrape
Content-Type: application/json

{
  "sources": ["linkedin", "indeed", "glassdoor"],
  "keywords": ["software engineering", "data science"],
  "locations": ["New York", "San Francisco", "Remote"],
  "limit": 50,
  "filters": {
    "remoteOnly": false,
    "paidOnly": true,
    "minSalary": 50000
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scrapedCount": 47,
    "newInternships": 12,
    "updatedInternships": 5,
    "internships": [...],
    "matchScores": {...}
  }
}
```

### AI Matching

**Resume-Job Matching**
```http
POST /api/match
Content-Type: application/json

{
  "userId": "user-uuid",
  "internshipIds": ["internship-uuid-1", "internship-uuid-2"],
  "weightPreferences": {
    "skills": 0.4,
    "experience": 0.3,
    "location": 0.2,
    "company": 0.1
  }
}
```

### Cover Letter Generation

**Generate Cover Letter**
```http
POST /api/coverletter
Content-Type: application/json

{
  "userId": "user-uuid",
  "internshipId": "internship-uuid",
  "tone": "professional",
  "length": "medium",
  "customPoints": [
    "Emphasize machine learning experience",
    "Include research project details"
  ]
}
```

### Application Management

**Track Application Status**
```http
GET /api/applications?userId=user-uuid&status=pending

PUT /api/applications/{applicationId}
Content-Type: application/json

{
  "status": "interviewing",
  "notes": "Phone screen scheduled for next Tuesday",
  "interviewDates": ["2024-02-15T14:00:00Z"],
  "nextSteps": "Technical interview with engineering team"
}
```

## 🔒 Security & Privacy

### Multi-Layer Security Architecture

**Row Level Security (RLS)**
- Database-level security policies
- Users can only access their own data
- Automatic SQL injection prevention

**API Security**
- Rate limiting on all endpoints
- Request validation with Zod schemas
- CORS configuration for cross-origin protection
- Content Security Policy (CSP) headers

**Data Protection**
- Encrypted data transmission (HTTPS)
- Sensitive data encryption at rest
- GDPR compliance features
- User data export and deletion tools

**Input Sanitization**
- SQL injection prevention with parameterized queries
- XSS protection with content sanitization
- File upload validation and scanning
- CSRF protection on all forms

## 📊 Monitoring & Analytics

### Application Performance Metrics

**Success Analytics Dashboard**
- Application response rate by industry
- Interview conversion rates
- Offer acceptance statistics
- Average time-to-response metrics

**AI Performance Monitoring**
- Cover letter quality scores
- Match accuracy improvements over time
- User satisfaction ratings
- Content generation success rates

**System Health**
- API response time monitoring
- Error rate tracking and alerting
- Database performance metrics
- Web scraping success rates

### Real-time Insights

**Smart Recommendations**
```typescript
// AI-driven insights based on your application patterns
const insights = await aiAgent.generateInsights(userId, {
  timeRange: '30-days',
  includeRecommendations: true
});

// Returns:
// - Skills gaps to address
// - Companies with high response rates
// - Optimal application timing
// - Salary negotiation opportunities
```

## 🚀 Deployment Guide

### Vercel Deployment (Recommended)

**1. Connect Repository**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

**2. Environment Variables**
Configure these in Vercel dashboard:
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_SECRET`

**3. Custom Domain**
- Add custom domain in Vercel dashboard
- Configure DNS settings
- Enable SSL certificate

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t ai-internship-hunter .
docker run -p 3000:3000 --env-file .env.local ai-internship-hunter
```

### Environment-Specific Configurations

**Development**
```bash
npm run dev          # Local development
npm run test         # Run test suite
npm run typecheck    # TypeScript validation
npm run lint         # Code quality checks
```

**Production**
```bash
npm run build        # Production build
npm run start        # Start production server
npm run analyze      # Bundle analysis
```

## 🧪 Testing Strategy

### Test Suite Overview

**Unit Tests**
- API endpoint testing
- Utility function validation
- Component unit tests
- Database operation testing

**Integration Tests**
- End-to-end user flows
- Database integration
- External API integration
- Real-time subscription testing

**E2E Testing**
```bash
# Run full test suite
npm run test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

### Quality Assurance

**Automated Checks**
- TypeScript compilation
- ESLint code quality
- Prettier formatting
- Dependency vulnerability scanning

**Performance Testing**
- Bundle size optimization
- API response time testing
- Database query optimization
- Memory usage monitoring

## 🔍 Troubleshooting

### Common Issues & Solutions

**Build Errors**
```bash
# TypeScript compilation issues
npm run typecheck
# Fix type errors before building

# Missing dependencies
npm install
# Ensure all dependencies are installed
```

**Database Connection Issues**
```bash
# Check Supabase credentials
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test database connection
npx supabase status
```

**OpenAI API Errors**
```bash
# Verify API key and billing
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models

# Check usage limits
# Visit platform.openai.com/usage
```

**Web Scraping Issues**
```bash
# Check browser dependencies
npx playwright install

# Test scraping manually
npm run test:scraping
```

## 🤝 Contributing Guidelines

### Development Workflow

**1. Fork & Clone**
```bash
git clone https://github.com/yourusername/ai-internship-hunter.git
cd ai-internship-hunter
git checkout -b feature/your-feature-name
```

**2. Development Standards**
- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Ensure all tests pass before PR

**3. Code Quality**
```bash
# Run quality checks before committing
npm run typecheck
npm run lint
npm run test
npm run build
```

**4. Submit Changes**
```bash
git commit -m "feat: add new feature description"
git push origin feature/your-feature-name
# Open Pull Request with detailed description
```

### Contribution Areas

**High Priority Contributions**
- Additional scraping sources (Handshake, AngelList)
- Enhanced AI matching algorithms
- Mobile responsive improvements
- International job market support

**Community Contributions**
- Bug reports and fixes
- Documentation improvements
- Performance optimizations
- New feature suggestions

## 📄 License & Legal

**License**: ISC License - See [LICENSE](LICENSE) file for details

**Terms of Use**
- For educational and personal use
- Commercial use requires permission
- Respect website terms of service for scraping
- Comply with API provider terms

**Privacy Policy**
- User data is never sold to third parties
- Resume data is used only for matching purposes
- Implementation of GDPR compliance features
- Right to data deletion and export

## 🙏 Acknowledgments

**Open Source Projects**
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Playwright](https://playwright.dev/) - Web automation
- [OpenAI](https://openai.com/) - AI API services

**Inspiration & Resources**
- Career services professionals
- Tech community feedback
- Open source contributors
- Beta testers and early adopters

## 📞 Support & Community

**Getting Help**
- 📧 [Email Support](mailto:support@aiinternshiphunter.com)
- 💬 [Discord Community](https://discord.gg/aiinternshiphunter)
- 🐛 [Bug Reports](https://github.com/yourusername/ai-internship-hunter/issues)
- 📖 [Documentation Wiki](https://github.com/yourusername/ai-internship-hunter/wiki)

**Stay Connected**
- 🌟 [GitHub Repository](https://github.com/yourusername/ai-internship-hunter)
- 🐦 [Twitter Updates](https://twitter.com/aiinternshiphunt)
- 💼 [LinkedIn Company Page](https://linkedin.com/company/ai-internship-hunter)
- 📰 [Blog & Tutorials](https://blog.aiinternshiphunter.com)

---

**🚀 Built with passion by the AI Internship Hunter Team**

*Empowering students worldwide to land their dream internships through the power of artificial intelligence.*

*Made with ❤️, TypeScript, and cutting-edge AI technology*app
├── page.tsx                      # Landing page
├── dashboard/page.tsx            # AI dashboard
├── upload/page.tsx               # Resume & profile upload
├── matches/page.tsx              # Matched internship listings
├── tracker/page.tsx              # Application tracker
└── api/
    ├── scrape/route.ts           # Scraper endpoint
    ├── match/route.ts            # Resume-job matching
    ├── apply/route.ts            # Auto-application handler
    ├── coverletter/route.ts      # AI cover letter generator
    └── applications/route.ts     # Application CRUD

/lib
├── supabaseClient.ts             # Supabase configuration
├── agents/
│   ├── scraperAgent.ts           # Web scraping agent
│   ├── matcherAgent.ts           # AI matching agent
│   ├── writerAgent.ts            # Cover letter generator
│   └── trackerAgent.ts           # Application status tracker
├── realtime.ts                   # Real-time subscriptions
├── validation.ts                 # Input validation
└── errors.ts                     # Error handling

/components/ui
├── Button.tsx                    # Reusable button component
├── Card.tsx                      # Reusable card component
├── Input.tsx                     # Form input component
├── Modal.tsx                     # Modal component
└── FileUpload.tsx               # File upload component

/hooks
└── useRealtime.ts                # Real-time React hooks

/database
└── schema.sql                    # Database schema
```

## API Endpoints

### Authentication
- User registration and profile management

### Internship Scraping
- `POST /api/scrape` - Start internship scraping
- `GET /api/scrape` - Get scraper status

### AI Matching
- `POST /api/match` - Run resume-to-job matching
- `GET /api/match` - Get matching insights

### Cover Letters
- `POST /api/coverletter` - Generate cover letter
- `GET /api/coverletter` - Get writing tips
- `PUT /api/coverletter` - Optimize existing cover letter

### Applications
- `GET /api/applications` - List applications
- `POST /api/applications` - Create application
- `PUT /api/applications` - Update application
- `DELETE /api/applications` - Delete application

### Automated Applications
- `POST /api/apply` - Submit automated application

## Database Schema

### Users Table
- User profile information
- Resume and social links
- Authentication data

### Internships Table
- Scraped internship listings
- AI match scores
- Application metadata

### Applications Table
- Application status tracking
- Cover letters and notes
- Timeline of interactions

### Scraping Sources Table
- Configured scraping targets
- Selector configurations
- Last scrape timestamps

## Security Features

- Row Level Security (RLS) in Supabase
- Rate limiting on all API endpoints
- Input validation and sanitization
- CORS configuration
- Content Security Policy headers
- SQL injection prevention
- XSS protection

## AI Features

### Resume Analysis
- Skills extraction using NLP
- Experience level classification
- GitHub profile integration
- Embedding generation

### Job Matching
- Semantic similarity scoring
- Skills overlap analysis
- Location preference weighting
- Company culture matching

### Cover Letter Generation
- GPT-4 powered personalization
- Resume highlight extraction
- Company research integration
- Multiple tone options

## Deployment

The application is designed for deployment on Vercel with Supabase as the backend.

### Environment Setup
1. Create Supabase project
2. Run database schema
3. Configure environment variables
4. Deploy to Vercel

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please open an issue in the repository.