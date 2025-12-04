/**
 * Database schema helper
 * Generates a schema string from the database types for AI context
 */

import { Database } from "@/types/database"

/**
 * Generate a PostgreSQL schema description string from the database types
 * This is used to provide context to the AI for SQL generation
 */
export function getDatabaseSchema(): string {
  const schema = `
-- Database Schema for Unified Workspace
-- PostgreSQL/Supabase compatible

-- BLOPS TABLE (Flexboard items)
CREATE TABLE blops (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  shape TEXT NOT NULL CHECK (shape IN ('circle', 'square', 'pill', 'diamond')),
  color TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'link', 'url', 'file', 'image', 'embed')),
  tags TEXT[],
  connections TEXT[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- WEBSITES TABLE
CREATE TABLE websites (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  tech_stack JSONB NOT NULL DEFAULT '{}',
  linked_blops TEXT[],
  subscription_ids TEXT[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- SUBSCRIPTIONS TABLE
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT,
  name TEXT NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('monthly', 'annual')),
  renewal_date DATE NOT NULL,
  category TEXT NOT NULL,
  website_id UUID REFERENCES websites(id) ON DELETE SET NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- PROPERTIES TABLE
CREATE TABLE properties (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT,
  address TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('rented', 'vacant', 'under_maintenance', 'sold')),
  mortgage_holder TEXT,
  total_mortgage_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  purchase_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  current_est_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
  monthly_mortgage_payment DECIMAL(10, 2) NOT NULL DEFAULT 0,
  monthly_insurance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  monthly_property_tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  monthly_other_costs DECIMAL(10, 2) NOT NULL DEFAULT 0,
  monthly_gross_rent DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ownership TEXT CHECK (ownership IN ('100% ownership', '50% partner', '25% partner', '75% partner', '33% partner', '67% partner')),
  linked_websites TEXT[],
  custom_fields JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- RENT ROLL UNITS TABLE
CREATE TABLE rent_roll_units (
  id UUID PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_name TEXT NOT NULL,
  tenant_name TEXT NOT NULL,
  monthly_rent DECIMAL(10, 2) NOT NULL,
  lease_start DATE NOT NULL,
  lease_end DATE NOT NULL,
  security_deposit DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- WORK REQUESTS TABLE
CREATE TABLE work_requests (
  id UUID PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  date_logged DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('new', 'in_progress', 'completed')) DEFAULT 'new',
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- AGENCY CLIENTS TABLE
CREATE TABLE agency_clients (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  contacts_count INTEGER DEFAULT 0,
  websites_count INTEGER DEFAULT 0,
  tasks_count INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- GOHIGHLEVEL CLIENTS TABLE
CREATE TABLE ghl_clients (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  subscription_plan TEXT NOT NULL CHECK (subscription_plan IN ('starter', 'professional', 'agency', 'enterprise', 'custom')),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'cancelled')) DEFAULT 'active',
  ghl_location_id TEXT,
  ghl_api_key TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- GOHIGHLEVEL WEEKLY METRICS TABLE
CREATE TABLE ghl_weekly_metrics (
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES ghl_clients(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  views INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10, 2),
  created_at TIMESTAMP,
  UNIQUE(client_id, week_start)
);

-- Notes:
-- All tables have user_id and workspace_id fields for multi-tenant support
-- Use user_id to filter queries for the current user
-- Timestamps are stored as TIMESTAMP type
-- Arrays are stored as PostgreSQL array types (TEXT[], UUID[])
-- JSONB is used for flexible JSON data (tech_stack in websites, custom_fields in properties)
`

  return schema.trim()
}
