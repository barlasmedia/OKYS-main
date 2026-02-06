'use server';

import { XMLParser } from 'fast-xml-parser';
import { supabase } from '../../lib/supabase';
import { revalidatePath } from 'next/cache';

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
});

export async function processXmlAction(formData: FormData) {
    const file = formData.get('xmlFile') as File;
    if (!file) return { success: false, error: 'Dosya bulunamadı.' };

    try {
        console.log('--- XML AKTARIMI BAŞLADI ---');

        // Handle encoding: aSc Timetables often uses windows-1254 for Turkish
        const buffer = await file.arrayBuffer();
        const utf8Decoder = new TextDecoder('utf-8');
        let tempText = utf8Decoder.decode(buffer);

        // If XML declares windows-1254, re-decode for Turkish characters
        if (tempText.includes('windows-1254')) {
            console.log('Windows-1254 kodlaması tespit edildi, yeniden decode ediliyor.');
            const trDecoder = new TextDecoder('windows-1254');
            tempText = trDecoder.decode(buffer);
        }
        let xmlText = tempText;

        const school_id = '00000000-0000-0000-0000-000000000000';

        // Helper to check Supabase errors
        const checkError = (result: any, message: string) => {
            if (result.error) {
                console.error(`DB Hatası (${message}):`, result.error);
                if (result.error.code === '42P01') {
                    throw new Error(`Veritabanı tablosu bulunamadı! Lütfen size verdiğim SQL komutlarını Supabase'de çalıştırdığınızdan emin olun. (Hata: ${message})`);
                }
                throw new Error(`${message}: ${result.error.message}`);
            }
            return result.data;
        };

        // Helper for consistent arrays
        const toArray = (obj: any, path: string) => {
            const parts = path.split('.');
            let current = obj;
            for (const part of parts) {
                if (!current) return [];
                current = current[part];
            }
            return Array.isArray(current) ? current : (current ? [current] : []);
        };

        // Robust sanitization: Remove malformed PI tags or everything before <timetable
        const timetableMatch = xmlText.indexOf('<timetable');
        if (timetableMatch !== -1) {
            xmlText = xmlText.substring(timetableMatch);
            console.log('XML başlığı temizlendi.');
        }

        // Save raw XML for archive/logging
        try {
            await supabase.from('timetable_imports').insert({
                school_id,
                file_name: file.name,
                xml_content: xmlText
            });
        } catch (e) {
            console.warn('Ham XML kaydedilemedi, işleme devam ediliyor...', e);
        }

        const jsonObj = parser.parse(xmlText);
        const timetable = jsonObj.timetable;

        if (!timetable) return { success: false, error: 'Geçersiz XML formatı veya boş dosya.' };

        // 0. COMPREHENSIVE CLEANUP (Ensure only the last upload is valid)
        console.log('0/8: Eski veriler tamamen temizleniyor...');

        // SOFT REFRESH STRATEGY:
        // We do NOT delete Teachers, Subjects, Classes, Classrooms, Buildings.
        // We ONLY delete the Schedule Structure (Lessons, Cards, Groups).
        // To prevent cascade delete of Substitutions (which link to Lessons), we first detach them.

        // Step A: Protect Substitutions (detach from lessons)
        await supabase
            .from('substitutions')
            .update({ lesson_id: null })
            .eq('school_id', school_id);
        console.log('Substitutions tablosu lesson_id bağlarından koparıldı (Soft Refresh).');

        // Step B: Delete Schedule Structure
        // Delete in order to satisfy FK constraints

        // timetable_imports is standalone, we can clear it or keep it (keeping logic same as before)
        await supabase.from('timetable_imports').delete().eq('school_id', school_id);

        // Cards and their junctions (junctions cascade)
        checkError(await supabase.from('timetable_cards').delete().eq('school_id', school_id), 'Cleanup Cards');

        // Lessons and their junctions (junctions cascade)
        checkError(await supabase.from('timetable_lessons').delete().eq('school_id', school_id), 'Cleanup Lessons');

        // Groups (relies on classes, but groups re-generated every time)
        checkError(await supabase.from('timetable_groups').delete().eq('school_id', school_id), 'Cleanup Groups');

        // DO NOT DELETE: Teachers, Subjects, Classes, Classrooms, Buildings (Dimensions)

        // Core Definitions (We delete these as they define the grid structure)
        checkError(await supabase.from('timetable_periods').delete().eq('school_id', school_id), 'Cleanup Periods');
        checkError(await supabase.from('timetable_days_defs').delete().eq('school_id', school_id), 'Cleanup Days');
        checkError(await supabase.from('timetable_weeks_defs').delete().eq('school_id', school_id), 'Cleanup Weeks');
        checkError(await supabase.from('timetable_terms_defs').delete().eq('school_id', school_id), 'Cleanup Terms');

        console.log('Temizlik tamamlandı, yeni veriler işleniyor...');

        // 1. Periods
        console.log('1/8: Periyotlar işleniyor...');
        const periods = toArray(timetable, 'periods.period').map((p: any) => ({
            school_id,
            period_index: parseInt(p.period),
            name: p.name,
            short: p.short,
            starttime: p.starttime,
            endtime: p.endtime,
        }));
        if (periods.length) checkError(await supabase.from('timetable_periods').upsert(periods, { onConflict: 'school_id,period_index' }), 'Periods Upsert');

        // 2. DaysDefs
        console.log('2/8: Gün tanımları işleniyor...');
        const daysdefs = toArray(timetable, 'daysdefs.daysdef').map((d: any) => ({
            id: d.id,
            school_id,
            days_mask: d.days,
            name: d.name,
            short: d.short,
        }));
        if (daysdefs.length) checkError(await supabase.from('timetable_days_defs').upsert(daysdefs), 'DaysDefs Upsert');

        // 2.1 WeeksDefs
        console.log('2.1/8: Hafta tanımları işleniyor...');
        const weeksdefs = toArray(timetable, 'weeksdefs.weeksdef').map((w: any) => ({
            id: w.id,
            school_id,
            weeks_mask: w.weeks,
            name: w.name,
            short: w.short,
        }));
        if (weeksdefs.length) checkError(await supabase.from('timetable_weeks_defs').upsert(weeksdefs), 'WeeksDefs Upsert');

        // 2.2 TermsDefs
        console.log('2.2/8: Dönem tanımları işleniyor...');
        const termsdefs = toArray(timetable, 'termsdefs.termsdef').map((t: any) => ({
            id: t.id,
            school_id,
            terms_mask: t.terms,
            name: t.name,
            short: t.short,
        }));
        if (termsdefs.length) checkError(await supabase.from('timetable_terms_defs').upsert(termsdefs), 'TermsDefs Upsert');

        // 3. Teachers
        console.log('3/8: Öğretmenler işleniyor...');

        // Fetch existing teachers to prevent duplicates by name mapping
        const { data: existingTeachers } = await supabase
            .from('timetable_teachers')
            .select('id, name')
            .eq('school_id', school_id);

        const nameToDbId = new Map<string, string>();
        existingTeachers?.forEach(t => {
            if (t.name) nameToDbId.set(t.name.trim().toUpperCase(), t.id);
        });

        const xmlIdToDbId = new Map<string, string>();
        const teachersToUpsert: any[] = [];

        toArray(timetable, 'teachers.teacher').forEach((t: any) => {
            const xmlName = t.name?.trim().toUpperCase();
            let dbId = t.id; // Default to XML ID

            if (xmlName && nameToDbId.has(xmlName)) {
                dbId = nameToDbId.get(xmlName)!;
                console.log(`Eşleşme bulundu: ${t.name} (XML ID: ${t.id} -> DB ID: ${dbId})`);
            }

            xmlIdToDbId.set(t.id, dbId);

            teachersToUpsert.push({
                id: dbId,
                school_id,
                name: t.name,
                firstname: t.firstname,
                lastname: t.lastname,
                short: t.short,
                gender: t.gender,
                color: t.color,
                email: t.email,
                mobile: t.mobile,
            });
        });

        if (teachersToUpsert.length) {
            checkError(await supabase.from('timetable_teachers').upsert(teachersToUpsert), 'Teachers Upsert');
        }

        // 3.1 Buildings
        console.log('3.1/8: Binalar işleniyor...');
        const buildings = toArray(timetable, 'buildings.building').map((b: any) => ({
            id: b.id,
            school_id,
            name: b.name,
        }));
        if (buildings.length) checkError(await supabase.from('timetable_buildings').upsert(buildings), 'Buildings Upsert');

        // 3.2 Classrooms
        console.log('3.2/8: Derslikler işleniyor...');
        const classrooms = toArray(timetable, 'classrooms.classroom').map((c: any) => ({
            id: c.id,
            school_id,
            name: c.name,
            short: c.short,
            capacity: c.capacity === '*' ? null : parseInt(c.capacity),
            building_id: c.buildingid || null,
        }));
        if (classrooms.length) checkError(await supabase.from('timetable_classrooms').upsert(classrooms), 'Classrooms Upsert');

        // 4. Subjects
        console.log('4/8: Ders tanımları işleniyor...');
        const subjects = toArray(timetable, 'subjects.subject').map((s: any) => ({
            id: s.id,
            school_id,
            name: s.name,
            short: s.short,
        }));
        if (subjects.length) checkError(await supabase.from('timetable_subjects').upsert(subjects), 'Subjects Upsert');

        // 5. Classes
        console.log('5/8: Sınıflar işleniyor...');
        const classes = toArray(timetable, 'classes.class').map((c: any) => ({
            id: c.id,
            school_id,
            name: c.name,
            short: c.short,
            teacher_id: c.teacherid ? (xmlIdToDbId.get(c.teacherid) || c.teacherid) : null,
            grade_index: c.grade ? parseInt(c.grade) : null,
        }));
        if (classes.length) checkError(await supabase.from('timetable_classes').upsert(classes), 'Classes Upsert');

        // 6. Groups
        console.log('6/8: Gruplar işleniyor...');
        const groups = toArray(timetable, 'groups.group').map((g: any) => ({
            id: g.id,
            school_id,
            class_id: g.classid,
            name: g.name,
            entire_class: g.entireclass === '1',
            division_tag: g.divisiontag ? parseInt(g.divisiontag) : null,
        }));
        if (groups.length) checkError(await supabase.from('timetable_groups').upsert(groups), 'Groups Upsert');

        // 7. Lessons and Junctions
        console.log('7/8: Ders kuralları işleniyor...');
        const lessons = toArray(timetable, 'lessons.lesson');
        const lessonIdsSet = new Set(lessons.map((l: any) => l.id));

        const lessonData = lessons.map((l: any) => ({
            id: l.id,
            school_id,
            subject_id: l.subjectid,
            periods_per_card: l.periodspercard ? parseInt(l.periodspercard) : 1,
            periods_per_week: l.periodsperweek ? parseFloat(l.periodsperweek) : 0,
            days_def_id: l.daysdefid,
            weeks_def_id: l.weeksdefid,
            terms_def_id: l.termsdefid,
        }));
        if (lessonData.length) checkError(await supabase.from('timetable_lessons').upsert(lessonData), 'Lessons Upsert');

        console.log('7.5/8: Ders eşleşmeleri (öğretmen/sınıf/grup) işleniyor...');
        const lessonTeachers: any[] = [];
        const lessonClasses: any[] = [];
        const lessonGroups: any[] = [];

        lessons.forEach((l: any) => {
            if (l.teacherids) l.teacherids.split(',').forEach((tId: string) => {
                const cleanId = tId.trim();
                if (cleanId) {
                    const resolvedId = xmlIdToDbId.get(cleanId) || cleanId;
                    lessonTeachers.push({ lesson_id: l.id, teacher_id: resolvedId });
                }
            });
            if (l.classids) l.classids.split(',').forEach((cId: string) => {
                const cleanId = cId.trim();
                if (cleanId) lessonClasses.push({ lesson_id: l.id, class_id: cleanId });
            });
            if (l.groupids) l.groupids.split(',').forEach((gId: string) => {
                const cleanId = gId.trim();
                if (cleanId) lessonGroups.push({ lesson_id: l.id, group_id: cleanId });
            });
        });

        if (lessonTeachers.length) checkError(await supabase.from('timetable_lesson_teachers').upsert(lessonTeachers), 'Lesson Teachers Upsert');
        if (lessonClasses.length) checkError(await supabase.from('timetable_lesson_classes').upsert(lessonClasses), 'Lesson Classes Upsert');
        if (lessonGroups.length) checkError(await supabase.from('timetable_lesson_groups').upsert(lessonGroups), 'Lesson Groups Upsert');

        // 8. Cards and Classroom Junctions
        console.log('8/8: Program kartları işleniyor...');
        const cardsRaw = toArray(timetable, 'cards.card');

        // Filter strictly by what we actually inserted to lessonData
        const validCardsRaw = cardsRaw.filter((c: any) => lessonIdsSet.has(c.lessonid));

        if (validCardsRaw.length < cardsRaw.length) {
            console.warn(`${cardsRaw.length - validCardsRaw.length} adet kart bulunamayan ders ID'si nedeniyle atlandı.`);
        }

        const cardData = validCardsRaw.map((card: any) => ({
            school_id,
            lesson_id: card.lessonid,
            period_index: parseInt(card.period),
            days_mask: card.days,
            weeks_mask: card.weeks,
            terms_mask: card.terms,
        }));

        if (cardData.length > 0) {
            const insertedCards = checkError(await supabase
                .from('timetable_cards')
                .insert(cardData)
                .select('id, lesson_id, period_index, days_mask'), 'Cards Insert');

            if (insertedCards && insertedCards.length > 0) {
                // Use a Map for O(1) matching of classroom junctions
                const cardLookup = new Map();
                insertedCards.forEach((ic: any) => {
                    // Normalize period_index as number since we'll parseInt later
                    const key = `${ic.lesson_id}-${ic.period_index}-${ic.days_mask}`;
                    cardLookup.set(key, ic.id);
                });

                const cardClassrooms: any[] = [];
                validCardsRaw.forEach((rawCard: any) => {
                    if (rawCard.classroomids) {
                        const key = `${rawCard.lessonid}-${parseInt(rawCard.period)}-${rawCard.days}`;
                        const cardUuid = cardLookup.get(key);
                        if (cardUuid) {
                            rawCard.classroomids.split(',').forEach((crId: string) => {
                                const cleanId = crId.trim();
                                if (cleanId) cardClassrooms.push({ card_id: cardUuid, classroom_id: cleanId });
                            });
                        }
                    }
                });

                if (cardClassrooms.length) {
                    checkError(await supabase.from('timetable_card_classrooms').upsert(cardClassrooms), 'Card Classrooms Upsert');
                }
            }
        }

        // Check for missing teacher info to alert the user
        const { data: missingInfoTeachers } = await supabase
            .from('timetable_teachers')
            .select('id')
            .eq('school_id', school_id)
            .or('branch.is.null,grades.is.null');

        const hasMissingInfo = (missingInfoTeachers?.length || 0) > 0;
        const warningSuffix = hasMissingInfo
            ? `\n\n⚠️ DİKKAT: Bazı öğretmenlerin branş veya kademe bilgileri eksik. Lütfen Öğretmen Yönetimi sayfasından güncelleyiniz.`
            : '';

        // Invalidate caches
        revalidatePath('/');
        revalidatePath('/ogretmenler');
        revalidatePath('/teachers');

        console.log(`--- AKTARIM BAŞARIYLA TAMAMLANDI: ${validCardsRaw.length} kart işlendi ---`);
        return {
            success: true,
            message: `Veriler başarıyla aktarıldı. (${validCardsRaw.length} ders saati)${warningSuffix}`
        };
    } catch (error: any) {
        console.error('AKTARIM HATASI KRİTİK:', error);
        return { success: false, error: 'Kritik Hata: ' + error.message };
    }
}
