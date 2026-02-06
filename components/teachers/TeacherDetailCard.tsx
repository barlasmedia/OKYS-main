'use client';

import { Card } from '../ui/card';
import { BookOpen, GraduationCap, Clock, User } from 'lucide-react';

interface LessonSummary {
    subject: string;
    subjectShort: string;
    hours: number;
    classes: string;
}

interface TeacherDetails {
    teacher: {
        name: string;
        firstname?: string;
        lastname?: string;
        short: string;
        email?: string;
    };
    lessons: LessonSummary[];
    totalHours: number;
}

export default function TeacherDetailCard({ data }: { data: TeacherDetails }) {
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            {/* Header / Basic Info */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/20">
                <div className="flex items-center space-x-4">
                    <div className="p-4 rounded-2xl bg-blue-500/20 text-blue-400">
                        <User className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">{data.teacher.name}</h2>
                        <div className="flex items-center space-x-3 mt-1 text-zinc-400 text-sm font-medium">
                            <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">{data.teacher.short}</span>
                            {data.teacher.email && <span>{data.teacher.email}</span>}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-white/[0.02] border-white/10">
                    <div className="flex flex-col items-center justify-center py-4 space-y-1">
                        <Clock className="w-5 h-5 text-amber-500 mb-1" />
                        <span className="text-2xl font-bold text-white">{data.totalHours}</span>
                        <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Toplam Saat</span>
                    </div>
                </Card>
                <Card className="bg-white/[0.02] border-white/10">
                    <div className="flex flex-col items-center justify-center py-4 space-y-1">
                        <BookOpen className="w-5 h-5 text-emerald-500 mb-1" />
                        <span className="text-2xl font-bold text-white">{data.lessons.length}</span>
                        <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Ders Grubu</span>
                    </div>
                </Card>
            </div>

            {/* Lesson Details */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Ders Dağılımı</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {data.lessons.map((lesson) => (
                        <Card key={lesson.subject} className="bg-white/[0.02] border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <BookOpen className="w-4 h-4 text-blue-500/70" />
                                        <h4 className="font-semibold text-white tracking-tight">{lesson.subject}</h4>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-zinc-400">
                                        <GraduationCap className="w-4 h-4 text-zinc-600" />
                                        <span>{lesson.classes}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-white">{lesson.hours} <span className="text-xs text-zinc-500 font-medium">saat</span></div>
                                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">{lesson.subjectShort}</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
