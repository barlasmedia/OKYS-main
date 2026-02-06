import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { FileDown, Search, ArrowLeft } from 'lucide-react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../../components/ui/table-components';
import Link from 'next/link';
import { cn } from '../../../lib/utils';
import SubstitutionExportButton from '../../../components/reports/SubstitutionExportButton';

export const dynamic = 'force-dynamic';

export default async function SubstitutionReportPage() {
    // For robust server components, use createClient from @supabase/supabase-js with URL/KEY
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    // Fetch substitutions 
    let substitutions: any[] = [];
    let error: any = null;

    try {
        const result = await sb
            .from('substitutions')
            .select(`
                *,
                original:timetable_teachers!original_teacher_id(name),
                substitute:timetable_teachers!substitute_teacher_id(name),
                lesson:timetable_lessons!lesson_id(
                    subject:timetable_subjects(name),
                    classes:timetable_lesson_classes(
                        class:timetable_classes(name)
                    )
                )
            `)
            .order('date', { ascending: false })
            .order('period_index', { ascending: true })
            .limit(100);

        substitutions = result.data || [];
        error = result.error;
    } catch (e) {
        console.error('Report fetch failed:', e);
    }

    if (error) {
        return <div className="p-8 text-destructive font-bold glass-card">Rapor yüklenirken hata oluştu: {error.message}</div>;
    }

    // Fetch periods for time mapping
    let periods: any[] = [];
    try {
        const pResult = await sb
            .from('timetable_periods')
            .select('school_id, period_index, starttime, endtime');
        periods = pResult.data || [];
    } catch (e) {
        console.error('Periods fetch failed:', e);
    }

    // Group substitutions by date
    const groupedByDate = substitutions.reduce((acc: Record<string, any[]>, sub) => {
        const date = sub.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(sub);
        return acc;
    }, {});

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-white/5">
                <div className="space-y-2">
                    <h1 className="text-4xl font-display font-black text-white tracking-tight uppercase">GÖREVLENDİRME RAPORU</h1>
                    <p className="text-muted-foreground font-medium">Sistem üzerinden yapılan tüm ders doldurma işlemlerinin geçmişi.</p>
                </div>
                <div className="flex items-center space-x-4 w-full md:w-auto">
                    <div className="flex-1 md:flex-none bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 flex items-center space-x-3 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <input type="text" placeholder="Raporlarda ara..." className="bg-transparent border-none outline-none text-sm font-medium w-full" />
                    </div>
                    <SubstitutionExportButton data={substitutions} periods={periods} />
                </div>
            </div>

            <div className="space-y-16">
                {Object.keys(groupedByDate).length > 0 ? (
                    Object.entries(groupedByDate as Record<string, any[]>).map(([date, subs], idx) => {
                        const dateFormatted = new Date(date).toLocaleDateString('tr-TR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });

                        return (
                            <div key={date} className="space-y-6 animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="flex items-center space-x-4">
                                    <h2 className="text-xs font-black text-primary uppercase tracking-[0.4em] bg-primary/10 px-6 py-2 rounded-full border border-primary/20 shadow-lg shadow-primary/5">
                                        {dateFormatted}
                                    </h2>
                                    <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent"></div>
                                </div>

                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead>Saat</TableHead>
                                            <TableHead>Ders / Sınıf</TableHead>
                                            <TableHead>Gelmeyen</TableHead>
                                            <TableHead>Görevli</TableHead>
                                            <TableHead>Durum</TableHead>
                                            <TableHead>Mazeret</TableHead>
                                            <TableHead className="text-right">İşlem</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {subs.map((sub: any) => {
                                            const subject = sub.subject_name || sub.lesson?.subject?.name || '-';
                                            const classes = sub.class_names || sub.lesson?.classes?.map((c: any) => c.class.name).join(', ') || '-';
                                            const origName = sub.original_teacher_name || sub.original?.name || '-';
                                            const subName = sub.substitute_teacher_name || sub.substitute?.name || '-';

                                            return (
                                                <TableRow key={sub.id}>
                                                    <TableCell>
                                                        <div className="text-[10px] text-primary font-black uppercase tracking-widest">
                                                            {sub.period_name || `${sub.period_index}. SAAT`}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-bold text-white group-hover:text-primary transition-colors">{subject}</div>
                                                        <div className="text-[11px] text-muted-foreground font-bold opacity-60">{classes}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-destructive/80 font-bold">{origName}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-primary font-bold">{subName}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm",
                                                            sub.status === 'approved' ? "bg-primary/20 text-primary border border-primary/20" : "bg-white/5 text-muted-foreground border border-white/5"
                                                        )}>
                                                            {sub.status === 'approved' ? 'ONAYLI' : sub.status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="max-w-[150px] truncate text-muted-foreground italic text-xs font-medium">
                                                        {sub.reason}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Link
                                                            href={`/gorevlendirme?date=${sub.date}&teacherId=${sub.original_teacher_id}`}
                                                            className="inline-flex items-center gap-2 text-[10px] font-black text-primary hover:text-white bg-primary/5 hover:bg-primary px-4 py-2 rounded-xl border border-primary/20 transition-all uppercase tracking-tighter"
                                                        >
                                                            <span>Yönet</span>
                                                        </Link>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        );
                    })
                ) : (
                    <div className="glass-card py-24 text-center space-y-4 rounded-3xl">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                            <Search className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-white">Kayıt Bulunamadı</h3>
                            <p className="text-muted-foreground text-sm font-medium">Henüz sistemde bir görevlendirme kaydı bulunmamaktadır.</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-10 flex justify-center">
                <Link href="/gorevlendirme" className="group flex items-center space-x-3 text-muted-foreground hover:text-white transition-all font-bold text-sm bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Ders Doldurma Ekranına Dön</span>
                </Link>
            </div>
        </div>
    );
}
