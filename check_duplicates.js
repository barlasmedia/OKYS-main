
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qhizbconwmmavpgajtsu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoaXpiY29ud21tYXZwZ2FqdHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODYzODQsImV4cCI6MjA4NDc2MjM4NH0.GZMbuqbybNgHoBFcLivL31dwCIwDx-CcAdKhb3woa9k';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
    const { data: teachers, error } = await supabase
        .from('timetable_teachers')
        .select('name, id');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const nameCount = {};
    const duplicates = [];

    teachers.forEach(t => {
        if (!nameCount[t.name]) {
            nameCount[t.name] = [];
        }
        nameCount[t.name].push(t.id);
    });

    for (const name in nameCount) {
        if (nameCount[name].length > 1) {
            duplicates.push({ name, ids: nameCount[name] });
        }
    }

    console.log('--- Duplicate Teachers Found ---');
    console.log(JSON.stringify(duplicates, null, 2));
    console.log(`Total Teachers: ${teachers.length}`);
}

checkDuplicates();
