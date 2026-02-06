'use client';

import React from 'react';
import Link from 'next/link';
import {
    LayoutDashboard,
    UserCheck,
    Briefcase,
    Calculator,
    LayoutList,
    Users,
    BookOpen,
    CalendarDays,
    FileUp,
    ArrowRight,
    HelpCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function GuidePage() {
    const modules = [
        {
            title: 'Kontrol Paneli (Dashboard)',
            description: 'Sistemin genel durumu, özet istatistikler ve hızlı erişim menüleri.',
            icon: LayoutDashboard,
            href: '/',
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            steps: [
                'Günlük ders doldurma özeti',
                'Öğretmen ve sınıf sayıları',
                'Hızlı işlem kısayolları'
            ]
        },
        {
            title: 'Ders Doldurma',
            description: 'Günlük öğretmen devamsızlıklarını yönetme ve boş derslere görevlendirme yapma.',
            icon: UserCheck,
            href: '/gorevlendirme',
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            steps: [
                'Gelmeyen öğretmeni seçin',
                'İlgili ders saati için müsait öğretmenleri görüntüleyin',
                'Görevlendirmeyi onaylayın'
            ]
        },
        {
            title: 'Ek Görevler',
            description: 'Nöbet, etüt ve diğer ek görevlerin tanımlanması.',
            icon: Briefcase,
            href: '/ek-gorevler',
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20',
            steps: [
                'Görev türünü seçin (Nöbet, Etüt vb.)',
                'Öğretmen ve tarih seçimi yapın',
                'Görevi sisteme kaydedin'
            ]
        },
        {
            title: 'Puantaj',
            description: 'Aylık hak ediş hesaplamaları, kesintiler ve Excel raporları.',
            icon: Calculator,
            href: '/puantaj',
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            steps: [
                'Ay ve yıl seçimi yapın',
                'Birim ücretleri güncelleyin',
                'Öğretmen bazlı detayları inceleyin ve Excel indirin'
            ]
        },
        {
            title: 'Ders Doldurma Raporları',
            description: 'Geçmişe dönük tüm görevlendirme işlemlerinin detaylı listesi.',
            icon: LayoutList,
            href: '/gorevlendirme/rapor',
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/20',
            steps: [
                'Tarih bazlı listeleme',
                'Detaylı arama yapma',
                'Excel formatında rapor indirme'
            ]
        },
        {
            title: 'Öğretmen Programları',
            description: 'Okuldaki tüm öğretmenlerin ders programlarının görüntülenmesi.',
            icon: Users,
            href: '/teachers',
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20',
            steps: [
                'Öğretmen listesinden seçim yapın',
                'Haftalık ders programını inceleyin'
            ]
        },
        {
            title: 'Sınıf Programları',
            description: 'Sınıf bazlı ders programlarının görüntülenmesi.',
            icon: BookOpen,
            href: '/classes',
            color: 'text-cyan-500',
            bg: 'bg-cyan-500/10',
            border: 'border-cyan-500/20',
            steps: [
                'Sınıf seviyesi ve şube seçimi',
                'Sınıfın haftalık programını görüntüleme'
            ]
        },
        {
            title: 'Veri Yükle',
            description: 'aSc Timetables XML verilerinin sisteme aktarılması.',
            icon: FileUp,
            href: '/upload',
            color: 'text-slate-500',
            bg: 'bg-slate-500/10',
            border: 'border-slate-500/20',
            steps: [
                'XML dosyasını seçin',
                'Yükleme işlemini başlatın',
                'Veri aktarım durumunu takip edin'
            ]
        }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col space-y-4 pb-8 border-b border-white/5">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/10">
                        <HelpCircle className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-display font-black text-white tracking-tight uppercase">KULLANICI KILAVUZU</h1>
                        <p className="text-muted-foreground font-medium text-lg">Modüllerin kullanımı ve özellikleri hakkında detaylı bilgiler.</p>
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => (
                    <div
                        key={module.title}
                        className="group relative bg-card/30 hover:bg-card/50 border border-white/5 hover:border-white/10 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/20 flex flex-col"
                    >
                        {/* Module Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors",
                                module.bg,
                                module.border
                            )}>
                                <module.icon className={cn("w-6 h-6", module.color)} />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-3 flex-1">
                            <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                                {module.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {module.description}
                            </p>

                            {/* Steps */}
                            <div className="pt-4 space-y-2">
                                <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">NASIL KULLANILIR?</span>
                                <ul className="space-y-1.5">
                                    {module.steps.map((step, idx) => (
                                        <li key={idx} className="flex items-start space-x-2 text-xs font-medium text-muted-foreground/80">
                                            <span className={cn("w-1 h-1 rounded-full mt-1.5", module.color.replace('text-', 'bg-'))} />
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Action */}
                        <div className="pt-6 mt-6 border-t border-white/5">
                            <Link
                                href={module.href}
                                className={cn(
                                    "flex items-center justify-between w-full px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors group/btn",
                                    module.color
                                )}
                            >
                                <span className="font-bold text-sm">Modüle Git</span>
                                <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
