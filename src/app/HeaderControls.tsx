'use client';

import { Button } from "@/components/ui/button";
import { Exercises } from "./types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function HeaderControls({ selectedPart, clearDoneStatus, exercises, onSelectPart, customDate }: { selectedPart: ('back' | 'chest' | 'legs' | 'shoulders'), clearDoneStatus: () => void, exercises: Exercises, onSelectPart: (part: ('back' | 'chest' | 'legs' | 'shoulders')) => void, customDate: () => React.ReactNode }) {

    return (
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b supports-[backdrop-filter]:bg-background/60">
            <div className="flex justify-start items-center px-4 py-2 gap-4">
                <Select defaultValue="back" value={selectedPart} onValueChange={(value) => onSelectPart(value as ('back' | 'chest' | 'legs' | 'shoulders'))}>
                    <SelectTrigger>
                        <SelectValue placeholder="부위를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="back">등</SelectItem>
                        <SelectItem value="chest">가슴</SelectItem>
                        <SelectItem value="legs">하체</SelectItem>
                        <SelectItem value="shoulders">어깨</SelectItem>
                    </SelectContent>
                </Select>
                {customDate()}
                <div className="flex items-center justify-end w-full gap-2">
                    <Button onClick={saveSession}>
                        저장
                    </Button>
                    <Button onClick={clearDoneStatus}>
                        초기화
                    </Button>
                </div>
            </div>
        </header>
    );



    function saveSession() {
        const savedAt = new Date().toISOString();
        const savedExercises = exercises
            .map((ex) => {
                const doneSets = ex.sets
                    .map((set, i) => {
                        return {
                            set,
                            setNo: i + 1,
                        };
                    })
                    .filter(({ set }) => set.done);
                return {
                    ...ex,
                    sets: doneSets,
                };
            })
            .filter((ex) => ex.sets.length > 0)
            .map((ex) => {
                return {
                    id: ex.id,
                    name: ex.name,
                    sets: ex.sets.map(({ set, setNo }) => {
                        return {
                            setNo,
                            weight: set.weight,
                            reps: set.reps,
                        };
                    }),
                };
            });
        const payload = {
            savedAt,
            exercises: savedExercises,
        };
        if (savedExercises.length > 0) {
            const sessionKey = "workout.sessions.v1";
            const session = localStorage.getItem(sessionKey);
            try {
                if (session) {
                    const sessionData = JSON.parse(session);
                    sessionData.unshift(payload);
                    localStorage.setItem(sessionKey, JSON.stringify(sessionData));
                } else {
                    const sessionData = [];
                    sessionData.push(payload);
                    localStorage.setItem(sessionKey, JSON.stringify(sessionData));
                }
                alert("저장되었습니다");
            } catch (e) {
                console.error("올바르지 않은 JSON 데이터", e);
                localStorage.removeItem("workout.sessions.v1");
            }
        } else {
            alert("완료된 세트가 없어요");
            return;
        }
    }
}