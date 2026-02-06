'use server';

import { supabase } from '../../lib/supabase';

export async function getTeachers() {
    const school_id = '00000000-0000-0000-0000-000000000000';
    const { data, error } = await supabase
        .from('timetable_teachers')
        .select('id, name, short')
        .eq('school_id', school_id)
        .order('name');

    if (error) throw error;
    return data;
}

export async function getPeriods() {
    const school_id = '00000000-0000-0000-0000-000000000000';
    const { data, error } = await supabase
        .from('timetable_periods')
        .select('*')
        .eq('school_id', school_id)
        .order('period_index');

    if (error) throw error;
    return data;
}

export async function getTeacherTimetable(teacherId: string) {
    const school_id = '00000000-0000-0000-0000-000000000000';

    // 1. Get lessons for this teacher
    const { data: lessonTeachers, error: ltError } = await supabase
        .from('timetable_lesson_teachers')
        .select('lesson_id')
        .eq('teacher_id', teacherId);

    if (ltError) throw ltError;
    const lessonIds = lessonTeachers.map(lt => lt.lesson_id);

    if (lessonIds.length === 0) return [];

    // 2. Get cards for these lessons
    const { data: cards, error: cardsError } = await supabase
        .from('timetable_cards')
        .select(`
      period_index,
      days_mask,
      lesson_id,
      timetable_lessons (
        subject_id,
        timetable_subjects (name, short),
        timetable_lesson_classes (
          class_id,
          timetable_classes (name, short)
        )
      )
    `)
        .in('lesson_id', lessonIds)
        .eq('school_id', school_id);

    if (cardsError) throw cardsError;
    return cards;
}

export async function getTeacherDetails(teacherId: string) {
    const school_id = '00000000-0000-0000-0000-000000000000';

    // 1. Fetch teacher basic info
    const { data: teacher, error: tError } = await supabase
        .from('timetable_teachers')
        .select('*')
        .eq('id', teacherId)
        .single();

    if (tError) throw tError;

    // 2. Fetch all lessons and their relations
    const { data: lessons, error: lError } = await supabase
        .from('timetable_lessons')
        .select(`
            id,
            periods_per_week,
            timetable_subjects (name, short),
            timetable_lesson_teachers!inner (teacher_id),
            timetable_lesson_classes (
                timetable_classes (name, short)
            )
        `)
        .eq('timetable_lesson_teachers.teacher_id', teacherId);

    if (lError) throw lError;

    // 3. Aggregate data by Subject Name
    const subjectGroups: Record<string, any> = {};

    lessons.forEach((l: any) => {
        const subjectName = l.timetable_subjects.name;
        const currentHours = parseFloat(l.periods_per_week) || 0;
        const currentClasses = l.timetable_lesson_classes.map((lc: any) => lc.timetable_classes.name);

        if (!subjectGroups[subjectName]) {
            subjectGroups[subjectName] = {
                subject: subjectName,
                subjectShort: l.timetable_subjects.short,
                hours: 0,
                classesSet: new Set<string>()
            };
        }

        subjectGroups[subjectName].hours += currentHours;
        currentClasses.forEach((c: string) => subjectGroups[subjectName].classesSet.add(c));
    });

    const summary = Object.values(subjectGroups).map(group => ({
        subject: group.subject,
        subjectShort: group.subjectShort,
        hours: group.hours,
        classes: Array.from(group.classesSet as Set<string>).join(', ')
    }));

    const totalHours = summary.reduce((acc: number, curr: any) => acc + curr.hours, 0);

    return {
        teacher,
        lessons: summary,
        totalHours
    };
}

export async function getClasses() {
    const school_id = '00000000-0000-0000-0000-000000000000';
    const { data, error } = await supabase
        .from('timetable_classes')
        .select('id, name, short, teacher_id')
        .eq('school_id', school_id)
        .order('name');

    if (error) throw error;
    return data;
}

export async function getClassTimetable(classId: string) {
    const school_id = '00000000-0000-0000-0000-000000000000';

    // 1. Get lessons for this class
    const { data: lessonClasses, error: lcError } = await supabase
        .from('timetable_lesson_classes')
        .select('lesson_id')
        .eq('class_id', classId);

    if (lcError) throw lcError;
    const lessonIds = lessonClasses.map(lc => lc.lesson_id);

    if (lessonIds.length === 0) return [];

    // 2. Get cards for these lessons
    const { data: cards, error: cardsError } = await supabase
        .from('timetable_cards')
        .select(`
      period_index,
      days_mask,
      lesson_id,
      timetable_card_classrooms (
        timetable_classrooms (name, short)
      ),
      timetable_lessons (
        subject_id,
        timetable_subjects (name, short),
        timetable_lesson_teachers (
          teacher_id,
          timetable_teachers (name, short)
        )
      )
    `)
        .in('lesson_id', lessonIds)
        .eq('school_id', school_id);

    if (cardsError) throw cardsError;
    return cards;
}

export async function getClassDetails(classId: string) {
    const school_id = '00000000-0000-0000-0000-000000000000';

    // 1. Fetch class basic info and class teacher
    const { data: classInfo, error: cError } = await supabase
        .from('timetable_classes')
        .select(`
            *,
            timetable_teachers (name, short, email)
        `)
        .eq('id', classId)
        .single();

    if (cError) throw cError;

    // 2. Fetch all lessons for this class
    const { data: lessons, error: lError } = await supabase
        .from('timetable_lessons')
        .select(`
            id,
            periods_per_week,
            timetable_subjects (name, short),
            timetable_lesson_classes!inner (class_id),
            timetable_lesson_teachers (
                timetable_teachers (name, short)
            )
        `)
        .eq('timetable_lesson_classes.class_id', classId);

    if (lError) throw lError;

    // 3. Aggregate data by Subject Name
    const subjectGroups: Record<string, any> = {};

    lessons.forEach((l: any) => {
        const subjectName = l.timetable_subjects.name;
        const currentHours = parseFloat(l.periods_per_week) || 0;
        const currentTeachers = l.timetable_lesson_teachers.map((lt: any) => lt.timetable_teachers.name);

        if (!subjectGroups[subjectName]) {
            subjectGroups[subjectName] = {
                subject: subjectName,
                subjectShort: l.timetable_subjects.short,
                hours: 0,
                teachersSet: new Set<string>()
            };
        }

        subjectGroups[subjectName].hours += currentHours;
        currentTeachers.forEach((t: string) => subjectGroups[subjectName].teachersSet.add(t));
    });

    const summary = Object.values(subjectGroups).map(group => ({
        subject: group.subject,
        subjectShort: group.subjectShort,
        hours: group.hours,
        teachers: Array.from(group.teachersSet as Set<string>).join(', ')
    }));

    const totalHours = summary.reduce((acc: number, curr: any) => acc + curr.hours, 0);

    return {
        classInfo,
        lessons: summary,
        totalHours
    };
}
