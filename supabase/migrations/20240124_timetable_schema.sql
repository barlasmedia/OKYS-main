-- Timetable Schema for aSc Import
-- Supporting Multi-tenancy with school_id

-- 1. Timetable Periods
CREATE TABLE IF NOT EXISTS timetable_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL,
    period_index INT NOT NULL, -- period="..." (1, 2, 3...)
    name TEXT NOT NULL,
    short TEXT,
    starttime TEXT,
    endtime TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, period_index)
);

-- 2. Days Definitions
CREATE TABLE IF NOT EXISTS timetable_days_defs (
    id TEXT PRIMARY KEY, -- aSc HEX ID
    school_id UUID NOT NULL,
    days_mask TEXT NOT NULL, -- binary list "10000,..."
    name TEXT NOT NULL,
    short TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Weeks Definitions
CREATE TABLE IF NOT EXISTS timetable_weeks_defs (
    id TEXT PRIMARY KEY, -- aSc HEX ID
    school_id UUID NOT NULL,
    weeks_mask TEXT NOT NULL,
    name TEXT NOT NULL,
    short TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Terms Definitions
CREATE TABLE IF NOT EXISTS timetable_terms_defs (
    id TEXT PRIMARY KEY, -- aSc HEX ID
    school_id UUID NOT NULL,
    terms_mask TEXT NOT NULL,
    name TEXT NOT NULL,
    short TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Subjects
CREATE TABLE IF NOT EXISTS timetable_subjects (
    id TEXT PRIMARY KEY, -- aSc HEX ID
    school_id UUID NOT NULL,
    name TEXT NOT NULL,
    short TEXT,
    partner_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Teachers
CREATE TABLE IF NOT EXISTS timetable_teachers (
    id TEXT PRIMARY KEY, -- aSc HEX ID
    school_id UUID NOT NULL,
    firstname TEXT,
    lastname TEXT,
    name TEXT NOT NULL,
    short TEXT,
    gender CHAR(1), -- 'M' or 'F'
    color TEXT,
    email TEXT,
    mobile TEXT,
    partner_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6.1 Buildings
CREATE TABLE IF NOT EXISTS timetable_buildings (
    id TEXT PRIMARY KEY, -- aSc HEX ID
    school_id UUID NOT NULL,
    name TEXT NOT NULL,
    partner_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Classrooms
CREATE TABLE IF NOT EXISTS timetable_classrooms (
    id TEXT PRIMARY KEY, -- aSc HEX ID
    school_id UUID NOT NULL,
    name TEXT NOT NULL,
    short TEXT,
    capacity TEXT,
    building_id TEXT REFERENCES timetable_buildings(id),
    partner_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Grades
CREATE TABLE IF NOT EXISTS timetable_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL,
    grade_index INT NOT NULL,
    name TEXT NOT NULL,
    short TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, grade_index)
);

-- 9. Classes
CREATE TABLE IF NOT EXISTS timetable_classes (
    id TEXT PRIMARY KEY, -- aSc HEX ID
    school_id UUID NOT NULL,
    name TEXT NOT NULL,
    short TEXT,
    teacher_id TEXT REFERENCES timetable_teachers(id),
    grade_index INT, -- references grade_index in timetable_grades
    partner_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Groups
CREATE TABLE IF NOT EXISTS timetable_groups (
    id TEXT PRIMARY KEY, -- aSc HEX ID
    school_id UUID NOT NULL,
    class_id TEXT NOT NULL REFERENCES timetable_classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    entire_class BOOLEAN DEFAULT FALSE,
    division_tag INT,
    student_count INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Lessons (Rules)
CREATE TABLE IF NOT EXISTS timetable_lessons (
    id TEXT PRIMARY KEY, -- aSc HEX ID
    school_id UUID NOT NULL,
    subject_id TEXT REFERENCES timetable_subjects(id) ON DELETE CASCADE,
    periods_per_card INT,
    periods_per_week NUMERIC(5,2),
    days_def_id TEXT REFERENCES timetable_days_defs(id),
    weeks_def_id TEXT REFERENCES timetable_weeks_defs(id),
    terms_def_id TEXT REFERENCES timetable_terms_defs(id),
    capacity TEXT,
    seminar_group TEXT,
    partner_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junctions for Lessons
CREATE TABLE IF NOT EXISTS timetable_lesson_teachers (
    lesson_id TEXT REFERENCES timetable_lessons(id) ON DELETE CASCADE,
    teacher_id TEXT REFERENCES timetable_teachers(id) ON DELETE CASCADE,
    PRIMARY KEY (lesson_id, teacher_id)
);

CREATE TABLE IF NOT EXISTS timetable_lesson_classes (
    lesson_id TEXT REFERENCES timetable_lessons(id) ON DELETE CASCADE,
    class_id TEXT REFERENCES timetable_classes(id) ON DELETE CASCADE,
    PRIMARY KEY (lesson_id, class_id)
);

CREATE TABLE IF NOT EXISTS timetable_lesson_groups (
    lesson_id TEXT REFERENCES timetable_lessons(id) ON DELETE CASCADE,
    group_id TEXT REFERENCES timetable_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (lesson_id, group_id)
);

-- 12. Cards (The actual occurrence)
CREATE TABLE IF NOT EXISTS timetable_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL,
    lesson_id TEXT NOT NULL REFERENCES timetable_lessons(id) ON DELETE CASCADE,
    period_index INT NOT NULL, -- references period_index in timetable_periods
    days_mask TEXT NOT NULL, -- "10000" etc.
    weeks_mask TEXT NOT NULL,
    terms_mask TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction for Card Classrooms
CREATE TABLE IF NOT EXISTS timetable_card_classrooms (
    card_id UUID REFERENCES timetable_cards(id) ON DELETE CASCADE,
    classroom_id TEXT REFERENCES timetable_classrooms(id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, classroom_id)
);

-- 13. Timetable Imports (Raw XML storage)
CREATE TABLE IF NOT EXISTS timetable_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL,
    file_name TEXT,
    xml_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
