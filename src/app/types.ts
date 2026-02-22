export type SetItem = { weight: number; reps: number; done: boolean };
export type Exercise = { id: string; name: string; sets: SetItem[] };
export type Exercises = Exercise[];
export type Part = "back" | "chest" | "legs" | "shoulders";
export type Session = { 
    id: string;
    savedAt: string;
    part: Part; 
    exercises: savedExercise
};
export type savedExercise = {
    id: string;
    name: string;
    sets: {
        setNo: number;
        weight: number;
        reps: number;
    }[];
};