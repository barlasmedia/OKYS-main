
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qhizbconwmmavpgajtsu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoaXpiY29ud21tYXZwZ2FqdHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODYzODQsImV4cCI6MjA4NDc2MjM4NH0.GZMbuqbybNgHoBFcLivL31dwCIwDx-CcAdKhb3woa9k';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findInXml() {
    const { data: dbTeachers, error: dbError } = await supabase
        .from('timetable_teachers')
        .select('id, name');

    if (dbError) {
        console.error('DB Error:', dbError);
        return;
    }

    const { data: importData, error: importError } = await supabase
        .from('timetable_imports')
        .select('xml_content')
        .order('created_at', { ascending: false })
        .limit(1);

    if (importError) {
        console.error('Import Error:', importError);
        return;
    }

    if (!importData || importData.length === 0) {
        console.log('No import data found.');
        return;
    }

    const xml = importData[0].xml_content;

    // Simple regex to find teachers in XML
    // <teacher id="xxx" name="yyy" ... />
    const teacherRegex = /<teacher\s+id="([^"]+)"\s+name="([^"]+)"/g;
    let match;
    const xmlTeachers = [];
    while ((match = teacherRegex.exec(xml)) !== null) {
        xmlTeachers.push({ id: match[1], name: match[2] });
    }

    console.log('--- XML Teachers ---');
    console.log(JSON.stringify(xmlTeachers.filter(t => t.name === 'ATAM NESLİHAN' || t.name === 'KESKİN KÜBRA'), null, 2));

    console.log('\n--- DB Teachers ---');
    console.log(JSON.stringify(dbTeachers.filter(t => t.name === 'ATAM NESLİHAN' || t.name === 'KESKİN KÜBRA'), null, 2));
}

findInXml();
