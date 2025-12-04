-- Migration to add total_mortgage_amount and custom_fields columns to properties table
-- Run this in your Supabase SQL editor

-- Add total_mortgage_amount column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'total_mortgage_amount'
  ) THEN
    ALTER TABLE properties ADD COLUMN total_mortgage_amount DECIMAL(12, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add custom_fields JSONB column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'custom_fields'
  ) THEN
    ALTER TABLE properties ADD COLUMN custom_fields JSONB;
  END IF;
END $$;

