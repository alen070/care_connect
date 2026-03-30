-- ============================================
-- FIX RLS POLICIES FOR SHELTERS & NURSES
-- ============================================

-- 1. Enable UPDATE for Shelters
DROP POLICY IF EXISTS "Shelter users can update own shelter" ON public.shelters;
CREATE POLICY "Shelter users can update own shelter" 
ON public.shelters FOR UPDATE 
USING (auth.uid() = shelter_user_id);

-- 2. Ensure INSERT for Shelters (if missing or broken)
DROP POLICY IF EXISTS "Shelter users can insert own shelter" ON public.shelters;
CREATE POLICY "Shelter users can insert own shelter" 
ON public.shelters FOR INSERT 
WITH CHECK (auth.uid() = shelter_user_id);

-- 3. Enable UPDATE for Nurse Profiles
DROP POLICY IF EXISTS "Nurses can update own profile" ON public.nurse_profiles;
CREATE POLICY "Nurses can update own profile" 
ON public.nurse_profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. Ensure INSERT for Nurse Profiles
DROP POLICY IF EXISTS "Nurses can insert own profile" ON public.nurse_profiles;
CREATE POLICY "Nurses can insert own profile" 
ON public.nurse_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. Ensure Select is always open for basic lookup
DROP POLICY IF EXISTS "Shelters are viewable by everyone" ON public.shelters;
CREATE POLICY "Shelters are viewable by everyone" 
ON public.shelters FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Nurse profiles are viewable by everyone" ON public.nurse_profiles;
CREATE POLICY "Nurse profiles are viewable by everyone" 
ON public.nurse_profiles FOR SELECT 
USING (true);

-- 6. Enable Access to Shelter Reports for Shelters
DROP POLICY IF EXISTS "Shelters can view assigned reports" ON public.shelter_reports;
CREATE POLICY "Shelters can view assigned reports" 
ON public.shelter_reports FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.shelters 
    WHERE public.shelters.shelter_user_id = auth.uid() 
    AND (
      public.shelters.id = public.shelter_reports.assigned_shelter_id 
      OR public.shelter_reports.status = 'notified' -- Allow seeing notifications
    )
  )
);

DROP POLICY IF EXISTS "Shelters can update assigned reports" ON public.shelter_reports;
CREATE POLICY "Shelters can update assigned reports" 
ON public.shelter_reports FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.shelters 
    WHERE public.shelters.shelter_user_id = auth.uid() 
    AND public.shelters.id = public.shelter_reports.assigned_shelter_id
  )
);
