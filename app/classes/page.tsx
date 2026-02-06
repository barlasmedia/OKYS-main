'use client';

import { useState, useEffect } from 'react';
import {
    getClasses,
    getPeriods,
    getClassTimetable,
    getClassDetails
} from '../actions/timetable';
import { Button } from '../../components/ui/button';
import Link from 'next/link';
import { Card } from '../../components/ui/card';
import {
    GraduationCap,
    Clock,
    Calendar,
    Loader2,
    ChevronRight,
    LayoutDashboard
} from 'lucide-react';
import { cn } from '../../lib/utils';
// ... imports

const DAYS = [
    { name: 'Pazartesi', mask: '10000' },
    { name: 'Salı', mask: '01000' },
    { name: 'Çarşamba', mask: '00100' },
    { name: 'Perşembe', mask: '00010' },
    { name: 'Cuma', mask: '00001' },
];

export default function ClassTimetablePage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [periods, setPeriods] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [timetable, setTimetable] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);

    useEffect(() => {
        async function init() {
            try {
                const [cList, pList] = await Promise.all([
                    getClasses(),
                    getPeriods()
                ]);
                setClasses(cList);
                setPeriods(pList);
                if (cList.length > 0) {
                    setSelectedClassId(cList[0].id);
                }
            } catch (error) {
                console.error('Başlatma hatası:', error);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, []);

    useEffect(() => {
        async function fetchTimetable() {
            if (!selectedClassId) return;
            setDataLoading(true);
            try {
                setTimetable(await getClassTimetable(selectedClassId));
            } catch (error) {
                console.error('Sınıf verisi yükleme hatası:', error);
            } finally {
                setDataLoading(false);
            }
        }
        fetchTimetable();
    }, [selectedClassId]);

    const getCellContent = (dayMask: string, periodIndex: number) => {
        const card = timetable.find(c => c.days_mask === dayMask && c.period_index === periodIndex);
        if (!card) return null;

        const lesson = card.timetable_lessons;
        const subject = lesson.timetable_subjects;
        const teachers = lesson.timetable_lesson_teachers.map((t: any) => t.timetable_teachers.name).join(', ');
        const classroom = card.timetable_card_classrooms?.[0]?.timetable_classrooms?.short || '';

        return (
            <div className="flex flex-col h-full justify-center space-y-1">
                <span className="text-sm font-bold text-white leading-tight">{subject.name}</span>
                <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[140px]">{teachers}</span>
                {classroom && (
                    <span className="text-[9px] bg-white/5 border border-white/5 rounded px-1 self-start text-zinc-500">
                        {classroom}
                    </span>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight text-glow-indigo">Sınıf Programları</h1>
                    <p className="text-zinc-400 mt-2">Sınıf bazlı haftalık ders dağılımı ve detaylar.</p>
                </div>

                <div className="flex items-center space-x-4">
                    {selectedClassId && (
                        <Link href={`/classes/${selectedClassId}`}>
                            <Button variant="outline" className="text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10">
                                <LayoutDashboard className="w-4 h-4 mr-2" />
                                Bilgi Kartını Görüntüle
                            </Button>
                        </Link>
                    )}

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <GraduationCap className="w-5 h-5 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="bg-black border border-white/10 text-white pl-12 pr-10 py-3 rounded-2xl appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full md:w-64 transition-all"
                        >
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <ChevronRight className="absolute inset-y-0 right-4 flex items-center pointer-events-none w-5 h-5 text-zinc-500 rotate-90" />
                    </div>
                </div>
            </div>

            <Card className="overflow-hidden border-white/5 p-0 glass-panel shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-white/[0.03]">
                                <th className="p-4 text-left border-b border-white/10 w-32 sticky left-0 bg-[#0a0a0a] z-10">
                                    <div className="flex items-center space-x-2 text-zinc-500">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs font-semibold uppercase tracking-wider">Saat</span>
                                    </div>
                                </th>
                                {DAYS.map(day => (
                                    <th key={day.name} className="p-4 text-left border-b border-white/10 min-w-[160px]">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{day.name}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {periods.map(period => (
                                <tr key={period.id} className="group hover:bg-white/[0.01] transition-colors">
                                    <td className="p-4 border-b border-white/5 bg-[#0a0a0a]/50 sticky left-0 z-10 backdrop-blur-sm">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white">{period.name}</span>
                                            <span className="text-[11px] text-zinc-600 font-medium mt-0.5">{period.starttime} - {period.endtime}</span>
                                        </div>
                                    </td>
                                    {DAYS.map(day => {
                                        const content = getCellContent(day.mask, period.period_index);
                                        return (
                                            <td key={day.mask} className="p-4 border-b border-white/5">
                                                {dataLoading ? (
                                                    <div className="h-14 bg-white/5 rounded-xl animate-pulse" />
                                                ) : content ? (
                                                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all cursor-default group/card min-h-[80px]">
                                                        {content}
                                                    </div>
                                                ) : (
                                                    <div className="h-14 flex items-center justify-center text-zinc-800 italic text-[10px] font-medium tracking-widest opacity-50 uppercase">
                                                        Boş
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {!selectedClassId && !loading && (
                <div className="text-center py-20 glass rounded-3xl border border-white/5 shadow-inner">
                    <LayoutDashboard className="w-12 h-12 text-zinc-700 mx-auto mb-4 opacity-50" />
                    <p className="text-zinc-500 font-medium">Programı ve detaylı bilgileri görüntülemek için lütfen bir sınıf seçin.</p>
                </div>
            )}
        </div>
    );
}
