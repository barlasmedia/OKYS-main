-- Substitution Module Schema

-- 1. Substitutions Table
CREATE TABLE IF NOT EXISTS substitutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL,
    
    -- Relationships (Nullable with SET NULL for persistence after data cleanup)
    original_teacher_id TEXT REFERENCES timetable_teachers(id) ON DELETE SET NULL,
    substitute_teacher_id TEXT REFERENCES timetable_teachers(id) ON DELETE SET NULL,
    lesson_id TEXT REFERENCES timetable_lessons(id) ON DELETE SET NULL,
    
    -- Denormalized Data (For history persistence even if links are broken)
    original_teacher_name TEXT,
    substitute_teacher_name TEXT,
    subject_name TEXT,
    class_names TEXT,
    period_name TEXT,

    date DATE NOT NULL,
    period_index INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
    compensation_type TEXT DEFAULT 'paid' CHECK (compensation_type IN ('paid', 'voluntary', 'none')),
    reason TEXT NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(school_id, original_teacher_id, date, period_index)
);

-- Index for faster lookups by date and school (typical query pattern)
CREATE INDEX IF NOT EXISTS idx_substitutions_date_school ON substitutions(school_id, date);
CREATE INDEX IF NOT EXISTS idx_substitutions_substitute_date ON substitutions(substitute_teacher_id, date);
