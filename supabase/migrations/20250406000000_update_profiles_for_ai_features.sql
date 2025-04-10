-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT,
ADD COLUMN IF NOT EXISTS imported_from TEXT,
ADD COLUMN IF NOT EXISTS last_optimized TIMESTAMP WITH TIME ZONE;

-- Create profile_versions table to track changes
CREATE TABLE IF NOT EXISTS public.profile_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT,
  preferred_role TEXT,
  location TEXT,
  bio TEXT,
  skills TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by TEXT NOT NULL DEFAULT 'user',
  version_notes TEXT
);

-- Add RLS policies for profile_versions
ALTER TABLE public.profile_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile versions"
  ON public.profile_versions
  FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own profile versions"
  ON public.profile_versions
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Create function to automatically version profiles on update
CREATE OR REPLACE FUNCTION public.create_profile_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profile_versions (
    profile_id, 
    name, 
    preferred_role, 
    location, 
    bio, 
    skills, 
    created_by,
    version_notes
  ) VALUES (
    OLD.id,
    OLD.name,
    OLD.preferred_role,
    OLD.location,
    OLD.bio,
    OLD.skills,
    'system',
    'Automatic version before update'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS profile_version_trigger ON public.profiles;
CREATE TRIGGER profile_version_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_version();
