-- Live location table for real-time tracking (upsert: one row per user per emergency)
CREATE TABLE IF NOT EXISTS live_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id uuid REFERENCES emergencies(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('citizen', 'responder')),
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(emergency_id, user_id)
);

ALTER TABLE live_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants_view_live_locations" ON live_locations FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM emergencies
      WHERE id = emergency_id
        AND (citizen_id = auth.uid() OR responder_id = auth.uid())
    )
  );

CREATE POLICY "participants_insert_live_location" ON live_locations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "participants_update_live_location" ON live_locations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS live_locations_emergency_idx ON live_locations(emergency_id);
