"use server"

import { supabase } from "../../lib/supabase"
import { Teacher, ScheduleSlot, SubstituteCandidate } from "../../lib/types"

// Helper to get day index (0-4 for Mon-Fri)
function getDayIndex(date: Date): number {
    const day = date.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
    if (day === 0 || day === 6) return -1 // Weekend
    return day - 1
}

function matchesDay(cardDays: string, dayIndex: number): boolean {
    if (dayIndex < 0 || dayIndex >= cardDays.length) return false
    return cardDays[dayIndex] === '1'
}

const SCHOOL_ID = '00000000-0000-0000-0000-000000000000';

export async function getTeachers(): Promise<Teacher[]> {
    const { data, error } = await supabase
        .from('timetable_teachers')
        .select('id, name, short, branch, grades')
        .eq('school_id', SCHOOL_ID)
        .order('name')

    if (error) throw new Error(error.message)
    return data || []
}

export async function getTeacherSchedule(teacherId: string, date: Date): Promise<ScheduleSlot[]> {
    const dayIndex = getDayIndex(date)
    if (dayIndex === -1) return [] // Weekend

    // 1. Get lessons for this teacher using junction table
    const { data: lessonTeachers, error: ltError } = await supabase
        .from('timetable_lesson_teachers')
        .select('lesson_id')
        .eq('teacher_id', teacherId);

    if (ltError) throw new Error(ltError.message);
    const lessonIds = lessonTeachers?.map(lt => lt.lesson_id) || [];

    if (lessonIds.length === 0) return [];

    // 2. Get cards for these lessons with nested relations
    const { data: cards, error: cardsError } = await supabase
        .from('timetable_cards')
        .select(`
            id,
            period_index,
            days_mask,
            lesson_id,
            timetable_lessons (
                id,
                subject_id,
                timetable_subjects (name, short),
                timetable_lesson_classes (
                    class_id,
                    timetable_classes (id, name, short)
                ),
                timetable_lesson_teachers (
                    teacher_id
                )
            )
        `)
        .in('lesson_id', lessonIds)
        .eq('school_id', SCHOOL_ID);

    if (cardsError) throw new Error(cardsError.message);

    // Filter by day and shape data
    const slots: ScheduleSlot[] = (cards || [])
        .filter((card: any) => matchesDay(card.days_mask, dayIndex))
        .map((card: any) => {
            const lesson = card.timetable_lessons;
            if (!lesson) return null;

            const subject = lesson.timetable_subjects;
            const classes = lesson.timetable_lesson_classes || [];
            const classIds = classes.map((lc: any) => lc.class_id);
            const classNames = classes.map((lc: any) => lc.timetable_classes?.name).filter(Boolean).join(', ');
            const teacherIds = (lesson.timetable_lesson_teachers || []).map((lt: any) => lt.teacher_id);

            return {
                period: card.period_index,
                lessonId: lesson.id,
                subjectName: subject?.name || 'Unknown',
                className: classNames || 'Unknown',
                classIds: classIds,
                card: {
                    lessonid: card.lesson_id,
                    classroomids: '',
                    period: card.period_index.toString(),
                    days: card.days_mask,
                    weeks: '',
                    terms: ''
                },
                teacherIds: teacherIds
            };
        })
        .filter(Boolean) as ScheduleSlot[];

    return slots.sort((a, b) => a.period - b.period);
}

