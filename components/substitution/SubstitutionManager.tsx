'use client';

import React, { useState } from 'react';
import { UserCheck, CalendarDays } from 'lucide-react';
import { DailySchedule } from './DailySchedule';
import { SubstituteList } from './SubstituteList';
import { getTeacherSchedule, getAvailableTeachers, createSubstitution, deleteSubstitution } from '@/app/actions/substitutionActions';
import type { SubstituteCandidate } from '@/lib/services/substitutionService';

interface Teacher {
    id: string;
    name: string;
}

interface SubstitutionManagerProps {
    initialTeachers: Teacher[];
    schoolId: string;
    initialDate?: string;
    initialTeacherId?: string;
}

export function SubstitutionManager({
    initialTeachers,
    schoolId,
    initialDate,
    initialTeacherId
}: SubstitutionManagerProps) {
    // State
    const [selectedDate, setSelectedDate] = useState<string>(initialDate || (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })());
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>(initialTeacherId || '');

    const [schedule, setSchedule] = useState<any[]>([]);
    const [substitutions, setSubstitutions] = useState<any[]>([]);
    const [loadingSchedule, setLoadingSchedule] = useState(false);

    const [selectedSlot, setSelectedSlot] = useState<any>(null);
    const [candidates, setCandidates] = useState<SubstituteCandidate[]>([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);

    // Excuse type state
    const [excuseType, setExcuseType] = useState<'raporlu' | 'idari_izinli_gorevli' | 'gelmedi'>('gelmedi');

    // Initial load if params provided
    React.useEffect(() => {
        if (selectedTeacherId && selectedDate) {
            fetchSchedule(selectedTeacherId, selectedDate);
        }
    }, []);

    // Handlers
    const handleTeacherChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const teacherId = e.target.value;
        setSelectedTeacherId(teacherId);
        setSelectedSlot(null);
        setCandidates([]);

        if (teacherId && selectedDate) {
            fetchSchedule(teacherId, selectedDate);
        } else {
            setSchedule([]);
        }
    };

    const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = e.target.value;
        setSelectedDate(date);
        setSelectedSlot(null);
        setCandidates([]);

        if (selectedTeacherId && date) {
            fetchSchedule(selectedTeacherId, date);
        }
    };

    const fetchSchedule = async (tid: string, date: string) => {
        setLoadingSchedule(true);
        const result = await getTeacherSchedule(schoolId, tid, date);
        if (result.success && result.data) {
            // @ts-ignore
            setSchedule(result.data.schedule || []);
            // @ts-ignore
            setSubstitutions(result.data.substitutions || []);
        } else {
            alert("Ders programı yüklenemedi: " + result.error);
        }
        setLoadingSchedule(false);
    };

    const handleSlotSelect = async (card: any) => {
        setSelectedSlot(card);
        setLoadingCandidates(true);

        // card.lesson.id is the missing lesson
        // period is card.period_index
        const result = await getAvailableTeachers(schoolId, selectedDate, card.period_index, card.lesson_id);

        if (result.success && result.data) {
            setCandidates(result.data);
        } else {
            alert("Öğretmenler listelenemedi: " + result.error);
        }
        setLoadingCandidates(false);
    };

    const handleCandidateSelect = async (candidate: SubstituteCandidate) => {
        // Simple confirmation dialog - excuse is already selected via dropdown
        const excuseLabel = excuseType === 'raporlu' ? 'Raporlu' :
            excuseType === 'idari_izinli_gorevli' ? 'İdari İzinli – Görevli' :
                'Gelmedi';

        const confirmed = confirm(`Görevlendirme Onayı:\n\n${candidate.name} öğretmeni görevlendirilecek.\nMazeret: ${excuseLabel}\n\nDevam etmek istiyor musunuz?`);

        if (!confirmed) return; // User cancelled

        const origTeacher = initialTeachers.find(t => t.id === selectedTeacherId);
        const subjectName = selectedSlot.lesson?.subject?.name || 'Unknown';
        const classNames = selectedSlot.lesson?.classes?.map((c: any) => c.class.name).join(', ') || 'No Classes';
        const periodName = selectedSlot.period?.name || selectedSlot.period_index.toString();

        const result = await createSubstitution(
            schoolId,
            selectedTeacherId,
            origTeacher?.name || 'Deleted Teacher',
            candidate.teacher_id,
            candidate.name,
            selectedSlot.lesson.id,
            subjectName,
            classNames,
            periodName,
            selectedDate,
            selectedSlot.period_index,
            excuseLabel, // Use excuse label as reason
            excuseType // Pass excuse type to server action
        );

        if (result.success) {
            alert("Görevlendirme başarıyla oluşturuldu.");
            // Refresh? Or just reset slot
            setSelectedSlot(null);
            setCandidates([]);
            fetchSchedule(selectedTeacherId, selectedDate); // Refresh schedule to show lock? TODO: Visualize lock
        } else {
            alert("Hata: " + result.error);
        }
    };

    const handleUnlockSlot = async (subId: string) => {
        if (!confirm("Bu görevlendirmeyi silmek ve kilidi kaldırmak istediğinize emin misiniz?")) return;

        const result = await deleteSubstitution(subId);
        if (result.success) {
            alert("Görevlendirme silindi ve kilit kaldırıldı.");
            fetchSchedule(selectedTeacherId, selectedDate);
        } else {
            alert("Hata: " + result.error);
        }
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Left Panel: Controls & Schedule */}
            <div className="xl:col-span-4 space-y-8">
                <div className="bg-card p-6 rounded-2xl shadow-xl border border-border space-y-6">
                    <h2 className="text-foreground font-bold text-xl tracking-tight border-b border-border pb-4">1. Seçimler</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Tarih</label>
                            <div className="relative group">
                                <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E16815]" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    className="w-full bg-background border border-border rounded-xl p-3 pl-12 focus:ring-2 focus:ring-primary outline-none text-foreground transition-all cursor-pointer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Gelmeyen Öğretmen</label>
                            <select
                                value={selectedTeacherId}
                                onChange={handleTeacherChange}
                                className="w-full bg-background border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none text-foreground transition-all"
                            >
                                <option value="">Seçiniz...</option>
                                {initialTeachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">
                                Mazeret Türü <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={excuseType}
                                onChange={(e) => setExcuseType(e.target.value as any)}
                                className="w-full bg-background border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none text-foreground transition-all"
                            >
                                <option value="gelmedi">Gelmedi</option>
                                <option value="raporlu">Raporlu</option>
                                <option value="idari_izinli_gorevli">İdari İzinli – Görevli</option>
                            </select>
                            <p className="text-xs text-muted-foreground mt-1.5 ml-1">
                                {['gelmedi', 'raporlu'].includes(excuseType) ? '⚠️ Kesinti uygulanır' : '✅ Kesinti uygulanmaz'}
                            </p>
                        </div>
                    </div>
                </div>

                {loadingSchedule ? (
                    <div className="text-center text-muted-foreground py-8 animate-pulse font-medium">Program yükleniyor...</div>
                ) : (
                    selectedTeacherId && (
                        <div className="animate-in slide-in-from-bottom-4 duration-500">
                            <DailySchedule
                                schedule={schedule}
                                substitutions={substitutions}
                                onSelectSlot={handleSlotSelect}
                                onUnlockSlot={handleUnlockSlot}
                                selectedCardId={selectedSlot?.id}
                            />
                        </div>
                    )
                )}
            </div>

            {/* Right Panel: Substitution List */}
            <div className="xl:col-span-8 h-full">
                <div className="bg-card p-8 rounded-2xl shadow-xl border border-border min-h-[600px] flex flex-col">
                    {selectedSlot ? (
                        <div className="animate-in fade-in duration-700 space-y-6">
                            <div className="flex justify-between items-end border-b border-border pb-6">
                                <div>
                                    <h2 className="text-foreground font-black text-2xl tracking-tighter">
                                        {selectedSlot.period?.name || `${selectedSlot.period_index}. Ders`} Görevlendirmesi
                                    </h2>
                                    <p className="text-muted-foreground mt-1 font-medium">Bu ders için en uygun yedek öğretmeni atayın.</p>
                                </div>
                                <div className="bg-primary/10 px-4 py-2 rounded-xl text-sm font-bold text-primary border border-primary/20">
                                    {selectedSlot.lesson?.subject?.name} • {selectedSlot.lesson?.classes?.map((c: any) => c.class.name).join(', ')}
                                </div>
                            </div>

                            <SubstituteList
                                candidates={candidates}
                                loading={loadingCandidates}
                                onSelectCandidate={handleCandidateSelect}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-6 opacity-40">
                            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-4xl border border-border shadow-inner">
                                <UserCheck className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold text-foreground">Görevlendirme Başlatın</p>
                                <p className="max-w-[280px] mx-auto mt-2">Lütfen soldaki listeden telafi edilecek ders saatini seçiniz.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
