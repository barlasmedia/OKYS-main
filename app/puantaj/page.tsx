'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { Card } from '../../components/ui/card';
import {
    Coins,
    Calendar as CalendarIcon,
    ArrowUpCircle,
    ArrowDownCircle,
    Save,
    Calculator,
    User,
    FileDown
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table-components';
import { getPayrollData, updatePayrollSettings, TeacherPayrollSummary, PayrollSettings } from '../actions/payrollActions';
import { cn } from '../../lib/utils';
import * as XLSX from 'xlsx';

const MONTHS = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export default function PuantajPage() {
    const schoolId = '00000000-0000-0000-0000-000000000000';
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [fees, setFees] = useState<PayrollSettings>({
        substitution_fee: 170,
        duty_fee: 200,
        evening_study_fee: 400,
        saturday_study_fee: 1000
    });
    const [data, setData] = useState<TeacherPayrollSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        const result = await getPayrollData(schoolId, month, year);
        if (result.success && result.data) {
            setData(result.data.results);
            setFees(result.data.settings);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [month, year]);

    const handleSaveSettings = async () => {
        setIsSaving(true);
        const result = await updatePayrollSettings(schoolId, fees);
        if (result.success) {
            fetchData();
        }
        setIsSaving(false);
    };

    const totals = data.reduce((acc, current) => {
        acc.filled += current.total_sub_paid;
        acc.missed += current.total_sub_missed;
        acc.amount += current.total_amount;
        return acc;
    }, { filled: 0, missed: 0, amount: 0 });

    const handleExport = () => {
        const worksheetData = data.map(teacher => {
            // Totals Calculation (Iterate activities directly to catch ALL, even overlaps)
            let subPaidCount = 0;
            let subPaidAmount = 0;
            let deductionCount = 0;
            let deductionAmount = 0;
            let dutyCount = 0;
            let dutyAmount = 0;
            let eveningCount = 0;
            let eveningAmount = 0;
            let saturdayCount = 0;
            let saturdayAmount = 0;

            teacher.activities.forEach(act => {
                if (act.type === 'Ek Ders (+)') {
                    subPaidCount++;
                    subPaidAmount += act.amount;
                } else if (act.type === 'Kesinti (-)') {
                    deductionCount++;
                    deductionAmount += act.amount;
                } else if (act.type === 'Nöbet') {
                    dutyCount++;
                    dutyAmount += act.amount;
                } else if (act.type === 'Akşam Etütü') {
                    eveningCount++;
                    eveningAmount += act.amount;
                } else if (act.type === 'Cumartesi Etütü') {
                    saturdayCount++;
                    saturdayAmount += act.amount;
                }
            });

            // Return Row with ONLY the requested summary columns
            return {
                'Öğretmen': teacher.teacher_name,
                'Ders Doldurma (Adet)': subPaidCount,
                'Ders Doldurma (TL)': subPaidAmount,
                'Nöbet (Adet)': dutyCount,
                'Nöbet (TL)': dutyAmount,
                'Akşam Etütü (Adet)': eveningCount,
                'Akşam Etütü (TL)': eveningAmount,
                'C.tesi Etütü (Adet)': saturdayCount,
                'C.tesi Etütü (TL)': saturdayAmount,
                'Kesinti (Adet)': deductionCount,
                'Kesinti (TL)': deductionAmount,
                'TOPLAM ÖDEME (TL)': subPaidAmount + dutyAmount + eveningAmount + saturdayAmount,
                'TOPLAM KESİNTİ (TL)': Math.abs(deductionAmount),
                'TOPLAM NET (TL)': teacher.total_amount
            };
        });

        const ws = XLSX.utils.json_to_sheet(worksheetData);

        // Auto-width adjustment for summary columns
        const colWidths = [
            { wch: 25 }, // Name
            { wch: 20 }, { wch: 20 }, // Sub
            { wch: 15 }, { wch: 15 }, // Duty
            { wch: 20 }, { wch: 20 }, // Evening
            { wch: 20 }, { wch: 20 }, // Saturday
            { wch: 15 }, { wch: 15 }, // Deduction
            { wch: 20 }, { wch: 20 }, // Payment, Deduction
            { wch: 18 } // Net
        ];
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Puantaj");
        XLSX.writeFile(wb, `Puantaj_${MONTHS[month - 1]}_${year}.xlsx`);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
            {/* Header Area */}
            <div className="flex flex-col space-y-8 pb-8 border-b border-white/5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-display font-black text-white tracking-tight uppercase italic">PUANTAJ HESABI</h1>
                        <p className="text-muted-foreground font-medium">Birim ders ücreti üzerinden ek ders ve kesinti hesaplamaları.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleExport}
                            disabled={isLoading || data.length === 0}
                            className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FileDown className="w-4 h-4" />
                            EXCEL İNDİR
                        </button>

                        <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
                            <CalendarIcon className="w-4 h-4 text-[#E16815]" />
                            <select
                                value={month}
                                onChange={(e) => setMonth(parseInt(e.target.value))}
                                className="bg-transparent border-none outline-none text-sm font-bold text-white cursor-pointer"
                            >
                                {MONTHS.map((m, i) => (
                                    <option key={m} value={i + 1} className="bg-zinc-900">{m}</option>
                                ))}
                            </select>
                            <select
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                className="bg-transparent border-none outline-none text-sm font-bold text-white cursor-pointer"
                            >
                                {[2024, 2025, 2026].map(y => (
                                    <option key={y} value={y} className="bg-zinc-900">{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Ders Doldurma', key: 'substitution_fee', color: 'text-amber-500' },
                        { label: 'Nöbet', key: 'duty_fee', color: 'text-blue-500' },
                        { label: 'Akşam Etütü', key: 'evening_study_fee', color: 'text-purple-500' },
                        { label: 'Cumartesi Etütü', key: 'saturday_study_fee', color: 'text-emerald-500' }
                    ].map((f) => (
                        <div key={f.key} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col space-y-2">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{f.label}</span>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="number"
                                    value={fees[f.key as keyof PayrollSettings]}
                                    onChange={(e) => setFees({ ...fees, [f.key]: parseFloat(e.target.value) })}
                                    className={cn("w-full bg-transparent border-none outline-none text-xl font-display font-black focus:text-primary transition-colors", f.color)}
                                />
                                <span className="text-sm font-bold text-muted-foreground">₺</span>
                            </div>
                        </div>
                    ))}
                    <div className="lg:col-span-4 flex justify-end">
                        <button
                            onClick={handleSaveSettings}
                            disabled={isSaving}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 shadow-xl shadow-primary/10"
                        >
                            {isSaving ? 'Kaydediliyor...' : <><Save className="w-4 h-4" /> AYARLARI GÜNCELLE</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex flex-col space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                            <ArrowUpCircle className="w-6 h-6 text-emerald-500" />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">TOPLAM ÖDEME (HAK EDİŞ)</span>
                    </div>
                    <div>
                        <p className="text-3xl font-display font-black text-white">
                            {data.reduce((sum, t) => {
                                let teacherPayment = 0;
                                t.activities.forEach(act => { if (act.amount > 0) teacherPayment += act.amount; });
                                return sum + teacherPayment;
                            }, 0)} <span className="text-sm font-medium text-muted-foreground italic">TL</span>
                        </p>
                        <p className="text-xs text-emerald-500 font-bold">Tüm branş ve ek görevler dahil</p>
                    </div>
                </Card>

                <Card className="flex flex-col space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                            <ArrowDownCircle className="w-6 h-6 text-rose-500" />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">TOPLAM KESİNTİ (BORÇ)</span>
                    </div>
                    <div>
                        <p className="text-3xl font-display font-black text-white">
                            {Math.abs(data.reduce((sum, t) => {
                                let teacherDeduction = 0;
                                t.activities.forEach(act => { if (act.amount < 0) teacherDeduction += act.amount; });
                                return sum + teacherDeduction;
                            }, 0))} <span className="text-sm font-medium text-muted-foreground italic">TL</span>
                        </p>
                        <p className="text-xs text-rose-500 font-bold">Gelmeyen dersler baz alınır</p>
                    </div>
                </Card>

                <Card className="flex flex-col space-y-4 bg-primary/5 border-primary/20 shadow-2xl shadow-primary/5">
                    <div className="flex justify-between items-start">
                        <div className="p-3 rounded-2xl bg-primary/20 border border-primary/30">
                            <Calculator className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">NET PUANTAJ</span>
                    </div>
                    <div>
                        <p className="text-3xl font-display font-black text-primary">{totals.amount} TL</p>
                        <p className="text-xs text-muted-foreground font-medium">{MONTHS[month - 1]} ayı baz alınmıştır.</p>
                    </div>
                </Card>
            </div>

            {/* Teacher Details Table */}
            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <h2 className="text-xs font-black text-white uppercase tracking-[0.4em] bg-white/5 px-6 py-2 rounded-full border border-white/10">
                        ÖĞRETMEN DETAYLARI
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                </div>

                {isLoading ? (
                    <div className="glass-card py-20 flex flex-col items-center justify-center space-y-4">
                        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-muted-foreground font-bold text-sm">Veriler Hesaplanıyor...</p>
                    </div>
                ) : data.length > 0 ? (
                    <div className="space-y-6">
                        {data.map((teacher) => (
                            <Card key={teacher.teacher_id} className="p-0 overflow-hidden border-white/5 bg-white/[0.01]">
                                <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.02] p-6 rounded-t-2xl">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
                                            <User className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">{teacher.teacher_name}</h3>
                                        </div>
                                    </div>
                                    <div className="text-right pl-4 border-l border-white/5">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">TOPLAM HAK EDİŞ</p>
                                        <p className={cn(
                                            "text-3xl font-display font-black",
                                            teacher.total_amount > 0 ? "text-emerald-500" : teacher.total_amount < 0 ? "text-rose-500" : "text-white"
                                        )}>
                                            {teacher.total_amount} <span className="text-sm font-bold opacity-50 ml-1">TL</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-white/5">
                                    <Table>
                                        <TableHeader className="bg-transparent backdrop-blur-none border-b border-white/5">
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="py-3">Tarih</TableHead>
                                                <TableHead className="py-3">Açıklama / Görev</TableHead>
                                                <TableHead className="py-3 text-right">Tutar</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {teacher.activities.map((activity, idx) => (
                                                <TableRow key={idx} className="bg-transparent border-white/[0.02]">
                                                    <TableCell className="py-4 font-bold text-muted-foreground/80">
                                                        {new Date(activity.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' })}
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                                                            activity.type === 'Ek Ders (+)' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                                activity.type === 'Kesinti (-)' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                                                    activity.type === 'Nöbet' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                                                        activity.type === 'Akşam Etütü' ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                                                                            "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                        )}>
                                                            {activity.type}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-4 text-right font-black text-white">
                                                        <span className={activity.amount > 0 ? "text-emerald-500" : activity.amount < 0 ? "text-rose-500" : ""}>
                                                            {activity.amount > 0 ? `+${activity.amount}` : activity.amount} TL
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                            <Calculator className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-white uppercase">Veri Bulunamadı</h3>
                            <p className="text-muted-foreground text-sm font-medium">Bu dönem için henüz onaylanmış bir görevlendirme kaydı mevcut değil.</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
