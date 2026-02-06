'use server';

import { supabase } from '../../lib/supabase';
import { revalidatePath } from 'next/cache';

export interface TeacherActivity {
    date: string;
    type: 'Ek Ders (+)' | 'Kesinti (-)' | 'Nöbet' | 'Akşam Etütü' | 'Cumartesi Etütü';
    amount: number;
}

export interface TeacherPayrollSummary {
    teacher_id: string;
    teacher_name: string;
    activities: TeacherActivity[];
    total_sub_paid: number;
    total_sub_missed: number;
    total_sub_amount: number;
    total_extra_amount: number;
    total_amount: number;
}

export interface PayrollSettings {
    substitution_fee: number;
    duty_fee: number;
    evening_study_fee: number;
    saturday_study_fee: number;
}

export async function getPayrollData(schoolId: string, month: number, year: number) {
    try {
        // 1. Get Settings
        const { data: settingsData } = await supabase
            .from('payroll_settings')
            .select('*')
            .eq('school_id', schoolId)
            .single();

        const fees: PayrollSettings = {
            substitution_fee: settingsData?.substitution_fee || 170,
            duty_fee: settingsData?.duty_fee || 200,
            evening_study_fee: settingsData?.evening_study_fee || 400,
            saturday_study_fee: settingsData?.saturday_study_fee || 1000,
        };

        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        // 2. Fetch Substitutions
        const { data: substitutions, error: subError } = await supabase
            .from('substitutions')
            .select('*')
            .eq('school_id', schoolId)
            .gte('date', startDate)
            .lte('date', endDate)
            .eq('status', 'approved');

        if (subError) throw subError;

        // 3. Fetch Extra Tasks
        const { data: extraTasks, error: taskError } = await supabase
            .from('extra_tasks')
            .select('*')
            .eq('school_id', schoolId)
            .gte('date', startDate)
            .lte('date', endDate);

        if (taskError) throw taskError;

        // 4. Aggregate data
        const summaryMap: Record<string, TeacherPayrollSummary> = {};

        const getTeacher = (id: string, name: string) => {
            if (!summaryMap[id]) {
                summaryMap[id] = {
                    teacher_id: id,
                    teacher_name: name || 'Bilinmeyen',
                    activities: [],
                    total_sub_paid: 0,
                    total_sub_missed: 0,
                    total_sub_amount: 0,
                    total_extra_amount: 0,
                    total_amount: 0
                };
            }
            return summaryMap[id];
        };

        // Process Substitutions
        substitutions?.forEach(sub => {
            // Substitute (Paid)
            if (sub.substitute_teacher_id) {
                const t = getTeacher(sub.substitute_teacher_id, sub.substitute_teacher_name);
                const amount = sub.amount !== undefined && sub.amount !== null ? Number(sub.amount) : fees.substitution_fee;
                t.activities.push({
                    date: sub.date,
                    type: 'Ek Ders (+)',
                    amount: amount
                });
                t.total_sub_paid += 1;
                t.total_sub_amount += amount;
                t.total_amount += amount;
            }
            // Original (Deducted)
            if (sub.original_teacher_id) {
                const t = getTeacher(sub.original_teacher_id, sub.original_teacher_name);
                // For deduction, we use the same amount logic but negative
                const amount = sub.amount !== undefined && sub.amount !== null ? Number(sub.amount) : fees.substitution_fee;
                t.activities.push({
                    date: sub.date,
                    type: 'Kesinti (-)',
                    amount: -amount
                });
                t.total_sub_missed += 1;
                t.total_sub_amount -= amount;
                t.total_amount -= amount;
            }
        });

        // Process Extra Tasks
        extraTasks?.forEach(task => {
            const t = getTeacher(task.teacher_id, task.teacher_name);
            let amount = 0;
            let typeName: any = '';

            // Use stored amount if available, otherwise fallback to current settings (though migration should handle this)
            if (task.amount !== undefined && task.amount !== null) {
                amount = Number(task.amount);
            } else {
                switch (task.task_type) {
                    case 'duty': amount = fees.duty_fee; break;
                    case 'evening_study': amount = fees.evening_study_fee; break;
                    case 'saturday_study': amount = fees.saturday_study_fee; break;
                }
            }

            switch (task.task_type) {
                case 'duty': typeName = 'Nöbet'; break;
                case 'evening_study': typeName = 'Akşam Etütü'; break;
                case 'saturday_study': typeName = 'Cumartesi Etütü'; break;
            }

            t.activities.push({
                date: task.date,
                type: typeName,
                amount: amount
            });
            t.total_extra_amount += amount;
            t.total_amount += amount;
        });

        // 5. Filter and Sort
        // User asked: "Görev veya ders doldurması olmayan öğretmen raporlanmasın"
        const results = Object.values(summaryMap)
            .filter(t => t.activities.length > 0)
            .map(t => ({
                ...t,
                activities: t.activities.sort((a, b) => a.date.localeCompare(b.date))
            }))
            .sort((a, b) => b.total_amount - a.total_amount);

        return { success: true, data: { results, settings: fees } };
    } catch (error: any) {
        console.error('Error fetching payroll data:', error);
        return { success: false, error: error.message };
    }
}

export async function updatePayrollSettings(schoolId: string, settings: PayrollSettings) {
    try {
        const { error } = await supabase
            .from('payroll_settings')
            .upsert({
                school_id: schoolId,
                ...settings,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
        revalidatePath('/puantaj');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating payroll settings:', error);
        return { success: false, error: error.message };
    }
}
