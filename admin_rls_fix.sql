-- ==========================================
-- ADMIN RLS POLICIES FIX FOR NURSE PROFILES
-- ==========================================

-- 1. Fix UPDATE policy so Admins can accept/reject nurses (verification_status)
DROP POLICY IF EXISTS "Nurses can update own profile" ON public.nurse_profiles;

CREATE POLICY "Nurses and Admins can update nurse profiles"
  ON public.nurse_profiles FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 2. Add DELETE policy so Admins can delete nurse profiles directly
CREATE POLICY "Admins can delete nurse profiles"
  ON public.nurse_profiles FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
