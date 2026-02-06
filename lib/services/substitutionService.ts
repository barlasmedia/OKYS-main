import { supabase } from "../supabase";

export interface SubstituteCandidate {
    teacher_id: string;
    name: string;
    score: number;
    reasons: string[];
    daily_load: number;
    assignments_today: number;
    total_assignments: number;
    is_guidance: boolean;
    is_super_match: boolean;
}

export const substitutionService = {
    // 1. Get Teacher Schedule for a specific date
    async getTeacherSchedule(schoolId: string, teacherId: string, date: Date) {
        // Use getUTCDay because normalizeDate(dateStr) creates a UTC date
        const dayIndex = (date.getUTCDay() + 6) % 7;

        const [cardsRes, periodsRes] = await Promise.all([
            supabase
                .from('timetable_cards')
                .select(`
                    *,
                    lesson:timetable_lessons!inner(
                        id,
                        subject:timetable_subjects(name),
                        classes:timetable_lesson_classes(
                            class:timetable_classes(name)
                        ),
                        teachers:timetable_lesson_teachers!inner(teacher_id)
                    ),
                    classroom:timetable_card_classrooms(
                        room:timetable_classrooms(name)
                    )
                `)
                .eq('school_id', schoolId)
                .eq('lesson.teachers.teacher_id', teacherId),
            supabase
                .from('timetable_periods')
                .select('period_index, name, short, starttime, endtime')
                .eq('school_id', schoolId)
        ]);

        if (cardsRes.error) throw cardsRes.error;
        if (periodsRes.error) throw periodsRes.error;

        const periodsMap = new Map();
        periodsRes.data?.forEach(p => periodsMap.set(p.period_index, p));

        return (cardsRes.data || [])
            .filter(card => {
                const mask = card.days_mask;
                return mask && mask[dayIndex] === '1';
            })
            .map(card => ({
                ...card,
                period: periodsMap.get(card.period_index)
            }));
    },

    // 1.5 Get Existing Substitutions for a teacher/date
    async getSubstitutionsForDate(schoolId: string, teacherId: string, date: Date) {
        const dateStr = date.toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('substitutions')
            .select('*')
            .eq('school_id', schoolId)
            .eq('original_teacher_id', teacherId)
            .eq('date', dateStr);

        if (error) throw error;
        return data;
    },
    async getAvailableTeachers(
        schoolId: string,
        date: Date,
        periodIndex: number,
        missingLessonId: string
    ): Promise<SubstituteCandidate[]> {
        // Critical Fix: Use getUTCDay() for YYYY-MM-DD standard parsing
        const dayIndex = (date.getUTCDay() + 6) % 7;
        const dateStr = date.toISOString().split('T')[0];

        // A. Get Missing Lesson Details
        const { data: lessonData } = await supabase
            .from('timetable_lessons')
            .select(`
                subject_id,
                classes:timetable_lesson_classes(
                    class:timetable_classes(id, name, grade_index)
                )
            `)
            .eq('id', missingLessonId)
            .single();

        if (!lessonData) throw new Error("Lesson not found");

        const subjectId = lessonData.subject_id;
        const classIds = lessonData.classes.map((c: any) => {
            const cls = c.class;
            return Array.isArray(cls) ? cls[0]?.id : cls?.id;
        }).filter(Boolean);

        const getTagForGrade = (idx: number | null, name?: string | null) => {
            // 1. First try with grade_index
            if (idx !== null && idx !== undefined) {
                if (idx >= 9 && idx <= 12) return 'LİSE';
                if (idx >= 5 && idx <= 8) return 'ORTAOKUL';
                if (idx >= 1 && idx <= 4) return 'İLKOKUL';
                if (idx === 0) return 'ANAOKULU';
            }

            // 2. Infer from class name if index is missing
            if (name) {
                const upperName = name.toUpperCase();
                if (upperName.includes('YAŞ') || upperName.includes('ANA') || upperName.includes('KREŞ')) return 'ANAOKULU';
                if (upperName.includes('LİSE') || /^(9|10|11|12)/.test(upperName)) return 'LİSE';
                if (upperName.includes('ORTA') || /^(5|6|7|8)/.test(upperName)) return 'ORTAOKUL';
                if (upperName.includes('İLK') || /^(1|2|3|4)/.test(upperName)) return 'İLKOKUL';
            }

            return null;
        };

        const kademeTags = lessonData.classes.map((c: any) => {
            const cls = c.class;
            const singleCls = Array.isArray(cls) ? cls[0] : cls;
            return getTagForGrade(singleCls?.grade_index, singleCls?.name);
        }).filter(Boolean) as string[];

        // B. Get ALL Teachers
        const { data: allTeachers } = await supabase
            .from('timetable_teachers')
            .select('id, name, branch, grades')
            .eq('school_id', schoolId);

        if (!allTeachers) return [];

        // C. Get BUSY Teachers (Teaching at this period/day)
        const maskFilter = '_'.repeat(dayIndex) + '1%';
        const { data: busyCards } = await supabase
            .from('timetable_cards')
            .select(`
                lesson:timetable_lessons!inner(
                    teachers:timetable_lesson_teachers!inner(teacher_id)
                )
            `)
            .eq('school_id', schoolId)
            .eq('period_index', periodIndex)
            .ilike('days_mask', maskFilter)
            .limit(1000);

        const busyTeacherIds = new Set<string>();
        busyCards?.forEach(card => {
            const teachers = (card.lesson as any)?.teachers;
            const tids = Array.isArray(teachers) ? teachers : [teachers];
            tids.forEach((t: any) => busyTeacherIds.add(t.teacher_id));
        });

        // D. Get ALREADY SUBSTITUTED Teachers (as substitutes)
        const { data: subRecords } = await supabase
            .from('substitutions')
            .select('substitute_teacher_id')
            .eq('school_id', schoolId)
            .eq('date', dateStr)
            .eq('period_index', periodIndex)
            .not('substitute_teacher_id', 'is', null)
            .neq('status', 'cancelled');

        subRecords?.forEach(s => busyTeacherIds.add(s.substitute_teacher_id));

        // D.2 Fetch Stats (Load & TODAY'S Assignments & LIFETIME Assignments)
        const [totalPeriodsRes, todayCardsRes, todayAssignmentsRes, allAssignmentsRes] = await Promise.all([
            supabase.from('timetable_periods').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
            // Daily Cards (for daily_load)
            supabase.from('timetable_cards')
                .select('lesson:timetable_lessons!inner(teachers:timetable_lesson_teachers!inner(teacher_id))')
                .eq('school_id', schoolId)
                .ilike('days_mask', maskFilter)
                .limit(5000),
            // Today's assignments
            supabase.from('substitutions')
                .select('substitute_teacher_id')
                .eq('school_id', schoolId)
                .eq('date', dateStr)
                .not('substitute_teacher_id', 'is', null)
                .neq('status', 'cancelled'),
            // LIFETIME assignments for fairness sorting
            supabase.from('substitutions')
                .select('substitute_teacher_id')
                .eq('school_id', schoolId)
                .not('substitute_teacher_id', 'is', null)
                .neq('status', 'cancelled')
                .limit(10000)
        ]);

        const totalPeriods = totalPeriodsRes.count || 8;
        const todayCards = todayCardsRes.data;
        const todayAssignmentsData = todayAssignmentsRes.data;
        const allAssignmentsData = allAssignmentsRes.data;

        const loadMap = new Map<string, number>();
        todayCards?.forEach(card => {
            const teachers = (card.lesson as any)?.teachers;
            const tids = Array.isArray(teachers) ? teachers : [teachers];
            tids.forEach((t: any) => {
                const tid = t.teacher_id;
                loadMap.set(tid, (loadMap.get(tid) || 0) + 1);
            });
        });

        const todayAssignmentMap = new Map<string, number>();
        todayAssignmentsData?.forEach(a => {
            todayAssignmentMap.set(a.substitute_teacher_id, (todayAssignmentMap.get(a.substitute_teacher_id) || 0) + 1);
        });

        const lifetimeAssignmentMap = new Map<string, number>();
        allAssignmentsData?.forEach(a => {
            lifetimeAssignmentMap.set(a.substitute_teacher_id, (lifetimeAssignmentMap.get(a.substitute_teacher_id) || 0) + 1);
        });

        const isGuidanceBranch = (branch: string | null | undefined) => {
            if (!branch) return false;
            return /REHBER|DANIŞMAN|PDR/i.test(branch);
        };

        // E. Filter Available Teachers & Apply Capacity Limit
        const availableTeachers = (allTeachers || []).filter(t => {
            const isGuidance = isGuidanceBranch(t.branch);

            // Critical Rule: Guidance teachers MUST match the grade level (kademe)
            if (isGuidance) {
                const teacherGrades = t.grades || [];
                const matchesAnyGrade = kademeTags.some(tag => teacherGrades.includes(tag));

                // If guidance teacher doesn't work in this school level, don't even suggest
                if (!matchesAnyGrade) return false;
            }

            if (busyTeacherIds.has(t.id) && !isGuidance) return false;

            const load = loadMap.get(t.id) || 0;
            const subsToday = todayAssignmentMap.get(t.id) || 0;

            // Rule 1: Ogün dersi olmayan öğretmenler listelenmeyecek (Rehberler hariç, çünkü zaten yukarıda kademe kontrolü yapıldı)
            if (load === 0 && !isGuidance) return false;

            // Rule 6: Okulun günlük ders saat sayısını geçemez
            return (load + subsToday) < (totalPeriods as number);
        });

        // F. Fetch Metadata for Scoring
        const { data: teacherMeta } = await supabase
            .from('timetable_lessons')
            .select(`
            subject_id,
            teachers:timetable_lesson_teachers(teacher_id),
            classes:timetable_lesson_classes(
                class:timetable_classes(id, grade_index)
            )
        `)
            .eq('school_id', schoolId);

        const teacherProfile = new Map<string, { subjects: Set<string>, classes: Set<string>, grades: Set<number> }>();
        teacherMeta?.forEach(l => {
            l.teachers.forEach((t: any) => {
                const tid = t.teacher_id;
                if (!teacherProfile.has(tid)) {
                    teacherProfile.set(tid, { subjects: new Set(), classes: new Set(), grades: new Set() });
                }
                const profile = teacherProfile.get(tid)!;
                profile.subjects.add(l.subject_id);
                l.classes.forEach((c: any) => {
                    profile.classes.add(c.class.id);
                    if (c.class.grade_index !== null) profile.grades.add(c.class.grade_index);
                });
            });
        });

        // G. Calculate Scores
        const candidates: SubstituteCandidate[] = availableTeachers.map(t => {
            let score = 0;
            const reasons: string[] = [];
            const profile = teacherProfile.get(t.id);

            const isGuidance = isGuidanceBranch(t.branch);
            let matchesGrade = false;

            if (isGuidance) {
                const teacherGrades = t.grades || [];
                matchesGrade = kademeTags.some(tag => teacherGrades.includes(tag));
            } else if (profile) {
                // For non-guidance teachers, we stick to numeric matching if profile is available
                // We use tag-based matching as a fallback/alternative if grade_index is null
                matchesGrade = kademeTags.length > 0 && Array.from(profile.grades).some(g => {
                    const lessonTag = getTagForGrade(g, null);
                    return lessonTag && kademeTags.includes(lessonTag);
                });
            }

            const hasSameSubject = profile?.subjects.has(subjectId) || false;
            const hasSameClass = classIds.some(cid => profile?.classes.has(cid)) || false;

            // Rule 2: Aynı Branş (Weight: 100,000)
            if (hasSameSubject) {
                score += 100000;
                reasons.push("Aynı Branş");
            }

            // Rule 3: Aynı Kademe (Weight: 10,000)
            if (matchesGrade) {
                score += 10000;
                reasons.push("Aynı Kademe");
            }

            // Rule 4: Aynı Sınıf (Weight: 1,000)
            if (hasSameClass) {
                score += 1000;
                reasons.push("Aynı Sınıf");
            }

            if (score === 0) {
                if (isGuidance) {
                    reasons.push("Rehberlik / Müsait");
                } else {
                    reasons.push(profile ? "Müsait" : "Müsait (Ders kaydı yok)");
                }
            }

            if (isGuidance) {
                score += 500000; // Boost to top
            }

            return {
                teacher_id: t.id,
                name: t.name,
                score,
                reasons,
                daily_load: loadMap.get(t.id) || 0,
                assignments_today: todayAssignmentMap.get(t.id) || 0,
                total_assignments: lifetimeAssignmentMap.get(t.id) || 0,
                is_guidance: isGuidance,
                is_super_match: hasSameSubject && hasSameClass
            };
        });

        // Rule 5, 6 & Historical Fairness Sorting:
        // 1. Score DESC (Criteria match)
        // 2. Daily Total Activity ASC (Load + Today's Assignments)
        // 3. Lifetime Total Assignments ASC (Ultimate tie-breaker for fairness)
        return candidates.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;

            const totalA = a.daily_load + a.assignments_today;
            const totalB = b.daily_load + b.assignments_today;
            if (totalA !== totalB) return totalA - totalB;

            return a.total_assignments - b.total_assignments;
        });
    }
};
