'use client';

import { useState } from 'react';
import { Teacher } from '../../lib/types';
import { TeacherEditDialog } from './teacher-edit-dialog';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { AlertCircle, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TeacherListProps {
    initialTeachers: Teacher[];
}

export function TeacherList({ initialTeachers }: TeacherListProps) {
    const [filter, setFilter] = useState('');
    const [showOnlyMissing, setShowOnlyMissing] = useState(false);
    const router = useRouter();

    const missingInfoCount = initialTeachers.filter(t => !t.branch || !t.grades || t.grades.length === 0).length;

    const filteredTeachers = initialTeachers.filter(t => {
        const matchesFilter = t.name.toLowerCase().includes(filter.toLowerCase()) ||
            t.branch?.toLowerCase().includes(filter.toLowerCase());

        if (showOnlyMissing) {
            const isMissing = !t.branch || !t.grades || t.grades.length === 0;
            return matchesFilter && isMissing;
        }

        return matchesFilter;
    });

    const refreshData = () => {
        router.refresh();
    };

    return (
        <div className="space-y-6">
            {missingInfoCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-amber-900">Eksik Bilgi Mevcut</h4>
                        <p className="text-xs text-amber-700 mt-1">
                            {missingInfoCount} öğretmenin branş veya kademe bilgisi eksik. Substitution (yedek ders) sisteminin doğru çalışması için bu bilgileri tamamlamalısınız.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:max-w-md">
                    <Input
                        placeholder="Öğretmen ara..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="h-9"
                    />
                    <Button
                        variant={showOnlyMissing ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowOnlyMissing(!showOnlyMissing)}
                        className={cn("h-9 gap-2", showOnlyMissing && "bg-amber-600 hover:bg-amber-700")}
                    >
                        <Filter className="w-4 h-4" />
                        {showOnlyMissing ? "Tümünü Göster" : "Eksikleri Göster"}
                    </Button>
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                    Toplam: {filteredTeachers.length}
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ad Soyad</TableHead>
                            <TableHead>Kısa Kod</TableHead>
                            <TableHead>Branş</TableHead>
                            <TableHead>Kademeler</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTeachers.map((teacher) => {
                            const isMissing = !teacher.branch || !teacher.grades || teacher.grades.length === 0;
                            return (
                                <TableRow
                                    key={teacher.id}
                                    className={cn(isMissing && "bg-amber-50/50 hover:bg-amber-50")}
                                >
                                    <TableCell className="font-medium whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {teacher.name}
                                            {isMissing && <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                                        </div>
                                    </TableCell>
                                    <TableCell>{teacher.short}</TableCell>
                                    <TableCell>{teacher.branch || '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 flex-wrap">
                                            {teacher.grades?.map(g => (
                                                <Badge key={g} variant="secondary" className="text-xs">
                                                    {g}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <TeacherEditDialog teacher={teacher} onUpdate={refreshData} />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filteredTeachers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    Öğretmen bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
