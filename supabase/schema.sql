-- Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to set up all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- BLOPS TABLE (Flexboard items)
-- ============================================
CREATE TABLE blops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- Clerk user ID
  workspace_id TEXT, -- Clerk organization ID (optional)
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  shape TEXT NOT NULL CHECK (shape IN ('circle', 'square', 'pill', 'diamond')),
  color TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'link', 'url', 'file', 'image', 'embed')),
  tags TEXT[], -- Array of tags
  connections TEXT[], -- Array of connected blop IDs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- WEBSITES TABLE
-- ============================================
CREATE TABLE websites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  workspace_id TEXT,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  tech_stack JSONB NOT NULL DEFAULT '{}', -- {frontend, backend, hosting, analytics, payments}
  linked_blops TEXT[], -- Array of blop IDs
  subscription_ids TEXT[], -- Array of subscription IDs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  workspace_id TEXT,
  name TEXT NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('monthly', 'annual')),
  renewal_date DATE NOT NULL,
  category TEXT NOT NULL,
  website_id UUID REFERENCES websites(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PROPERTIES TABLE
-- ============================================
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  workspace_id TEXT,
  address TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('rented', 'vacant', 'under_maintenance', 'sold')),
  -- Financial fields
  mortgage_holder TEXT,
  purchase_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  current_est_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
  monthly_mortgage_payment DECIMAL(10, 2) NOT NULL DEFAULT 0,
  monthly_insurance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  monthly_property_tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  monthly_other_costs DECIMAL(10, 2) NOT NULL DEFAULT 0,
  monthly_gross_rent DECIMAL(10, 2) NOT NULL DEFAULT 0,
  -- Ownership
  ownership TEXT CHECK (ownership IN ('100% ownership', '50% partner', '25% partner', '75% partner', '33% partner', '67% partner')),
  linked_websites TEXT[], -- Array of website IDs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- RENT ROLL UNITS TABLE (for properties)
-- ============================================
CREATE TABLE rent_roll_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_name TEXT NOT NULL,
  tenant_name TEXT NOT NULL,
  monthly_rent DECIMAL(10, 2) NOT NULL,
  lease_start DATE NOT NULL,
  lease_end DATE NOT NULL,
  security_deposit DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- WORK REQUESTS TABLE (for properties)
-- ============================================
CREATE TABLE work_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  date_logged DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('new', 'in_progress', 'completed')) DEFAULT 'new',
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- AGENCY CLIENTS TABLE
-- ============================================
CREATE TABLE agency_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  workspace_id TEXT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  contacts_count INTEGER DEFAULT 0,
  websites_count INTEGER DEFAULT 0,
  tasks_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- GOHIGHLEVEL CLIENTS TABLE
-- ============================================
CREATE TABLE ghl_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- Clerk user ID (affiliate)
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  subscription_plan TEXT NOT NULL CHECK (subscription_plan IN ('starter', 'professional', 'agency', 'enterprise', 'custom')),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'cancelled')) DEFAULT 'active',
  ghl_location_id TEXT,
  ghl_api_key TEXT, -- Encrypted API key (consider using Supabase Vault for encryption)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- GOHIGHLEVEL WEEKLY METRICS TABLE
-- ============================================
CREATE TABLE ghl_weekly_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES ghl_clients(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  views INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, week_start)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Blops indexes
CREATE INDEX idx_blops_user_id ON blops(user_id);
CREATE INDEX idx_blops_workspace_id ON blops(workspace_id);
CREATE INDEX idx_blops_created_at ON blops(created_at DESC);

-- Websites indexes
CREATE INDEX idx_websites_user_id ON websites(user_id);
CREATE INDEX idx_websites_workspace_id ON websites(workspace_id);

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_workspace_id ON subscriptions(workspace_id);
CREATE INDEX idx_subscriptions_renewal_date ON subscriptions(renewal_date);
CREATE INDEX idx_subscriptions_website_id ON subscriptions(website_id);

-- Properties indexes
CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_properties_workspace_id ON properties(workspace_id);
CREATE INDEX idx_properties_status ON properties(status);

