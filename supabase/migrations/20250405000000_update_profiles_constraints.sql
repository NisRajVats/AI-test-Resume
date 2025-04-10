-- Remove the unique constraint on email in profiles table
-- since uniqueness is already enforced in auth.users
ALTER TABLE IF EXISTS public.profiles 
DROP CONSTRAINT IF EXISTS profiles_email_key;

-- Add a foreign key constraint to ensure profile.id matches auth.users.id
ALTER TABLE IF EXISTS public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Update RLS policies for profiles
CREATE POLICY IF NOT EXISTS "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);
