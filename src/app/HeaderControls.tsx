'use client';

import { Button } from "@/components/ui/button";
import type { Exercises, Session, SavedExercise } from "./types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function HeaderControls({ onSavedHistory, selectedPart, clearDoneStatus, exercises, onSelectPart, date }: { onSavedHistory: () => void, selectedPart: ('back' | 'chest' | 'legs' | 'shoulders'), clearDoneStatus: () => void, exercises: Exercises, onSelectPart: (part: ('back' | 'chest' | 'legs' | 'shoulders')) => void, date: string}){

    return (
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b supports-[backdrop-filter]:bg-background/60">
            <div className="flex justify-start flex-wrap items-center px-4 py-2 gap-2">
                <Select value={selectedPart} onValueChange={(value) => onSelectPart(value as ('back' | 'chest' | 'legs' | 'shoulders'))}>
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
                <span className="text-xs text-muted-foreground">{date}</span>
                <div className="ml-auto flex items-center justify-end gap-0.5">
                    <Button onClick={saveSession}>
                        저장
                    </Button>
                    <Button onClick={clearDoneStatus}>
                        초기화
                    </Button>
                </div>
                </div>
        </header>
    )

    async function saveSession() {
        const savedAt = new Date().toISOString();
        const dayKey = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).slice(2, 12 );
        const savedExercises: SavedExercise[] = exercises
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
            id: `${dayKey}_${selectedPart}`,
            saved_at: savedAt,
            part: selectedPart,            
            exercises: savedExercises,
        };
        if (savedExercises.length > 0) {
            const sessionKey = "workout.sessions.v1";
            const session = localStorage.getItem(sessionKey);
            let sessionData: Session[] = [];
            try {
                if (session) {
                    console.log(session);
                    sessionData = JSON.parse(session);
                    // session이 깨졌거나 객체인 경우 배열로 변환
                    if(!Array.isArray(sessionData)) {
                        sessionData = [];
                    }
                }
            } catch (e) {
                console.error("올바르지 않은 JSON 데이터", e);
                // 깨진 세션을 비워두지 않고 새로운 세션을 저장
                localStorage.setItem(sessionKey, JSON.stringify([payload]));
                return;
            }
            // 기존 세션에서 현재 세션을 제외한 나머지 세션을 필터링
            const filtered = sessionData.filter((s => s.id !== payload.id));
            const nextSessions = [payload, ...filtered];
            // 새로운 세션을 저장
            localStorage.setItem(sessionKey, JSON.stringify(nextSessions));
            await fetch("/api/notion/write", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            console.log(nextSessions);
            alert("저장되었습니다");
            onSavedHistory();
                        

        } else {
            alert("완료된 세트가 없어요");
            return;
        }
    }
}