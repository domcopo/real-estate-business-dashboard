# Supabase Database Files

This directory contains database schema and migration files for the Supabase database.

## Files

- `schema.sql` - Complete database schema with all tables, indexes, RLS policies, and triggers

## Usage

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `schema.sql`
5. Run the query

## Schema Overview

The schema includes the following tables:

- `blops` - Flexboard items
- `websites` - Tracked websites
- `subscriptions` - Subscription services
- `properties` - Real estate properties
- `rent_roll_units` - Rental units
- `work_requests` - Property maintenance requests
- `agency_clients` - Agency/client management
- `ghl_clients` - GoHighLevel clients
- `ghl_weekly_metrics` - Weekly metrics for GHL clients

See `DATABASE_SETUP.md` in the root directory for detailed setup instructions.







