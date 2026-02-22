'use client';

import { Button } from "@/components/ui/button";
import { Exercises, Session } from "./types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { savedExercise } from "./types";

export function HeaderControls({ onSavedHistory, selectedPart, clearDoneStatus, exercises, onSelectPart, date, displayUnit, setDisplayUnit, showHistory, setShowHistory }: { onSavedHistory: () => void, selectedPart: ('back' | 'chest' | 'legs' | 'shoulders'), clearDoneStatus: () => void, exercises: Exercises, onSelectPart: (part: ('back' | 'chest' | 'legs' | 'shoulders')) => void, date: string, displayUnit: "kg" | "lb", setDisplayUnit: (unit: "kg" | "lb") => void, showHistory: boolean, setShowHistory: (show: boolean) => void}){

    return (
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b supports-[backdrop-filter]:bg-background/60">
            <div className="flex justify-start items-center px-4 py-2 gap-4">
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
                <span className="text-sm text-muted-foreground w-34">{date}</span>
                <div className="flex gap-1">
                <Button className="px-3" onClick={() => setDisplayUnit(displayUnit === "kg" ? "lb" : "kg")}>
                    단위변환
                </Button>
                <Button className="px-3" onClick={() => setShowHistory(!showHistory)}>
                    지난기록
                </Button>
                </div>
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
    )

    function saveSession() {
        const savedAt = new Date().toISOString();
        const dayKey = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).slice(2, 12 );
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
        const payload: Session = {
            id: `${dayKey}_${selectedPart}`,
            savedAt,
            part: selectedPart,            
            exercises: savedExercises as savedExercise[],
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
            console.log(nextSessions);
            alert("저장되었습니다");
            setShowHistory(false);
            setShowHistory(true);
            onSavedHistory();
                        

        } else {
            alert("완료된 세트가 없어요");
            return;
        }
    }
}