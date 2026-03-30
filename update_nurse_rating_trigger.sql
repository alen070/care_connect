-- ============================================
-- FIX: AUTOMATIC NURSE RATING CALCULATION
-- ============================================
-- Run this in Supabase Dashboard -> SQL Editor
-- This trigger automatically recalculates a nurse's overall rating 
-- whenever a booking receives new feedback.

-- 1. Create the function that calculates the new rating
CREATE OR REPLACE FUNCTION update_nurse_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_new_rating NUMERIC;
  v_total_reviews INTEGER;
BEGIN
  -- Only proceed if feedback was just added or changed
  IF NEW.feedback IS NOT NULL AND (OLD.feedback IS NULL OR NEW.feedback::text <> OLD.feedback::text) THEN
    
    -- Calculate the new average rating and total count from all completed bookings for this nurse
    SELECT 
      COALESCE(ROUND(AVG((feedback->>'rating')::numeric), 1), 0),
      COUNT(feedback)
    INTO 
      v_new_rating, 
      v_total_reviews
    FROM public.bookings
    WHERE nurse_id = NEW.nurse_id
      AND feedback IS NOT NULL;
      
    -- Update the nurse_profiles table with the new stats
    UPDATE public.nurse_profiles
    SET 
      rating = v_new_rating,
      total_reviews = v_total_reviews
    WHERE user_id = NEW.nurse_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the trigger if it already exists (to allow safe re-runs)
DROP TRIGGER IF EXISTS on_booking_feedback_updated ON public.bookings;

-- 3. Create the trigger on the bookings table
CREATE TRIGGER on_booking_feedback_updated
AFTER UPDATE OF feedback ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION update_nurse_rating();
