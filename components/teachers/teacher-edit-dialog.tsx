'use client';

import { useState } from 'react';
import { Teacher } from '../../lib/types';
import { updateTeacher } from '../../app/actions/teachers';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TeacherEditDialogProps {
    teacher: Teacher;
    onUpdate: () => void;
}

const GRADES = ['ANAOKULU', 'İLKOKUL', 'ORTAOKUL', 'LİSE'];

export function TeacherEditDialog({ teacher, onUpdate }: TeacherEditDialogProps) {
    const [open, setOpen] = useState(false);
    const [branch, setBranch] = useState(teacher.branch || '');
    const [selectedGrades, setSelectedGrades] = useState<string[]>(teacher.grades || []);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateTeacher(teacher.id, branch, selectedGrades);
            setOpen(false);
            onUpdate();
        } catch (error) {
            console.error(error);
            alert('Güncelleme sırasında bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const toggleGrade = (grade: string) => {
        setSelectedGrades(prev =>
            prev.includes(grade)
                ? prev.filter(g => g !== grade)
                : [...prev, grade].sort()
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Düzenle</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Öğretmen Düzenle: {teacher.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="branch" className="text-right">
                            Branş
                        </Label>
                        <Input
                            id="branch"
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            className="col-span-3"
                            placeholder="Örn: Matematik"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right mt-2">
                            Kademeler
                        </Label>
                        <div className="col-span-3 flex flex-wrap gap-2">
                            {GRADES.map((grade) => (
                                <Button
                                    key={grade}
                                    type="button"
                                    variant={selectedGrades.includes(grade) ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleGrade(grade)}
                                    className="px-3"
                                >
                                    {grade}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                        İptal
                    </Button>
                    <Button type="submit" onClick={handleSave} disabled={loading}>
                        {loading ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
