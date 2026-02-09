export interface Teacher {
    id: string;
    name: string;
    short: string;
    branch?: string;
    grades?: string[];
}

export interface Class {
    id: string;
    name: string;
}

export interface Lesson {
    id: string;
    subjectid: string;
    classids: string; // Comma separated IDs
    teacherids: string; // Comma separated IDs
    periodsperweek: number;
}

export interface Card {
    lessonid: string;
    classroomids: string;
    period: string; // "1", "2", etc.
    days: string; // "10000"
    weeks: string;
    terms: string;
}

export interface Subject {
    id: string;
    name: string;
}

// Derived types for UI
export interface ScheduleSlot {
    period: number;
    lessonId: string;
    subjectName: string;
    className: string;
    classIds: string[];
    card: Card;
    teacherIds: string[];
}

export interface SubstituteCandidate {
    teacher: Teacher;
    isClassTeacher: boolean;
    dailyLoad: number;
}

export interface Assignment {
    id: string
    slot: ScheduleSlot
    originalTeacherId: string
    substituteTeacher: SubstituteCandidate
    excuseType: 'raporlu' | 'idari_izinli_gorevli' | 'gelmedi'
}
