-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'worker' CHECK (role IN ('worker', 'supervisor', 'admin')),
  department TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incidents table
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'investigating', 'resolved', 'closed')),
  incident_type TEXT NOT NULL,
  incident_date TIMESTAMPTZ DEFAULT NOW(),
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hazards table
CREATE TABLE hazards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'mitigating', 'resolved', 'closed')),
  hazard_category TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklists table
CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  is_template BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist items table
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist responses table
CREATE TABLE checklist_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  response BOOLEAN,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist audits table (completed checklists)
CREATE TABLE checklist_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  score INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'failed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Emergency contacts table
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  department TEXT,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training modules table
CREATE TABLE training_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  content_url TEXT,
  duration_minutes INTEGER DEFAULT 15,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User training progress table
CREATE TABLE user_training_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percent INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- Safety metrics/views for dashboard
CREATE TABLE safety_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_date DATE NOT NULL,
  total_incidents INTEGER DEFAULT 0,
  total_hazards INTEGER DEFAULT 0,
  hazards_resolved INTEGER DEFAULT 0,
  audits_completed INTEGER DEFAULT 0,
  training_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(metric_date)
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE hazards ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- RLS Policies for incidents
CREATE POLICY "select_all_incidents" ON incidents FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_own_incidents" ON incidents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_incidents" ON incidents FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
  ));
CREATE POLICY "delete_own_incidents" ON incidents FOR DELETE
  TO authenticated USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for hazards
CREATE POLICY "select_all_hazards" ON hazards FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_own_hazards" ON hazards FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_hazards" ON hazards FOR UPDATE
  TO authenticated USING (true);
CREATE POLICY "delete_own_hazards" ON hazards FOR DELETE
  TO authenticated USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for checklists (read for all, write for supervisors/admins)
CREATE POLICY "select_all_checklists" ON checklists FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_checklists" ON checklists FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
  ));
CREATE POLICY "update_checklists" ON checklists FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
  ));

-- RLS Policies for checklist_items
CREATE POLICY "select_all_checklist_items" ON checklist_items FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_checklist_items" ON checklist_items FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
  ));
CREATE POLICY "update_checklist_items" ON checklist_items FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
  ));

-- RLS Policies for checklist_responses
CREATE POLICY "select_own_responses" ON checklist_responses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_responses" ON checklist_responses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_responses" ON checklist_responses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for checklist_audits
CREATE POLICY "select_all_audits" ON checklist_audits FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_own_audits" ON checklist_audits FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_audits" ON checklist_audits FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for emergency_contacts (public read for all authenticated)
CREATE POLICY "select_all_emergency_contacts" ON emergency_contacts FOR SELECT
  TO authenticated USING (true);

-- RLS Policies for training_modules
CREATE POLICY "select_all_training" ON training_modules FOR SELECT
  TO authenticated USING (true);

