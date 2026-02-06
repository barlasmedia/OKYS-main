
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qhizbconwmmavpgajtsu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoaXpiY29ud21tYXZwZ2FqdHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODYzODQsImV4cCI6MjA4NDc2MjM4NH0.GZMbuqbybNgHoBFcLivL31dwCIwDx-CcAdKhb3woa9k';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
    console.log('--- Timetable Classes ---');
    const { data: classes, error: classesError } = await supabase
        .from('timetable_classes')
        .select('name, grade_index')
        .limit(10);

    if (classesError) console.error('Classes Error:', classesError);
    else classes.forEach(c => console.log(`Class: ${c.name}, Grade Index: ${c.grade_index}`));

    console.log('\n--- Recent Lessons and Classes ---');
    const { data: lessons, error: lessonsError } = await supabase
        .from('timetable_lessons')
        .select(`
            id,
            subject_id,
            classes:timetable_lesson_classes(
                class:timetable_classes(name, grade_index)
            )
        `)
        .limit(5);

    if (lessonsError) console.error('Lessons Error:', lessonsError);
    else console.log(JSON.stringify(lessons, null, 2));
}

checkDb();
