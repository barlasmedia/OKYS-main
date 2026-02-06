"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Button } from "../ui/button"
import { Trash2 } from "lucide-react"
import { ScheduleSlot, SubstituteCandidate } from "../../lib/types"

export interface Assignment {
    id: string
    slot: ScheduleSlot
    originalTeacherId: string
    substituteTeacher: SubstituteCandidate
}

interface AssignmentTableProps {
    assignments: Assignment[]
    onCancel: (id: string) => void
}

export function AssignmentTable({ assignments, onCancel }: AssignmentTableProps) {
    if (assignments.length === 0) return null

    return (
        <div className="rounded-md border border-zinc-800 bg-zinc-900/50">
            <Table>
                <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                        <TableHead className="text-zinc-400">Ders Saati</TableHead>
                        <TableHead className="text-zinc-400">Sınıf</TableHead>
                        <TableHead className="text-zinc-400">Ders</TableHead>
                        <TableHead className="text-zinc-400">Nöbetçi/Yerine Gelen</TableHead>
                        <TableHead className="text-right text-zinc-400">İşlem</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {assignments.map((assignment) => (
                        <TableRow key={assignment.id} className="border-zinc-800 hover:bg-zinc-800/50">
                            <TableCell className="font-medium text-zinc-200">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">
                                    {assignment.slot.period}
                                </span>
                            </TableCell>
                            <TableCell className="text-zinc-300">{assignment.slot.className}</TableCell>
                            <TableCell className="text-zinc-300">{assignment.slot.subjectName}</TableCell>
                            <TableCell className="text-emerald-400 font-medium">
                                {assignment.substituteTeacher.teacher.name}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onCancel(assignment.id)}
                                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
