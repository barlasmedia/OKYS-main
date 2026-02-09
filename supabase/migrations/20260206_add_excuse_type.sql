-- Add excuse_type column to substitutions table
-- This allows tracking the reason for teacher absence and determines payroll deduction logic

-- Add excuse_type column with default value 'gelmedi' (maintains current behavior)
ALTER TABLE substitutions 
ADD COLUMN excuse_type TEXT NOT NULL DEFAULT 'gelmedi' 
CHECK (excuse_type IN ('raporlu', 'idari_izinli_gorevli', 'gelmedi'));

-- Add comment to document the column
COMMENT ON COLUMN substitutions.excuse_type IS 'Mazeret türü: raporlu (no deduction), idari_izinli_gorevli (no deduction), gelmedi (deduction applied)';

-- Create index for filtering by excuse type (useful for reports)
CREATE INDEX IF NOT EXISTS idx_substitutions_excuse_type ON substitutions(excuse_type);
