-- Add missing columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen timestamptz;

-- Create emergencies table
CREATE TABLE IF NOT EXISTS emergencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  responder_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  emergency_type text NOT NULL CHECK (emergency_type IN ('fire', 'medical', 'police', 'accident')),
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dispatched', 'on_scene', 'resolved', 'cancelled')),
  latitude double precision,
  longitude double precision,
  address text,
  photo_url text,
  priority integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Create emergency_messages for chat
CREATE TABLE IF NOT EXISTS emergency_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id uuid REFERENCES emergencies(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create tracking_logs for real-time location tracking
CREATE TABLE IF NOT EXISTS tracking_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id uuid REFERENCES emergencies(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create first_aid_guides
CREATE TABLE IF NOT EXISTS first_aid_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  content text NOT NULL,
  image_url text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE emergencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_aid_guides ENABLE ROW LEVEL SECURITY;

-- RLS Policies for emergencies
CREATE POLICY "citizens_view_own_emergencies" ON emergencies FOR SELECT
  TO authenticated USING (auth.uid() = citizen_id OR auth.uid() = responder_id);

CREATE POLICY "responders_view_pending" ON emergencies FOR SELECT
  TO authenticated USING (status = 'pending' OR auth.uid() = citizen_id OR auth.uid() = responder_id);

CREATE POLICY "citizens_create_emergencies" ON emergencies FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = citizen_id);

CREATE POLICY "responders_update_emergencies" ON emergencies FOR UPDATE
  TO authenticated USING (true);

-- RLS Policies for messages
CREATE POLICY "participants_view_messages" ON emergency_messages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM emergencies WHERE id = emergency_id AND (citizen_id = auth.uid() OR responder_id = auth.uid()))
  );

CREATE POLICY "participants_send_messages" ON emergency_messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM emergencies WHERE id = emergency_id AND (citizen_id = auth.uid() OR responder_id = auth.uid()))
  );

-- RLS Policies for tracking_logs
CREATE POLICY "participants_view_tracking" ON tracking_logs FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM emergencies WHERE id = emergency_id AND (citizen_id = auth.uid() OR responder_id = auth.uid()))
  );

CREATE POLICY "participants_add_tracking" ON tracking_logs FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM emergencies WHERE id = emergency_id AND (citizen_id = auth.uid() OR responder_id = auth.uid()))
  );

-- RLS Policies for first_aid_guides (public read)
CREATE POLICY "public_read_guides" ON first_aid_guides FOR SELECT
  TO authenticated USING (true);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS emergencies_status_idx ON emergencies(status);
CREATE INDEX IF NOT EXISTS emergencies_citizen_idx ON emergencies(citizen_id);
CREATE INDEX IF NOT EXISTS emergencies_responder_idx ON emergencies(responder_id);
CREATE INDEX IF NOT EXISTS emergencies_created_idx ON emergencies(created_at DESC);

-- Insert default first aid guides
INSERT INTO first_aid_guides (title, category, content, display_order) VALUES
('Adult CPR', 'cpr', '1. Check the scene for safety\n2. Check for responsiveness\n3. Call 911\n4. Begin chest compressions (30)\n5. Give 2 rescue breaths\n6. Continue until help arrives', 1),
('Child CPR', 'cpr', '1. Check for responsiveness\n2. Call 911\n3. Begin chest compressions (30)\n4. Give 2 rescue breaths\n5. Use gentler compressions for children', 2),
('Minor Burns Treatment', 'burns', '1. Cool the burn under running water\n2. Remove tight items\n3. Cover with sterile bandage\n4. Take pain relievers if needed\n5. Do not break blisters', 1),
('Severe Bleeding Control', 'bleeding', '1. Apply direct pressure with clean cloth\n2. Maintain pressure for 5-10 minutes\n3. Do not remove the cloth\n4. Add more cloth if needed\n5. Seek immediate medical attention', 1),
('Heimlich Maneuver', 'choking', '1. Stand behind the person\n2. Make a fist, place above navel\n3. Grasp fist with other hand\n4. Perform quick upward thrusts\n5. Continue until object expelled', 1),
('Fracture Care', 'fractures', '1. Immobilize the injured area\n2. Apply ice to reduce swelling\n3. Elevate if possible\n4. Do not attempt to realign bone\n5. Seek medical care immediately', 1)
ON CONFLICT DO NOTHING;