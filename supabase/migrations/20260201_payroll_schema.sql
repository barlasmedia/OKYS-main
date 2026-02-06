-- Payroll Settings Table
CREATE TABLE IF NOT EXISTS payroll_settings (
    school_id UUID PRIMARY KEY,
    substitution_fee NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payroll_settings ENABLE ROW LEVEL SECURITY;

-- Simple policy for MVP (Allow all for now, assuming admin only access for management)
-- Policy (Updated for MVP/Anon access)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON payroll_settings;
CREATE POLICY "Enable all access" ON payroll_settings
    FOR ALL USING (true) WITH CHECK (true);

-- Initial record for the default school if it doesn't exist
INSERT INTO payroll_settings (school_id, substitution_fee)
VALUES ('00000000-0000-0000-0000-000000000000', 100.00)
ON CONFLICT (school_id) DO NOTHING;
