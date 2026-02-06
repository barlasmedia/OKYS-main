'use server';

import { supabase } from '../../lib/supabase';
import { revalidatePath } from 'next/cache';

export async function createExtraTask(
    schoolId: string,
    teacherId: string,
    teacherName: string,
    taskType: string,
    date: string
) {
    try {
        // 1. Get current fees
        const { data: settings } = await supabase
            .from('payroll_settings')
            .select('*')
            .eq('school_id', schoolId)
            .single();

        // Determine amount based on task type
        let amount = 0;
        if (settings) {
            switch (taskType) {
                case 'duty': amount = settings.duty_fee; break;
                case 'evening_study': amount = settings.evening_study_fee; break;
                case 'saturday_study': amount = settings.saturday_study_fee; break;
            }
        }

        const { error } = await supabase
            .from('extra_tasks')
            .insert({
                school_id: schoolId,
                teacher_id: teacherId,
                teacher_name: teacherName,
                task_type: taskType,
                date: date,
                amount: amount // Store the historical fee
            });

        if (error) throw error;
        revalidatePath('/ek-gorevler');
        revalidatePath('/puantaj');
        return { success: true };
    } catch (error: any) {
        console.error('Error creating extra task:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteExtraTask(taskId: string) {
    try {
        const { error } = await supabase
            .from('extra_tasks')
            .delete()
            .eq('id', taskId);

        if (error) throw error;
        revalidatePath('/ek-gorevler');
        revalidatePath('/puantaj');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting extra task:', error);
        return { success: false, error: error.message };
    }
}

export async function getExtraTasks(schoolId: string, date?: string) {
    try {
        let query = supabase
            .from('extra_tasks')
            .select('*')
            .eq('school_id', schoolId)
            .order('date', { ascending: false });

        if (date) {
            query = query.eq('date', date);
        }

        const { data, error } = await query;
        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching extra tasks:', error);
        return { success: false, error: error.message };
    }
}
