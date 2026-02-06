'use client';

import React from 'react';
import { FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SubstitutionExportButtonProps {
    data: any[];
    periods: any[];
}

export default function SubstitutionExportButton({ data, periods }: SubstitutionExportButtonProps) {
    const handleExport = () => {
        if (!data || data.length === 0) return;

        // Transform data for Excel
        const worksheetData = data.map(sub => {
            const dateFormatted = new Date(sub.date).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });

            const subject = sub.subject_name || sub.lesson?.subject?.name || '-';
            const classes = sub.class_names || sub.lesson?.classes?.map((c: any) => c.class.name).join(', ') || '-';
            const origName = sub.original_teacher_name || sub.original?.name || '-';
            const subName = sub.substitute_teacher_name || sub.substitute?.name || '-';

            // Format time: "5. Ders"
            const periodIndex = sub.period_index;
            const periodLabel = `${periodIndex}. Ders`;

            // Find time range
            // Match period by index (assuming single school context or fetching matches)
            const periodDef = periods?.find(p => p.period_index === periodIndex);
            const timeRange = periodDef ? `${periodDef.starttime} - ${periodDef.endtime}` : '-';

            return {
                'Tarih': dateFormatted,
                'Ders Saati': periodLabel,
                'Saat Aralığı': timeRange,
                'Ders': subject,
                'Sınıf': classes,
                'Gelmeyen Öğretmen': origName,
                'Görevlendirilen Öğretmen': subName,
                'Durum': sub.status === 'approved' ? 'Onaylı' : sub.status,
                'Mazeret': sub.reason || ''
            };
        });

        const ws = XLSX.utils.json_to_sheet(worksheetData);

        // Column widths
        const colWidths = [
            { wch: 25 }, // Tarih
            { wch: 10 }, // Ders Saati (shorter)
            { wch: 15 }, // Saat Aralığı
            { wch: 20 }, // Ders
            { wch: 15 }, // Sınıf
            { wch: 25 }, // Gelmeyen
            { wch: 25 }, // Görevlendirilen
            { wch: 15 }, // Durum
            { wch: 30 }  // Mazeret
        ];
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Görevlendirmeler");

        // Generate filename with current date
        const today = new Date().toLocaleDateString('tr-TR').replace(/\./g, '_');
        XLSX.writeFile(wb, `Gorevlendirme_Raporu_${today}.xlsx`);
    };

    return (
        <button
            onClick={handleExport}
            disabled={!data || data.length === 0}
            className="bg-[#34D399] hover:bg-[#34D399]/90 text-white px-6 py-2.5 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-[#34D399]/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <FileDown className="w-4 h-4" />
            Excel İndir
        </button>
    );
}
