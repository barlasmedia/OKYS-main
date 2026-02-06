"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { ScrollArea } from "../ui/scroll-area"
import { Users, BookOpen, BarChart } from "lucide-react"
import { cn } from "../../lib/utils"
import { SubstituteCandidate } from "../../lib/types"

interface SubstitutionListProps {
    candidates: SubstituteCandidate[]
    loading: boolean
    onAssign?: (candidate: SubstituteCandidate) => void
    assignedTeacherIds?: string[]
}

export function SubstitutionList({ candidates, loading, onAssign, assignedTeacherIds = [] }: SubstitutionListProps) {
    if (loading) {
        return <div className="p-4 text-center text-zinc-500">Müsait öğretmenler aranıyor...</div>
    }

    if (candidates.length === 0) {
        return <div className="p-4 text-center text-zinc-500">Uygun öğretmen bulunamadı.</div>
    }

    return (
        <Card className="h-full border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-500" />
                    Önerilen Öğretmenler
                    <Badge variant="secondary" className="ml-auto">
                        {candidates.length} Kişi
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {candidates.map((candidate) => {
                        const isAssigned = assignedTeacherIds.includes(candidate.teacher.id)

                        return (
                            <div
                                key={candidate.teacher.id}
                                className={cn(
                                    "group flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer",
                                    isAssigned
                                        ? "bg-zinc-900/20 border-zinc-800 opacity-50 cursor-not-allowed grayscale"
                                        : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                                )}
                                onClick={() => {
                                    if (!isAssigned && onAssign) {
                                        onAssign(candidate)
                                    }
                                }}
                            >
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="flex items-center justify-between">
                                        <span className={cn("font-medium", isAssigned ? "text-zinc-500" : "text-zinc-200")}>
                                            {candidate.teacher.name}
                                            {candidate.teacher.branch && (
                                                <span className="ml-2 py-0.5 px-1.5 rounded bg-zinc-800 text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
                                                    {candidate.teacher.branch}
                                                </span>
                                            )}
                                            {isAssigned && <span className="ml-2 text-xs italic opacity-75">(Atandı)</span>}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        {candidate.isClassTeacher ? (
                                            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                                                <BookOpen className="w-3 h-3" />
                                                Sınıfın Öğretmeni
                                            </span>
                                        ) : (
                                            <div className="flex gap-1">
                                                {candidate.teacher.grades?.map(g => (
                                                    <Badge key={g} variant="outline" className="text-[9px] h-4 px-1 border-zinc-700 text-zinc-500">
                                                        {g}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="text-xs text-zinc-500">Günlük Yük</span>
                                        <div className="flex items-center gap-1.5 text-zinc-300">
                                            <BarChart className="w-3.5 h-3.5" />
                                            <span className="font-bold">{candidate.dailyLoad}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card >
    )
}
