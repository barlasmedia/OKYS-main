'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface DailyScheduleProps {
    schedule: any[];
    onSelectSlot: (card: any) => void;
    onUnlockSlot?: (subId: string) => void;
    selectedCardId?: string;
}

export function DailySchedule({ schedule, substitutions, onSelectSlot, onUnlockSlot, selectedCardId }: DailyScheduleProps & { substitutions?: any[] }) {
    if (!schedule || schedule.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500 border rounded-lg bg-gray-50">
                Bu tarih için ders programı bulunamadı veya öğretmenin dersi yok.
            </div>
        );
    }

    // Sort by period
    const sortedSchedule = [...schedule].sort((a, b) => a.period_index - b.period_index);

    return (
        <div className="space-y-3">
            <h3 className="font-semibold text-lg border-b border-border pb-2 text-foreground">Ders Programı</h3>
            <div className="grid gap-3">
                {sortedSchedule.map((card) => {
                    const subjectName = card.lesson?.subject?.name || 'Unknown Subject';
                    const classNames = card.lesson?.classes?.map((c: any) => c.class.name).join(', ') || '';

                    const substitution = substitutions?.find(s => s.period_index === card.period_index);
                    const isSubstituted = !!substitution;
                    const isSelected = selectedCardId === card.id;

                    return (
                        <div
                            key={card.id}
                            onClick={() => !isSubstituted && onSelectSlot(card)}
                            className={`
                p-4 border rounded-lg transition-all relative
                ${isSubstituted
                                    ? 'bg-muted/50 border-border cursor-not-allowed opacity-60'
                                    : 'bg-card cursor-pointer hover:border-primary/50 hover:bg-accent'}
                ${isSelected && !isSubstituted ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border'}
              `}
                        >
                            {isSubstituted && (
                                <div className="absolute top-2 right-2 flex items-center space-x-2 z-30">
                                    <div className="bg-purple-900/50 text-purple-200 text-[10px] px-2 py-0.5 rounded font-black border border-purple-800 uppercase tracking-tighter">
                                        Görevlendirildi ({substitution.status})
                                    </div>
                                    {onUnlockSlot && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onUnlockSlot(substitution.id);
                                            }}
                                            className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20 p-1 rounded transition-all"
                                            title="Kilidi Kaldır"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-between items-center relative z-20">
                                <div className="flex items-center space-x-3">
                                    <div className={cn(
                                        "min-w-10 h-10 px-2 rounded-lg flex items-center justify-center font-black text-sm transition-colors",
                                        isSubstituted
                                            ? "bg-muted text-muted-foreground border border-border"
                                            : isSelected
                                                ? "bg-primary text-white"
                                                : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
                                    )}>
                                        {card.period?.name || card.period_index}
                                    </div>
                                    <div>
                                        <span className={cn(
                                            "block font-bold leading-tight",
                                            isSelected ? "text-primary" : "text-card-foreground"
                                        )}>
                                            {subjectName}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">
                                            {card.period?.starttime && card.period?.endtime
                                                ? `${card.period.starttime} - ${card.period.endtime}`
                                                : (card.classroom?.room?.name || 'Oda Belirtilmemiş')}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
                                        {classNames}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
