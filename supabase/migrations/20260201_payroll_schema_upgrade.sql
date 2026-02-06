-- Update Payroll Settings with multiple fee types
ALTER TABLE payroll_settings 
ADD COLUMN IF NOT EXISTS duty_fee NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS evening_study_fee NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS saturday_study_fee NUMERIC(10, 2) DEFAULT 0.00;

-- Update the default record with the new initial values
UPDATE payroll_settings
SET 
    substitution_fee = 170.00,
    duty_fee = 200.00,
    evening_study_fee = 400.00,
    saturday_study_fee = 1000.00
WHERE school_id = '00000000-0000-0000-0000-000000000000';
