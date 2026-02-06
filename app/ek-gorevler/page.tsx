'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import {
    Plus,
    Trash2,
    Calendar as CalendarIcon,
    User,
    Briefcase,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table-components';
import { createExtraTask, deleteExtraTask, getExtraTasks } from '../actions/extraTaskActions';
import { createClient } from '@supabase/supabase-js';
import { cn } from '../../lib/utils';

const TASK_TYPES = [
    { value: 'duty', label: 'Nöbet' },
    { value: 'evening_study', label: 'Akşam Etütü' },
    { value: 'saturday_study', label: 'Cumartesi Etütü' }
];

export default function ExtraTasksPage() {
    const schoolId = '00000000-0000-0000-0000-000000000000';
    const [teachers, setTeachers] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [selectedTaskType, setSelectedTaskType] = useState('duty');
    const [selectedDate, setSelectedDate] = useState((() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })());

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

        const { data: teacherData } = await sb
            .from('timetable_teachers')
            .select('id, name')
            .eq('school_id', schoolId)
            .order('name');

        setTeachers(teacherData || []);

        const result = await getExtraTasks(schoolId);
        if (result.success) {
            setTasks(result.data || []);
        }
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeacherId) return;

        setIsSubmitting(true);
        const teacher = teachers.find(t => t.id === selectedTeacherId);
        const result = await createExtraTask(
            schoolId,
            selectedTeacherId,
            teacher?.name || 'Unknown',
            selectedTaskType,
            selectedDate
        );

        if (result.success) {
            const refresh = await getExtraTasks(schoolId);
            if (refresh.success) setTasks(refresh.data || []);
            setSelectedTeacherId('');
        } else {
            alert("Görev eklenemedi: " + result.error);
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu görevi silmek istediğinize emin misiniz?")) return;
        const result = await deleteExtraTask(id);
        if (result.success) {
            setTasks(tasks.filter(t => t.id !== id));
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
            {/* Header */}
            <div className="space-y-2 pb-6 border-b border-white/5">
                <h1 className="text-4xl font-display font-black text-white tracking-tight uppercase italic">EK GÖREV YÖNETİMİ</h1>
                <p className="text-muted-foreground font-medium">Öğretmenlere Nöbet, Etüt gibi ek görevler tanımlayın.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form Section */}
                <div className="lg:col-span-4">
                    <Card className="p-8 space-y-6 sticky top-24">
                        <div className="flex items-center space-x-3 pb-4 border-b border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Plus className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-tight">YENİ GÖREV EKLE</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Öğretmen Seçin</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <select
                                        required
                                        value={selectedTeacherId}
                                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-white focus:border-primary/50 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="" className="bg-zinc-900">Seçiniz...</option>
                                        {teachers.map(t => (
                                            <option key={t.id} value={t.id} className="bg-zinc-900">{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Görev Türü</label>
                                <div className="relative group">
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <select
                                        required
                                        value={selectedTaskType}
                                        onChange={(e) => setSelectedTaskType(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-white focus:border-primary/50 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        {TASK_TYPES.map(t => (
                                            <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Tarih</label>
                                <div className="relative group">
                                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E16815] transition-colors" />
                                    <input
                                        type="date"
                                        required
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-white focus:border-primary/50 outline-none transition-all cursor-pointer"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                                ) : (
                                    <><CheckCircle2 className="w-5 h-5" /> GÖREVİ TANIMLA</>
                                )}
                            </button>
                        </form>
                    </Card>
                </div>

                {/* List Section */}
                <div className="lg:col-span-8">
                    <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xs font-black text-white uppercase tracking-[0.4em] bg-white/5 px-6 py-2 rounded-full border border-white/10 shadow-lg">
                                MEVCUT GÖREVLER
                            </h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                        </div>

                        {isLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center">
                                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                            </div>
                        ) : tasks.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead>Tarih</TableHead>
                                        <TableHead>Öğretmen</TableHead>
                                        <TableHead>Görev</TableHead>
                                        <TableHead className="text-right">İşlem</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks.map((task) => (
                                        <TableRow key={task.id}>
                                            <TableCell>
                                                <div className="font-bold text-white">
                                                    {new Date(task.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                                                        <User className="w-4 h-4 text-muted-foreground" />
                                                    </div>
                                                    <span className="font-bold text-white uppercase tracking-tight">{task.teacher_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                                    task.task_type === 'duty' ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                                                        task.task_type === 'evening_study' ? "bg-purple-500/10 text-purple-500 border border-purple-500/20" :
                                                            "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                                )}>
                                                    {TASK_TYPES.find(t => t.value === task.task_type)?.label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <button
                                                    onClick={() => handleDelete(task.id)}
                                                    className="p-2.5 rounded-xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/10 transition-all active:scale-95"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <Card className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10 opacity-20">
                                    <AlertCircle className="w-8 h-8 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-white uppercase">Görev Bulunamadı</h3>
                                    <p className="text-muted-foreground text-sm font-medium">Henüz herhangi bir ek görev girişi yapılmamış.</p>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
