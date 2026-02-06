'use client';

import React from 'react';
import type { SubstituteCandidate } from '@/lib/services/substitutionService';
import { cn } from '@/lib/utils';

interface SubstituteListProps {
    candidates: SubstituteCandidate[];
    onSelectCandidate: (candidate: SubstituteCandidate) => void;
    loading: boolean;
}

export function SubstituteList({ candidates, onSelectCandidate, loading }: SubstituteListProps) {
    if (loading) {
        return <div className="p-4 text-center text-gray-500">Uygun öğretmenler aranıyor...</div>;
    }

    if (candidates.length === 0) {
        return <div className="p-4 text-center text-gray-500">Bu saat için uygun öğretmen bulunamadı.</div>;
    }

    return (
        <div className="space-y-3">
            <h3 className="font-semibold text-lg border-b border-border pb-2 text-primary">Uygun Öğretmenler</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidates.map((teacher, index) => {
                    const isPriority = teacher.score >= 500;
                    const isBest = index === 0;

                    return (
                        <div
                            key={teacher.teacher_id}
                            className={cn(
                                "p-5 border rounded-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden",
                                teacher.is_super_match
                                    ? "border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/20"
                                    : teacher.is_guidance
                                        ? "border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/20"
                                        : isBest
                                            ? "border-primary bg-card shadow-lg shadow-primary/10 ring-1 ring-primary/20 scale-[1.02] z-10"
                                            : "border-border bg-card hover:border-primary/40 hover:shadow-md"
                            )}
                        >
                            {teacher.is_super_match ? (
                                <div className="absolute top-0 right-0 bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-tighter rounded-bl-lg">
                                    TAM UYGUN
                                </div>
                            ) : teacher.is_guidance ? (
                                <div className="absolute top-0 right-0 bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-tighter rounded-bl-lg">
                                    REHBERLİK
                                </div>
                            ) : isBest && (
                                <div className="absolute top-0 right-0 bg-primary px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-tighter rounded-bl-lg">
                                    EN UYGUN
                                </div>
                            )}

                            <div className="mb-5">
                                <div className="flex items-start justify-between gap-1 mb-2">
                                    <span className={cn(
                                        "leading-tight tracking-tight",
                                        teacher.is_super_match ? "font-bold text-lg text-amber-600" : teacher.is_guidance ? "font-bold text-lg text-emerald-500" : isBest ? "font-bold text-lg text-primary" : "font-semibold text-card-foreground"
                                    )}>
                                        {teacher.name}
                                    </span>
                                </div>
                                <div className="text-[11px] text-muted-foreground flex flex-wrap gap-1.5 mb-4">
                                    {teacher.reasons.map((r, i) => (
                                        <span
                                            key={i}
                                            className={cn(
                                                "px-2 py-0.5 rounded border transition-colors",
                                                teacher.is_super_match ? "bg-amber-500/10 border-amber-500/30 text-amber-700 font-medium" : teacher.is_guidance ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" : isBest ? "bg-primary/5 border-primary/20 text-primary/90" : "bg-muted border-border"
                                            )}
                                        >
                                            {r}
                                        </span>
                                    ))}
                                </div>

                                <div className="space-y-1.5 border-t border-border/30 pt-4">
                                    <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold">
                                        <span className="text-muted-foreground/60">Günlük Ders Yükü</span>
                                        <span className={cn(teacher.is_super_match ? "text-amber-600" : isBest ? "text-primary/90" : "text-foreground/80")}>{teacher.daily_load} Saat</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold">
                                        <span className="text-muted-foreground/60">Günlük Görevlendirme</span>
                                        <span className={cn(teacher.is_super_match ? "text-amber-600" : isBest ? "text-primary/90" : "text-foreground/80")}>{teacher.assignments_today} Ders</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => onSelectCandidate(teacher)}
                                className={cn(
                                    "w-full py-2.5 text-xs rounded-lg transition-all font-bold uppercase tracking-widest",
                                    teacher.is_super_match
                                        ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-500/20"
                                        : teacher.is_guidance
                                            ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/20"
                                            : isBest
                                                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
                                                : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-white"
                                )}
                            >
                                Seç ve Ata
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
