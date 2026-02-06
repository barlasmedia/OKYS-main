'use server';

import { substitutionService, SubstituteCandidate } from '../../lib/services/substitutionService';
import { supabase } from '../../lib/supabase';
import { revalidatePath } from 'next/cache';

// Helper to ensure dates are handled consistently
function normalizeDate(dateStr: string) {
    return new Date(dateStr);
}

export async function getTeacherSchedule(schoolId: string, teacherId: string, dateStr: string) {
    try {
        const date = normalizeDate(dateStr);
        const schedule = await substitutionService.getTeacherSchedule(schoolId, teacherId, date);
        const substitutions = await substitutionService.getSubstitutionsForDate(schoolId, teacherId, date);
        return { success: true, data: { schedule, substitutions } };
    } catch (error) {
        console.error('Error fetching schedule:', error);
        return { success: false, error: 'Failed to fetch schedule' };
    }
}

export async function getAvailableTeachers(
    schoolId: string,
    dateStr: string,
    periodIndex: number,
    missingLessonId: string
) {
    try {
        const date = normalizeDate(dateStr);
        const result = await substitutionService.getAvailableTeachers(schoolId, date, periodIndex, missingLessonId);
        return { success: true, data: result };
    } catch (error) {
        console.error('Error fetching substitutes:', error);
        return { success: false, error: 'Failed to fetch substitutes' };
    }
}

export async function createSubstitution(
    schoolId: string,
    originalTeacherId: string,
    originalTeacherName: string,
    substituteTeacherId: string,
    substituteTeacherName: string,
    lessonId: string,
    subjectName: string,
    classNames: string,
    periodName: string,
    dateStr: string,
    periodIndex: number,
    reason: string
) {
    try {
        // 1. Get current substitution fee
        const { data: settings } = await supabase
            .from('payroll_settings')
            .select('substitution_fee')
            .eq('school_id', schoolId)
            .single();

        const fee = settings?.substitution_fee || 0;

        const { error } = await supabase
            .from('substitutions')
            .insert({
                school_id: schoolId,
                original_teacher_id: originalTeacherId,
                original_teacher_name: originalTeacherName,
                substitute_teacher_id: substituteTeacherId,
                substitute_teacher_name: substituteTeacherName,
                lesson_id: lessonId,
                subject_name: subjectName,
                class_names: classNames,
                period_name: periodName,
                date: dateStr,
                period_index: periodIndex,
                reason,
                status: 'approved',
                amount: fee // Store historical fee
            });

        if (error) throw error;
        revalidatePath('/gorevlendirme/rapor');
        return { success: true };
    } catch (error: any) {
        console.error('Error creating substitution:', error);
        if (error.code === '23505' || error.message?.includes('unique constraint')) {
            return { success: false, error: 'Bu ders saati için zaten bir görevlendirme kaydı mevcut.' };
        }
        return { success: false, error: error.message || 'Failed to create substitution', details: error };
    }
}

export async function deleteSubstitution(substitutionId: string) {
    try {
        const { error } = await supabase
            .from('substitutions')
            .delete()
            .eq('id', substitutionId);

        if (error) throw error;

        revalidatePath('/gorevlendirme/rapor');
        revalidatePath('/gorevlendirme');

        return { success: true };
    } catch (error: any) {
        console.error('Error deleting substitution:', error);
        return { success: false, error: error.message || 'Failed to delete substitution' };
    }
}