-- RLS Policies for user_training_progress
CREATE POLICY "select_own_progress" ON user_training_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_progress" ON user_training_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_progress" ON user_training_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for safety_metrics
CREATE POLICY "select_all_metrics" ON safety_metrics FOR SELECT
  TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX idx_incidents_user_id ON incidents(user_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX idx_hazards_user_id ON hazards(user_id);
CREATE INDEX idx_hazards_status ON hazards(status);
CREATE INDEX idx_hazards_created_at ON hazards(created_at DESC);
CREATE INDEX idx_checklist_audits_user_id ON checklist_audits(user_id);
CREATE INDEX idx_user_training_user_id ON user_training_progress(user_id);

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default emergency contacts
INSERT INTO emergency_contacts (name, role, phone_number, department, is_primary, display_order) VALUES
  ('Emergency Services', 'Emergency Response', '911', 'External', true, 1),
  ('Safety Hotline', 'Safety Department', '1-800-SAFETY', 'Safety', true, 2),
  ('HR Department', 'Human Resources', '1-800-HR-HELP', 'Human Resources', false, 3),
  ('Facilities Manager', 'Facilities', '1-800-FACILITY', 'Operations', false, 4);

-- Insert default checklist templates
INSERT INTO checklists (title, description, category, is_template) VALUES
  ('Daily Safety Walkthrough', 'Complete daily safety inspection checklist', 'inspection', true),
  ('Fire Safety Audit', 'Quarterly fire safety equipment and procedure audit', 'fire_safety', true),
  ('PPE Inspection', 'Personal protective equipment inspection checklist', 'ppe', true);

-- Insert checklist items for Daily Safety Walkthrough
INSERT INTO checklist_items (checklist_id, question, order_index) 
SELECT id, 'All emergency exits are clear and accessible', 1 FROM checklists WHERE title = 'Daily Safety Walkthrough';
INSERT INTO checklist_items (checklist_id, question, order_index) 
SELECT id, 'Fire extinguishers are in place and inspected', 2 FROM checklists WHERE title = 'Daily Safety Walkthrough';
INSERT INTO checklist_items (checklist_id, question, order_index) 
SELECT id, 'First aid kit is stocked and accessible', 3 FROM checklists WHERE title = 'Daily Safety Walkthrough';
INSERT INTO checklist_items (checklist_id, question, order_index) 
SELECT id, 'Walkways are clear of obstructions', 4 FROM checklists WHERE title = 'Daily Safety Walkthrough';
INSERT INTO checklist_items (checklist_id, question, order_index) 
SELECT id, 'Safety signage is visible and intact', 5 FROM checklists WHERE title = 'Daily Safety Walkthrough';
INSERT INTO checklist_items (checklist_id, question, order_index) 
SELECT id, 'Emergency lighting is functional', 6 FROM checklists WHERE title = 'Daily Safety Walkthrough';

-- Insert checklist items for Fire Safety Audit
INSERT INTO checklist_items (checklist_id, question, order_index) 
SELECT id, 'Fire alarms tested and functional', 1 FROM checklists WHERE title = 'Fire Safety Audit';
INSERT INTO checklist_items (checklist_id, question, order_index) 
SELECT id, 'Sprinkler system inspected', 2 FROM checklists WHERE title = 'Fire Safety Audit';
INSERT INTO checklist_items (checklist_id, question, order_index) 
SELECT id, 'Emergency evacuation plan posted', 3 FROM checklists WHERE title = 'Fire Safety Audit';
INSERT INTO checklist_items (checklist_id, question, order_index) 
SELECT id, 'Fire drill conducted within last 90 days', 4 FROM checklists WHERE title = 'Fire Safety Audit';

-- Insert checklist items for PPE Inspection
INSERT INTO checklist_items (checklist_id, question, order_index) 
SELECT id, 'Hard hats available and in good condition', 1 FROM checklists WHERE title = 'PPE Inspection';
INSERT INTO checklist_items (checklist_id, question, order_index) 
SELECT id, 'Safety glasses clean and scratch-free', 2 FROM checklists WHERE title = 'PPE Inspection';
INSERT INTO checklist_items (checklist_id, question, order_index) 
SELECT id, 'Gloves available and intact', 3 FROM checklists WHERE title = 'PPE Inspection';
INSERT INTO checklist_items (checklist_id, question, order_index) 
SELECT id, 'Safety boots/shoes properly fitted', 4 FROM checklists WHERE title = 'PPE Inspection';
INSERT INTO checklist_items (checklist_id, question, order_index) 
SELECT id, 'High-visibility vests available', 5 FROM checklists WHERE title = 'PPE Inspection';

-- Insert default training modules
INSERT INTO training_modules (title, description, category, duration_minutes, is_required) VALUES
  ('Workplace Safety Fundamentals', 'Introduction to workplace safety principles and procedures', 'safety_basics', 30, true),
  ('Emergency Response Training', 'How to respond to various emergency situations', 'emergency', 45, true),
  ('Fire Safety & Evacuation', 'Fire prevention and evacuation procedures', 'fire_safety', 30, true),
  ('PPE Usage Guidelines', 'Proper use and maintenance of personal protective equipment', 'ppe', 20, true),
  ('Hazard Identification', 'Learn to identify and report workplace hazards', 'hazard', 25, false),
  ('First Aid Basics', 'Basic first aid techniques and when to use them', 'first_aid', 40, false);
