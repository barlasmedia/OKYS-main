
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qhizbconwmmavpgajtsu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoaXpiY29ud21tYXZwZ2FqdHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODYzODQsImV4cCI6MjA4NDc2MjM4NH0.GZMbuqbybNgHoBFcLivL31dwCIwDx-CcAdKhb3woa9k';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubstitutions() {
    const duplicateIds = [
        "1F44BDF879FCCED2", "CEC908928B3A2B8C", // ATAM NESLİHAN
        "CFB3FFF0EAF11185", "1DC48D01E5E957EC"  // KESKİN KÜBRA
    ];

    for (const id of duplicateIds) {
        const { count, error } = await supabase
            .from('substitutions')
            .select('*', { count: 'exact', head: true })
            .or(`original_teacher_id.eq.${id},substitute_teacher_id.eq.${id}`);

        if (error) {
            console.error(`Error for ${id}:`, error);
        } else {
            console.log(`ID ${id} has ${count} substitutions.`);
        }
    }
}

checkSubstitutions();
