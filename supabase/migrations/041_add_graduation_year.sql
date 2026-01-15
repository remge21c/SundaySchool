-- Add graduation_year column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS graduation_year INTEGER;

-- Add index for graduation_year for faster filtering (since we will filter it out usually)
CREATE INDEX IF NOT EXISTS idx_students_graduation_year ON students(graduation_year);
