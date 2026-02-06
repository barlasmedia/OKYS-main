'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    CalendarDays,
    Users,
    BookOpen,
    FileUp,
    Settings,
    UserCheck,
    FileText,
    Calculator,
    LayoutList,
    Briefcase
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Ders Doldurma', href: '/gorevlendirme', icon: UserCheck },
    { name: 'Ek Görevler', href: '/ek-gorevler', icon: Briefcase },
    { name: 'Puantaj', href: '/puantaj', icon: Calculator },
    { name: 'Ders Doldurma Raporları', href: '/gorevlendirme/rapor', icon: LayoutList },
    { name: 'Öğretmen Programları', href: '/teachers', icon: Users },
    { name: 'Öğretmen Listesi', href: '/ogretmenler', icon: Users },
    { name: 'Sınıf Programları', href: '/classes', icon: BookOpen },
    { name: 'Veri Yükle', href: '/upload', icon: FileUp },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r border-white/[0.05] bg-card/50 backdrop-blur-xl flex flex-col h-screen sticky top-0 z-50">
            <div className="p-6">
                <div className="flex items-center space-x-3 mb-10 group cursor-pointer">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                        O
                    </div>
                    <span className="text-xl font-display font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        OKYS
                    </span>
                </div>

                <nav className="space-y-1.5">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300",
                                    isActive
                                        ? "bg-primary/10 text-primary border-r-2 border-primary rounded-r-none"
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                )}
                            >
                                <item.icon className={cn(
                                    "w-5 h-5 transition-colors",
                                    isActive ? "text-primary" : "group-hover:text-foreground"
                                )} />
                                <span className="font-semibold text-sm tracking-wide">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6 space-y-1.5 border-t border-white/[0.05]">
                <Link
                    href="/kilavuz"
                    className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-300",
                        pathname === '/kilavuz' && "bg-white/5 text-foreground"
                    )}
                >
                    <BookOpen className="w-5 h-5" />
                    <span className="font-semibold text-sm">Kullanıcı Kılavuzu</span>
                </Link>
            </div>
        </aside>
    );
}
