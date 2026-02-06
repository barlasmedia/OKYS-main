
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qhizbconwmmavpgajtsu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoaXpiY29ud21tYXZwZ2FqdHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODYzODQsImV4cCI6MjA4NDc2MjM4NH0.GZMbuqbybNgHoBFcLivL31dwCIwDx-CcAdKhb3woa9k';
const supabase = createClient(supabaseUrl, supabaseKey);

async function readXml() {
    const { data, error } = await supabase
        .from('timetable_imports')
        .select('xml_content')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data && data.length > 0) {
        const xml = data[0].xml_content;
        console.log('--- XML Content (Snippet) ---');
        // Find classes section
        const classesStart = xml.indexOf('<classes');
        const classesEnd = xml.indexOf('</classes>');
        if (classesStart !== -1 && classesEnd !== -1) {
            console.log(xml.substring(classesStart, classesStart + 1000));
        } else {
            console.log(xml.substring(0, 1000));
        }
    }
}

readXml();
