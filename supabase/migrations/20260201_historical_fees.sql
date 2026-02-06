-- Add amount column to substitutions
ALTER TABLE substitutions 
ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2);

-- Add amount column to extra_tasks
ALTER TABLE extra_tasks
ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2);

-- Backfill existing substitutions with current settings (Best effort)
-- We use a subquery to fetch the current substitution_fee from payroll_settings
UPDATE substitutions
SET amount = (
    SELECT substitution_fee 
    FROM payroll_settings 
    WHERE payroll_settings.school_id = substitutions.school_id
)
WHERE amount IS NULL;

-- Backfill existing extra_tasks
-- We need to handle different task types
UPDATE extra_tasks
SET amount = (
    SELECT 
        CASE 
            WHEN extra_tasks.task_type = 'duty' THEN duty_fee
            WHEN extra_tasks.task_type = 'evening_study' THEN evening_study_fee
            WHEN extra_tasks.task_type = 'saturday_study' THEN saturday_study_fee
            ELSE 0 
        END
    FROM payroll_settings 
    WHERE payroll_settings.school_id = extra_tasks.school_id
)
WHERE amount IS NULL;
