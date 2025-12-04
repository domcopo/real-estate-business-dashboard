DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE properties ADD COLUMN workspace_id TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'mortgage_holder'
  ) THEN
    ALTER TABLE properties ADD COLUMN mortgage_holder TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'purchase_price'
  ) THEN
    ALTER TABLE properties ADD COLUMN purchase_price DECIMAL(12, 2) NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'current_est_value'
  ) THEN
    ALTER TABLE properties ADD COLUMN current_est_value DECIMAL(12, 2) NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'monthly_mortgage_payment'
  ) THEN
    ALTER TABLE properties ADD COLUMN monthly_mortgage_payment DECIMAL(10, 2) NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'monthly_insurance'
  ) THEN
    ALTER TABLE properties ADD COLUMN monthly_insurance DECIMAL(10, 2) NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'monthly_property_tax'
  ) THEN
    ALTER TABLE properties ADD COLUMN monthly_property_tax DECIMAL(10, 2) NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'monthly_other_costs'
  ) THEN
    ALTER TABLE properties ADD COLUMN monthly_other_costs DECIMAL(10, 2) NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'monthly_gross_rent'
  ) THEN
    ALTER TABLE properties ADD COLUMN monthly_gross_rent DECIMAL(10, 2) NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'ownership'
  ) THEN
    ALTER TABLE properties ADD COLUMN ownership TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'linked_websites'
  ) THEN
    ALTER TABLE properties ADD COLUMN linked_websites TEXT[];
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE properties ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE properties ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
  END IF;
END $$;














