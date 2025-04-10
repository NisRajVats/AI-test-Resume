-- Create job_alerts table
CREATE TABLE IF NOT EXISTS public.job_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  location TEXT,
  keywords TEXT[],
  frequency TEXT NOT NULL DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create follow_ups table
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create resume_scores table
CREATE TABLE IF NOT EXISTS public.resume_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  ats_score INTEGER NOT NULL,
  content_score INTEGER NOT NULL,
  format_score INTEGER NOT NULL,
  keyword_score INTEGER NOT NULL,
  overall_score INTEGER NOT NULL,
  industry TEXT,
  job_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create industry_benchmarks table
CREATE TABLE IF NOT EXISTS public.industry_benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry TEXT NOT NULL,
  job_title TEXT NOT NULL,
  avg_ats_score INTEGER NOT NULL,
  avg_content_score INTEGER NOT NULL,
  avg_format_score INTEGER NOT NULL,
  avg_keyword_score INTEGER NOT NULL,
  avg_overall_score INTEGER NOT NULL,
  required_skills TEXT[],
  preferred_skills TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create salary_data table
CREATE TABLE IF NOT EXISTS public.salary_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry TEXT NOT NULL,
  job_title TEXT NOT NULL,
  location TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  min_salary INTEGER NOT NULL,
  max_salary INTEGER NOT NULL,
  avg_salary INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create job_matches table
CREATE TABLE IF NOT EXISTS public.job_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  job_description TEXT NOT NULL,
  match_score INTEGER NOT NULL,
  skills_match TEXT[],
  skills_missing TEXT[],
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for new tables
ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;

-- Job alerts policies
CREATE POLICY "Users can view their own job alerts"
  ON public.job_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own job alerts"
  ON public.job_alerts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job alerts"
  ON public.job_alerts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job alerts"
  ON public.job_alerts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Follow-ups policies
CREATE POLICY "Users can view their own follow-ups"
  ON public.follow_ups
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own follow-ups"
  ON public.follow_ups
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own follow-ups"
  ON public.follow_ups
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own follow-ups"
  ON public.follow_ups
  FOR DELETE
  USING (auth.uid() = user_id);

-- Resume scores policies
CREATE POLICY "Users can view their own resume scores"
  ON public.resume_scores
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resume scores"
  ON public.resume_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Job matches policies
CREATE POLICY "Users can view their own job matches"
  ON public.job_matches
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own job matches"
  ON public.job_matches
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job matches"
  ON public.job_matches
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add new columns to applications table for advanced tracking
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS interview_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS interview_notes TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS offer_amount DECIMAL;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS offer_details TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add new columns to profiles table for advanced features
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_level TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS desired_salary INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_alerts_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true;
