import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { SubstitutionManager } from '../../components/substitution/SubstitutionManager';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function SubstitutionPage({
    searchParams
}: {
    searchParams: { date?: string; teacherId?: string }
}) {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: { persistSession: false }
    });

    const { data: schools } = await supabase.from('timetable_periods').select('school_id').limit(1);
    const schoolId = schools?.[0]?.school_id;

    if (!schoolId) {
        return <div className="p-8 text-red-500">Okul ID bulunamadı. Lütfen önce veri yükleyiniz.</div>;
    }

    const { data: teachers } = await supabase
        .from('timetable_teachers')
        .select('id, name, branch, grades')
        .eq('school_id', schoolId)
        .order('name');

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
            <div className="space-y-2">
                <h1 className="text-4xl font-display font-black text-white tracking-tight uppercase italic">GÖREVLENDİRME MERKEZİ</h1>
                <p className="text-muted-foreground font-medium text-lg">Gelmeyen öğretmenlerin derslerini planlayın ve telafilerini yönetin.</p>
            </div>

            <SubstitutionManager
                initialTeachers={teachers || []}
                schoolId={schoolId}
                initialDate={searchParams.date}
                initialTeacherId={searchParams.teacherId}
            />
        </div>
    );
}