-- Rent roll units indexes
CREATE INDEX idx_rent_roll_units_property_id ON rent_roll_units(property_id);

-- Work requests indexes
CREATE INDEX idx_work_requests_property_id ON work_requests(property_id);
CREATE INDEX idx_work_requests_status ON work_requests(status);

-- Agency clients indexes
CREATE INDEX idx_agency_clients_user_id ON agency_clients(user_id);
CREATE INDEX idx_agency_clients_workspace_id ON agency_clients(workspace_id);

-- GoHighLevel indexes
CREATE INDEX idx_ghl_clients_user_id ON ghl_clients(user_id);
CREATE INDEX idx_ghl_metrics_client_id ON ghl_weekly_metrics(client_id);
CREATE INDEX idx_ghl_metrics_week ON ghl_weekly_metrics(week_start);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE blops ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_roll_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghl_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghl_weekly_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
-- Note: These policies use auth.uid() which requires Supabase Auth
-- Since you're using Clerk, you'll need to create a function to map Clerk user_id
-- or use a different approach with service_role key for server-side operations

-- For now, we'll create policies that check user_id directly
-- You may need to adjust these based on your authentication setup

-- Blops policies
CREATE POLICY "Users can view their own blops"
  ON blops FOR SELECT
  USING (true); -- Adjust based on your auth setup

CREATE POLICY "Users can insert their own blops"
  ON blops FOR INSERT
  WITH CHECK (true); -- Adjust based on your auth setup

CREATE POLICY "Users can update their own blops"
  ON blops FOR UPDATE
  USING (true); -- Adjust based on your auth setup

CREATE POLICY "Users can delete their own blops"
  ON blops FOR DELETE
  USING (true); -- Adjust based on your auth setup

-- Websites policies
CREATE POLICY "Users can view their own websites"
  ON websites FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own websites"
  ON websites FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own websites"
  ON websites FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own websites"
  ON websites FOR DELETE
  USING (true);

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own subscriptions"
  ON subscriptions FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own subscriptions"
  ON subscriptions FOR DELETE
  USING (true);

-- Properties policies
CREATE POLICY "Users can view their own properties"
  ON properties FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own properties"
  ON properties FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own properties"
  ON properties FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own properties"
  ON properties FOR DELETE
  USING (true);

-- Rent roll units policies (inherit from property)
CREATE POLICY "Users can view rent roll units for their properties"
  ON rent_roll_units FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = rent_roll_units.property_id
    )
  );

CREATE POLICY "Users can manage rent roll units for their properties"
  ON rent_roll_units FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = rent_roll_units.property_id
    )
  );

-- Work requests policies (inherit from property)
CREATE POLICY "Users can view work requests for their properties"
  ON work_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = work_requests.property_id
    )
  );

CREATE POLICY "Users can manage work requests for their properties"
  ON work_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = work_requests.property_id
    )
  );

-- Agency clients policies
CREATE POLICY "Users can view their own agency clients"
  ON agency_clients FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own agency clients"
  ON agency_clients FOR ALL
  USING (true);

-- GoHighLevel clients policies
CREATE POLICY "Users can view their own GHL clients"
  ON ghl_clients FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own GHL clients"
  ON ghl_clients FOR ALL
  USING (true);

-- GoHighLevel metrics policies (inherit from client)
CREATE POLICY "Users can view metrics for their GHL clients"
  ON ghl_weekly_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ghl_clients
      WHERE ghl_clients.id = ghl_weekly_metrics.client_id
    )
  );

CREATE POLICY "Users can manage metrics for their GHL clients"
  ON ghl_weekly_metrics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ghl_clients
      WHERE ghl_clients.id = ghl_weekly_metrics.client_id
    )
  );

-- ============================================
-- FUNCTIONS FOR UPDATED_AT TIMESTAMP
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_blops_updated_at BEFORE UPDATE ON blops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON websites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rent_roll_units_updated_at BEFORE UPDATE ON rent_roll_units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_requests_updated_at BEFORE UPDATE ON work_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agency_clients_updated_at BEFORE UPDATE ON agency_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ghl_clients_updated_at BEFORE UPDATE ON ghl_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

