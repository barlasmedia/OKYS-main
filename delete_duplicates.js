
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qhizbconwmmavpgajtsu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoaXpiY29ud21tYXZwZ2FqdHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODYzODQsImV4cCI6MjA4NDc2MjM4NH0.GZMbuqbybNgHoBFcLivL31dwCIwDx-CcAdKhb3woa9k';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
    const { data: teachers, error } = await supabase
        .from('timetable_teachers')
        .select('*')
        .order('created_at', { ascending: true }); // Keep oldest one

    if (error) {
        console.error('Error:', error);
        return;
    }

    const nameMap = new Map();
    const toDelete = [];

    teachers.forEach(t => {
        const name = t.name.trim().toUpperCase();
        if (nameMap.has(name)) {
            toDelete.push(t.id);
        } else {
            nameMap.set(name, t.id);
        }
    });

    console.log(`Found ${toDelete.length} duplicates to delete:`, toDelete);

    if (toDelete.length > 0) {
        // We delete from junctions first just in case cascades aren't fully set up for manual deletes
        // Though timetable_lesson_teachers etc should cascade.
        // Let's just try deleting teachers.
        const { error: deleteError } = await supabase
            .from('timetable_teachers')
            .delete()
            .in('id', toDelete);

        if (deleteError) {
            console.error('Delete Error:', deleteError);
        } else {
            console.log('Successfully deleted duplicate teachers.');
        }
    }
}

cleanupDuplicates();
