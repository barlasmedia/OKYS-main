"use client"

import * as React from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Calendar as CalendarIcon, Loader2, Search } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Calendar } from "../ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../ui/popover"
import { TeacherCombobox } from "./teacher-combobox"
import { SubstitutionList } from "./substitution-list"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Teacher, ScheduleSlot, SubstituteCandidate, Assignment } from "../../lib/types" // Use shared types
import { getTeacherSchedule, findSubstitutes } from "../../app/actions/substitutions" // Import server actions
import { AssignmentTable } from "./assignment-table"

interface SubstitutionManagerProps {
    initialTeachers: Teacher[]
}

export function SubstitutionManager({ initialTeachers }: SubstitutionManagerProps) {
    const [date, setDate] = React.useState<Date>(new Date())
    const [selectedTeacherId, setSelectedTeacherId] = React.useState<string | null>(null)
    const [schedule, setSchedule] = React.useState<ScheduleSlot[]>([])
    const [loadingSchedule, setLoadingSchedule] = React.useState(false)

    // Substitute Search State
    const [selectedSlot, setSelectedSlot] = React.useState<ScheduleSlot | null>(null)
    const [candidates, setCandidates] = React.useState<SubstituteCandidate[]>([])
    const [loadingCandidates, setLoadingCandidates] = React.useState(false)

    // Assignments State
    const [assignments, setAssignments] = React.useState<Assignment[]>([])

    // Fetch Schedule Effect
    React.useEffect(() => {
        if (!selectedTeacherId || !date) {
            setSchedule([])
            setSelectedSlot(null) // Reset selection
            setCandidates([])
            return
        }

        async function fetchSchedule() {
            setLoadingSchedule(true)
            try {
                const res = await getTeacherSchedule(selectedTeacherId!, date)
                setSchedule(res)
            } catch (error) {
                console.error("Failed to fetch schedule", error)
            } finally {
                setLoadingSchedule(false)
            }
        }

        fetchSchedule()
    }, [selectedTeacherId, date])

    const handleSlotClick = async (slot: ScheduleSlot) => {
        setSelectedSlot(slot)
        setLoadingCandidates(true)
        try {
            const res = await findSubstitutes(slot.period, date, slot.classIds) // Pass classIds
            setCandidates(res)
        } catch (error) {
            console.error("Failed to find substitutes", error)
        } finally {
            setLoadingCandidates(false)
        }
    }

    const handleAssign = (candidate: SubstituteCandidate) => {
        if (!selectedSlot || !selectedTeacherId) return

        const newAssignment: Assignment = {
            id: crypto.randomUUID(),
            slot: selectedSlot,
            originalTeacherId: selectedTeacherId,
            substituteTeacher: candidate
        }

        setAssignments(prev => [...prev, newAssignment])
        setSelectedSlot(null) // Optional: Deselect slot after assignment
        setCandidates([]) // Optional: Clear candidates or keep them? Let's clear for now
    }

    const handleCancelAssignment = (id: string) => {
        setAssignments(prev => prev.filter(a => a.id !== id))
    }

    // Filter out assignments for the current view if needed, or just pass a list of assigned IDs to the list
    const assignedTeacherIds = assignments
        .filter(a =>
            a.slot.period === selectedSlot?.period &&
            a.slot.lessonId === selectedSlot?.lessonId &&
            a.originalTeacherId === selectedTeacherId
        )
        .map(a => a.substituteTeacher.teacher.id)

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column: Controls & Schedule */}
            <div className="space-y-6">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">Ders Seçimi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Tarih</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP", { locale: tr }) : <span>Tarih seçiniz</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={(d) => d && setDate(d)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Gelmeyen Öğretmen</label>
                            <TeacherCombobox
                                teachers={initialTeachers}
                                selectedTeacherId={selectedTeacherId}
                                onSelect={setSelectedTeacherId}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Schedule Display */}
                {selectedTeacherId && (
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">Ders Programı</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loadingSchedule ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                                </div>
                            ) : schedule.length > 0 ? (
                                <div className="grid gap-2">
                                    {schedule.map((slot) => {
                                        const isAssigned = assignments.some(a =>
                                            a.slot.period === slot.period &&
                                            a.slot.lessonId === slot.lessonId &&
                                            a.originalTeacherId === selectedTeacherId
                                        )

                                        return (
                                            <div
                                                key={`${slot.period}-${slot.lessonId}`}
                                                onClick={() => !isAssigned && handleSlotClick(slot)}
                                                className={cn(
                                                    "p-3 rounded-lg border transition-all",
                                                    isAssigned
                                                        ? "bg-emerald-900/10 border-emerald-900/30 cursor-default"
                                                        : "bg-transparent border-zinc-800 cursor-pointer hover:bg-zinc-800/50",
                                                    selectedSlot === slot && "bg-blue-500/10 border-blue-500/50"
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <span className={cn(
                                                            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                                                            isAssigned ? "bg-emerald-900/30 text-emerald-400" : "bg-zinc-800 text-zinc-300"
                                                        )}>
                                                            {slot.period}
                                                        </span>
                                                        <div>
                                                            <p className={cn("font-medium", isAssigned ? "text-emerald-300" : "text-zinc-200")}>
                                                                {slot.subjectName}
                                                            </p>
                                                            <p className="text-sm text-zinc-500">{slot.className}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className={cn(
                                                            isAssigned ? "text-emerald-500 hover:text-emerald-500 hover:bg-transparent cursor-default" : "text-zinc-400"
                                                        )}
                                                        disabled={isAssigned}
                                                    >
                                                        {isAssigned ? "Dolu" : "Doldur"}
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-center text-zinc-500 py-8">Bu tarihte ders bulunamadı.</p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Right Column: Candidates */}
            <div className="space-y-6">
                {selectedSlot ? (
                    <Card className="bg-zinc-900 border-zinc-800 h-full">
                        <CardHeader>
                            <CardTitle className="text-white">
                                {selectedSlot.period}. Ders İçin Adaylar
                                <span className="block text-sm font-normal text-zinc-500 mt-1">
                                    {selectedSlot.className} - {selectedSlot.subjectName}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SubstitutionList
                                candidates={candidates}
                                loading={loadingCandidates}
                                onAssign={handleAssign}
                                assignedTeacherIds={assignedTeacherIds}
                            />
                        </CardContent>
                    </Card>
                ) : assignments.length > 0 ? (
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">Yapılan Atamalar</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AssignmentTable
                                assignments={assignments}
                                onCancel={handleCancelAssignment}
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl p-12 text-zinc-600">
                        <div className="text-center">
                            <Search className="w-10 h-10 mx-auto mb-4 opacity-50" />
                            <p>Ders seçimi yapıldığında adaylar burada listelenecektir.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
