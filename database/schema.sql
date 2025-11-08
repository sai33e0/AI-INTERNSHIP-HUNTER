-- AI Internship Hunter Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  github_url TEXT,
  linkedin_url TEXT,
  resume_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Internships table
CREATE TABLE internships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  link TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  salary_range TEXT,
  posted_date DATE,
  deadline DATE,
  source_site TEXT,
  match_score DECIMAL(3,2),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table
CREATE TABLE applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  internship_id UUID REFERENCES internships(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'reviewing', 'accepted', 'rejected')),
  cover_letter TEXT,
  notes TEXT,
  applied_on TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scraping sources table
CREATE TABLE scraping_sources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  selector_config JSONB,
  is_active BOOLEAN DEFAULT true,
  last_scraped TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_internships_user_id ON internships(user_id);
CREATE INDEX idx_internships_match_score ON internships(match_score DESC);
CREATE INDEX idx_internships_created_at ON internships(created_at DESC);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_internship_id ON applications(internship_id);
CREATE INDEX idx_users_email ON users(email);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Internships access policies
CREATE POLICY "Users can view own internships" ON internships FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own internships" ON internships FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own internships" ON internships FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own internships" ON internships FOR DELETE USING (auth.uid()::text = user_id::text);

-- Applications access policies
CREATE POLICY "Users can view own applications" ON applications FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own applications" ON applications FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own applications" ON applications FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own applications" ON applications FOR DELETE USING (auth.uid()::text = user_id::text);

-- Trigger to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_internships_updated_at BEFORE UPDATE ON internships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default scraping sources
INSERT INTO scraping_sources (name, base_url, selector_config) VALUES
(
  'LinkedIn',
  'https://www.linkedin.com/jobs/',
  '{
    "jobCard": ".jobs-search__results-list .base-card",
    "title": ".base-search-card__title",
    "company": ".base-search-card__subtitle a",
    "location": ".job-search-card__location",
    "link": ".base-card__full-link",
    "description": ".show-more-less-html__markup"
  }'
),
(
  'Indeed',
  'https://www.indeed.com/',
  '{
    "jobCard": ".job_seen_beacon",
    "title": ".jcs-JobTitle",
    "company": ".companyName",
    "location": ".companyLocation",
    "link": ".jcs-JobTitle",
    "description": ".job-snippet"
  }'
),
(
  'Glassdoor',
  'https://www.glassdoor.com/Job/',
  '{
    "jobCard": ".jobCard",
    "title": ".jobLink",
    "company": ".compactEmployerName",
    "location": ".loc",
    "link": ".jobLink",
    "description": ".jobDescription"
  }'
);

-- Create a function for similarity search (for advanced matching)
CREATE OR REPLACE FUNCTION match_internships(
  user_profile TEXT,
  min_score DECIMAL DEFAULT 0.5
)
RETURNS TABLE (
  internship_id UUID,
  title TEXT,
  company TEXT,
  location TEXT,
  link TEXT,
  match_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.title,
    i.company,
    i.location,
    i.link,
    CASE
      WHEN i.description IS NOT NULL THEN
        CASE
          WHEN similarity(user_profile, i.description) >= min_score THEN similarity(user_profile, i.description)
          ELSE 0
        END
      ELSE 0
    END as match_score
  FROM internships i
  WHERE i.description IS NOT NULL
    AND similarity(user_profile, i.description) >= min_score
  ORDER BY match_score DESC;
END;
$$ LANGUAGE plpgsql;