# AI Internship Hunter

AI-powered platform that automatically finds internships matching your resume and GitHub, generates personalized cover letters, and tracks application progress.

## Features

- **Smart Matching**: AI-powered resume-to-job matching using OpenAI embeddings
- **Cover Letter Generation**: GPT-4 powered personalized cover letters
- **Automated Scraping**: Internship aggregation from LinkedIn, Indeed, and Glassdoor
- **Application Tracking**: Real-time status monitoring with Kanban board
- **Real-time Updates**: Live updates via Supabase subscriptions

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS, React Hook Form
- **Backend**: Next.js API Routes, Supabase, PostgreSQL
- **AI**: OpenAI GPT-4, LangChain, Embeddings
- **Web Scraping**: Playwright
- **Database**: Supabase (PostgreSQL) with Row Level Security

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
GITHUB_TOKEN=your_github_token
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

5. Set up the database schema:
```sql
-- Run the SQL from database/schema.sql in your Supabase project
```

### Running the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

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