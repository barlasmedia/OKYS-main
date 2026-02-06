
import fs from 'fs';
import path from 'path';

// Load env vars from .env.local
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/"/g, ''); // Remove quotes if any
        }
    });
    console.log('Environment variables loaded from .env.local');
} catch (e) {
    console.error('Could not load .env.local', e);
}

import { supabase } from '../lib/supabase';

async function debugClassData() {
    const school_id = '00000000-0000-0000-0000-000000000000';
    console.log('--- DEBUGGING CLASS DATA ---');

    // 1. Check Classes
    const { data: classes, error: cError } = await supabase
        .from('timetable_classes')
        .select('id, name')
        .eq('school_id', school_id);

    if (cError) console.error('Classes Error:', cError);
    console.log(`Found ${classes?.length || 0} classes.`);
    if (classes && classes.length > 0) {
        console.log('First 3 classes:', classes.slice(0, 3));

        // Pick the first class to drill down
        const testClass = classes[0];
        console.log(`\nDrilling down for Class: ${testClass.name} (${testClass.id})`);

        // 2. Check Lesson Junctions
        const { data: lessonClasses, error: lcError } = await supabase
            .from('timetable_lesson_classes')
            .select('lesson_id')
            .eq('class_id', testClass.id);

        if (lcError) console.error('LessonClasses Error:', lcError);
        console.log(`Found ${lessonClasses?.length || 0} lessons linked to this class.`);

        if (lessonClasses && lessonClasses.length > 0) {
            const lessonId = lessonClasses[0].lesson_id;
            console.log(`Testing Lesson ID: ${lessonId}`);

            // 3. Check Cards for this Lesson
            const { data: cards, error: cardsError } = await supabase
                .from('timetable_cards')
                .select('*')
                .eq('lesson_id', lessonId);

            if (cardsError) console.error('Cards Error:', cardsError);
            console.log(`Found ${cards?.length || 0} cards for this lesson.`);
            if (cards?.length) console.log('Sample Card:', cards[0]);
        }
    }
}

debugClassData();
