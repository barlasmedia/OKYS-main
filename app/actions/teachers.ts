'use server';

import { supabase } from '../../lib/supabase';
import { Teacher } from '../../lib/types';
import { revalidatePath } from 'next/cache';

export async function getTeachers(): Promise<Teacher[]> {
    const { data, error } = await supabase
        .from('timetable_teachers')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching teachers:', error);
        return [];
    }

    return data as Teacher[];
}

export async function updateTeacher(id: string, branch: string, grades: string[]) {
    const { error } = await supabase
        .from('timetable_teachers')
        .update({ branch, grades })
        .eq('id', id);

    if (error) {
        console.error('Error updating teacher:', error);
        throw new Error('Öğretmen güncellenemedi.');
    }

    revalidatePath('/ogretmenler');
}