export async function findSubstitutes(period: number, date: Date, targetClassIds: string[]): Promise<SubstituteCandidate[]> {
    const dayIndex = getDayIndex(date)
    if (dayIndex === -1) return []

    // 1. Fetch All Active Teachers
    const { data: allTeachers, error: tError } = await supabase
        .from('timetable_teachers')
        .select('id, name, short, branch, grades')
        .eq('school_id', SCHOOL_ID);

    if (tError) throw tError

    // 2. Identify BUSY Teachers (Have a card at this period on this day)
    // Get all cards at this period
    const { data: busyCardsRaw } = await supabase
        .from('timetable_cards')
        .select(`
            days_mask,
            lesson_id,
            timetable_lessons (
                timetable_lesson_teachers (teacher_id)
            )
        `)
        .eq('period_index', period)
        .eq('school_id', SCHOOL_ID);

    // Filter by day and collect busy teacher IDs
    const busyTeacherIds = new Set<string>();
    (busyCardsRaw || [])
        .filter((c: any) => matchesDay(c.days_mask, dayIndex))
        .forEach((c: any) => {
            const teachers = c.timetable_lessons?.timetable_lesson_teachers || [];
            teachers.forEach((lt: any) => busyTeacherIds.add(lt.teacher_id));
        });

    // 3. Identify FAMILIAR Teachers (Teach the target classes)
    // Get all lessons that involve any of the target classes
    const { data: classLessons } = await supabase
        .from('timetable_lesson_classes')
        .select(`
            lesson_id,
            timetable_lessons (
                timetable_lesson_teachers (teacher_id)
            )
        `)
        .in('class_id', targetClassIds);

    const familiarTeacherIds = new Set<string>();
    (classLessons || []).forEach((cl: any) => {
        const teachers = cl.timetable_lessons?.timetable_lesson_teachers || [];
        teachers.forEach((lt: any) => familiarTeacherIds.add(lt.teacher_id));
    });

    const isGuidanceBranch = (branch: string | null | undefined) => {
        if (!branch) return false;
        const b = branch.toUpperCase().trim();
        return b.includes('REHBER') || b.includes('DANIŞMAN');
    };

    // 4. Calculate Load for Available Teachers
    const availableTeachers = (allTeachers || []).filter(t =>
        !busyTeacherIds.has(t.id) || isGuidanceBranch(t.branch)
    );

    // Fetch all cards for this day to count load
    const { data: loadCardsRaw } = await supabase
        .from('timetable_cards')
        .select(`
            days_mask,
            lesson_id,
            timetable_lessons (
                timetable_lesson_teachers (teacher_id)
            )
        `)
        .eq('school_id', SCHOOL_ID);

    // Filter by day and build load map
    const teacherLoadMap = new Map<string, number>();
    (loadCardsRaw || [])
        .filter((c: any) => matchesDay(c.days_mask, dayIndex))
        .forEach((c: any) => {
            const teachers = c.timetable_lessons?.timetable_lesson_teachers || [];
            teachers.forEach((lt: any) => {
                const current = teacherLoadMap.get(lt.teacher_id) || 0;
                teacherLoadMap.set(lt.teacher_id, current + 1);
            });
        });

    const candidates: SubstituteCandidate[] = availableTeachers
        .map(teacher => {
            return {
                teacher: {
                    id: teacher.id,
                    name: teacher.name,
                    short: teacher.short,
                    branch: teacher.branch,
                    grades: teacher.grades
                },
                isClassTeacher: familiarTeacherIds.has(teacher.id),
                dailyLoad: teacherLoadMap.get(teacher.id) || 0
            }
        })
        .filter(candidate => {
            const isGuidance = isGuidanceBranch(candidate.teacher.branch);
            const hasLoad = candidate.dailyLoad > 0;
            return hasLoad || isGuidance;
        });

    // Debug logging
    const guidanceCandidates = candidates.filter(c => isGuidanceBranch(c.teacher.branch));
    console.log(`[DEBUG] Period ${period} - Substitutes found: ${candidates.length} (Guidance: ${guidanceCandidates.length})`);
    if (guidanceCandidates.length > 0) {
        console.log(`[DEBUG] Guidance teachers included: ${guidanceCandidates.map(g => g.teacher.name).join(', ')}`);
    }

    // 5. Sort: Priority 1 = Familiarity (Desc), Priority 2 = Load (Asc)
    return candidates.sort((a, b) => {
        if (a.isClassTeacher !== b.isClassTeacher) {
            return a.isClassTeacher ? -1 : 1
        }
        return a.dailyLoad - b.dailyLoad
    })
}
