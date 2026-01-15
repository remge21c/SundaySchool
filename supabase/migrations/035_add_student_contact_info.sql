-- Add parent_name and phone_number columns to students table

ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone_number TEXT;
