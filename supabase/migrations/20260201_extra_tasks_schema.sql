CREATE TABLE IF NOT EXISTS extra_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL,
    teacher_id TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    task_type TEXT NOT NULL, -- 'duty', 'evening_study', 'saturday_study'
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Link to timetable_teachers for relational integrity
    CONSTRAINT fk_teacher FOREIGN KEY (teacher_id) REFERENCES timetable_teachers(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE extra_tasks ENABLE ROW LEVEL SECURITY;
-- Policy (Updated for MVP/Anon access)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON extra_tasks;
CREATE POLICY "Enable all access" ON extra_tasks
    FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_extra_tasks_school_date ON extra_tasks(school_id, date);
CREATE INDEX idx_extra_tasks_teacher ON extra_tasks(teacher_id);
