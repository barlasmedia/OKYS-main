import { Card } from '../components/ui/card';
import {
    Users,
    BookOpen,
    Calendar,
    Briefcase,
    Calculator,
    TrendingUp,
    School,
    CheckCircle2,
    Shield,
    Moon,
    Sun,
    ArrowUpCircle,
    ArrowDownCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getPayrollData } from './actions/payrollActions';

export const dynamic = 'force-dynamic';

async function getStats() {
    const school_id = '00000000-0000-0000-0000-000000000000';
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

    try {
        // 1. Fetch System Totals and Monthly Data
        const [
            resTeachers,
            resClasses,
            resLessons,
            resSubstitutionsMonth,
            resExtraTasksData
        ] = await Promise.all([
            supabase.from('timetable_teachers').select('*', { count: 'exact', head: true }).eq('school_id', school_id),
            supabase.from('timetable_classes').select('*', { count: 'exact', head: true }).eq('school_id', school_id),
            supabase.from('timetable_lessons').select('*', { count: 'exact', head: true }).eq('school_id', school_id),
            supabase.from('substitutions').select('*', { count: 'exact', head: true })
                .eq('school_id', school_id)
                .eq('status', 'approved')
                .gte('date', startDate)
                .lte('date', endDate),
            supabase.from('extra_tasks').select('task_type')
                .eq('school_id', school_id)
                .gte('date', startDate)
                .lte('date', endDate)
        ]);

        // 2. Process Extra Tasks
        const extraTasks = resExtraTasksData.data || [];
        const dutyCount = extraTasks.filter(t => t.task_type === 'duty').length;
        const eveningStudyCount = extraTasks.filter(t => t.task_type === 'evening_study').length;
        const saturdayStudyCount = extraTasks.filter(t => t.task_type === 'saturday_study').length;

        // 3. Calculate Payroll Split
        let totalPayments = 0;
        let totalDeductions = 0;
        const payrollResult = await getPayrollData(school_id, currentMonth, currentYear);

        if (payrollResult.success && payrollResult.data) {
            payrollResult.data.results.forEach(teacher => {
                teacher.activities.forEach(act => {
                    if (act.amount > 0) totalPayments += act.amount;
                    else if (act.amount < 0) totalDeductions += Math.abs(act.amount);
                });
            });
        }

        return {
            system: {
                teachers: resTeachers.count || 0,
                classes: resClasses.count || 0,
                lessons: resLessons.count || 0,
            },
            monthly: {
                substitutions: resSubstitutionsMonth.count || 0,
                duty: dutyCount,
                eveningStudy: eveningStudyCount,
                saturdayStudy: saturdayStudyCount,
                payments: totalPayments,
                deductions: totalDeductions
            }
        };
    } catch (e) {
        console.warn('Dashboard stats fetch failed:', e);
        return {
            system: { teachers: 0, classes: 0, lessons: 0 },
            monthly: { substitutions: 0, duty: 0, eveningStudy: 0, saturdayStudy: 0, payments: 0, deductions: 0 }
        };
    }
}

export default async function Dashboard() {
    const stats = await getStats();
    const currentMonthName = new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">
            {/* Header */}
            <div className="space-y-2 border-b border-white/5 pb-8">
                <h1 className="text-4xl font-display font-black text-white tracking-tight uppercase">
                    KONTROL PANELİ
                </h1>
                <p className="text-muted-foreground font-medium text-lg">
                    Okul genel durumu ve <span className="text-primary font-bold">{currentMonthName}</span> dönemi istatistikleri.
                </p>
            </div>

            {/* System Overview Grid */}
            <div>
                <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2 opacity-80">
                    <School className="w-4 h-4 text-white/70" />
                    SİSTEM GENELİ
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 bg-blue-500/5 border-blue-500/10 hover:border-blue-500/30 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-4xl font-display font-black text-white group-hover:text-blue-500 transition-colors">
                                {stats.system.teachers}
                            </p>
                            <p className="text-sm font-bold text-muted-foreground">Toplam Öğretmen</p>
                        </div>
                    </Card>

                    <Card className="p-6 bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                                <BookOpen className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-4xl font-display font-black text-white group-hover:text-emerald-500 transition-colors">
                                {stats.system.classes}
                            </p>
                            <p className="text-sm font-bold text-muted-foreground">Aktif Sınıf</p>
                        </div>
                    </Card>

                    <Card className="p-6 bg-amber-500/5 border-amber-500/10 hover:border-amber-500/30 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                                <Calendar className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-4xl font-display font-black text-white group-hover:text-amber-500 transition-colors">
                                {stats.system.lessons}
                            </p>
                            <p className="text-sm font-bold text-muted-foreground">Tanımlı Ders</p>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Monthly Stats Grid */}
            <div>
                <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    BU AYIN HAREKETLERİ ({currentMonthName})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Ders Doldurma */}
                    <Card className="p-6 bg-indigo-500/5 border-indigo-500/10 hover:border-indigo-500/30 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-4xl font-display font-black text-white group-hover:text-indigo-500 transition-colors">
                                {stats.monthly.substitutions}
                            </p>
                            <p className="text-sm font-bold text-muted-foreground">Ders Doldurma</p>
                        </div>
                    </Card>

                    {/* Nöbet */}
                    <Card className="p-6 bg-rose-500/5 border-rose-500/10 hover:border-rose-500/30 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
                                <Shield className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-4xl font-display font-black text-white group-hover:text-rose-500 transition-colors">
                                {stats.monthly.duty}
                            </p>
                            <p className="text-sm font-bold text-muted-foreground">Nöbet</p>
                        </div>
                    </Card>

                    {/* Akşam Etütü */}
                    <Card className="p-6 bg-purple-500/5 border-purple-500/10 hover:border-purple-500/30 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
                                <Moon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-4xl font-display font-black text-white group-hover:text-purple-500 transition-colors">
                                {stats.monthly.eveningStudy}
                            </p>
                            <p className="text-sm font-bold text-muted-foreground">Akşam Etütü</p>
                        </div>
                    </Card>

                    {/* Cumartesi Etütü */}
                    <Card className="p-6 bg-orange-500/5 border-orange-500/10 hover:border-orange-500/30 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500">
                                <Sun className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-4xl font-display font-black text-white group-hover:text-orange-500 transition-colors">
                                {stats.monthly.saturdayStudy}
                            </p>
                            <p className="text-sm font-bold text-muted-foreground">Cumartesi Etütü</p>
                        </div>
                    </Card>

                    {/* Payments */}
                    <Card className="p-6 bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30 transition-all group border-l-4 border-l-emerald-500">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                                <ArrowUpCircle className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-display font-black text-white group-hover:text-emerald-500 transition-colors truncate">
                                {stats.monthly.payments} <span className="text-sm text-muted-foreground font-medium">TL</span>
                            </p>
                            <p className="text-sm font-bold text-muted-foreground">Tahmini Toplam Ödeme</p>
                        </div>
                    </Card>

                    {/* Deductions */}
                    <Card className="p-6 bg-rose-500/5 border-rose-500/10 hover:border-rose-500/30 transition-all group border-l-4 border-l-rose-500">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
                                <ArrowDownCircle className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-display font-black text-white group-hover:text-rose-500 transition-colors truncate">
                                -{stats.monthly.deductions} <span className="text-sm text-muted-foreground font-medium">TL</span>
                            </p>
                            <p className="text-sm font-bold text-muted-foreground">Tahmini Toplam Kesinti</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
