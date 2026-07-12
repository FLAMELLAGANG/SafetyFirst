-- Add medical profile fields for citizen emergency cards
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS blood_type text,
  ADD COLUMN IF NOT EXISTS allergies text,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text;

-- Allow emergency participants to read each other's profiles
-- Responders need to see the citizen's profile, citizens need to see responder's name
DROP POLICY IF EXISTS "emergency_participants_view_profiles" ON profiles;
CREATE POLICY "emergency_participants_view_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM emergencies
      WHERE (citizen_id = profiles.id OR responder_id = profiles.id)
        AND (citizen_id = auth.uid() OR responder_id = auth.uid())
    )
  );
