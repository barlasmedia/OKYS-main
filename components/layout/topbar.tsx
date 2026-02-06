'use client';

import { Bell, Search, User, Clock, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Topbar() {
    const [date, setDate] = useState<Date | null>(null);

    useEffect(() => {
        setDate(new Date());
        const timer = setInterval(() => setDate(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Format options for Turkish date and time
    const timeString = date?.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const dateString = date?.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });

    return (
        <header className="h-20 border-b border-white/[0.05] bg-background/50 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-40">
            {/* Search Bar */}
            <div className="flex items-center space-x-4 bg-white/5 border border-white/[0.05] rounded-2xl px-4 py-2.5 w-96 transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:bg-white/10 group">
                <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Sistemde ara..."
                    className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/50 text-foreground font-medium"
                />
            </div>

            <div className="flex items-center space-x-6">
                {/* Date & Time Display */}
                <div className="hidden lg:flex items-center space-x-4 bg-white/5 border border-white/5 rounded-2xl px-4 py-2">
                    <div className="flex items-center space-x-2 border-r border-white/10 pr-4">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="font-display font-black text-xl text-white tracking-widest tabular-nums">
                            {timeString || '...'}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-[#E16815]" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            {dateString || '...'}
                        </span>
                    </div>
                </div>

                <div className="h-8 w-px bg-white/10 hidden lg:block" />

                <button className="relative p-2.5 rounded-xl bg-white/5 text-muted-foreground hover:text-primary hover:bg-white/10 transition-all">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background" />
                </button>

                <div className="h-8 w-px bg-white/10" />

                <div className="flex items-center space-x-4 group cursor-pointer">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Yönetici Paneli</p>
                        <p className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-widest">KAPLAN OKULLARI</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/[0.1] flex items-center justify-center shadow-lg group-hover:border-primary/30 transition-all">
                        <User className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                </div>
            </div>
        </header>
    );
}
