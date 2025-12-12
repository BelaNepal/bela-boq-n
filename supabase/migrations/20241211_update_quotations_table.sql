-- Add new fields to quotations table for Quotation PDF feature
ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS recipient_address TEXT,
ADD COLUMN IF NOT EXISTS fob_terms VARCHAR(255),
ADD COLUMN IF NOT EXISTS delivery_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS inquiry_date DATE;
