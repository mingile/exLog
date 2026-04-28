export type SetItem = { weight: number; reps: number; done: boolean, synced: boolean, equipment: string, memo: string, unit: "kg" | "lb", rpe: number | null };
export type Exercise = { id: string; name: string; sets: SetItem[]; part?: string; exercisePageId?: string };
export type Exercises = Exercise[];
export type Part = "back" | "chest" | "legs" | "shoulders";
export type Session = { 
    id: string;
    savedAt: string;
    sessionName?: string;
    part?: Part;
    exercises: (SavedExercise & { part?: string })[];
};
export type SavedExercise = {
    id: string;
    name: string;
    exercisePageId?: string;
    sets: {
        setNo: number;
        weight: number;
        reps: number;
        rpe: number | null;
        memo: string;
        equipment: string;
    }[];
};

export type SessionMetadata = {
    sessionId: string;
    sessionName: string;
    startedAt: string;
};

export type SessionDraft = {
    session: SessionMetadata;
    exercises: Exercises;
};

export type LibraryCategory = "등" | "가슴" | "하체" | "어깨" | "팔" | "코어" | "유산소" | "기타";

export type LibraryExercise = {
    id: string;
    name: string;
    category: LibraryCategory;
    equipment?: string;
    primaryEffect?: string;
    notionPageId?: string;
};

export type LibraryState = 
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "empty" }
    | { status: "success"; exercises: LibraryExercise[]; categories: LibraryCategory[] };