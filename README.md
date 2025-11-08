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

## Project Structure

```
/app
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