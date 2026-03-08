'use client';

import { Button } from "@/components/ui/button";
import type { Exercises, Session, SavedExercise } from "./types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React from "react";

export function HeaderControls({ onSavedHistory, selectedPart, clearDoneStatus, exercises, onSelectPart, date, setExercises, saving, setSaving, notionReady }: { onSavedHistory: () => void, selectedPart: ('back' | 'chest' | 'legs' | 'shoulders'), clearDoneStatus: () => void, exercises: Exercises, onSelectPart: (part: ('back' | 'chest' | 'legs' | 'shoulders')) => void, date: string, setExercises: React.Dispatch<React.SetStateAction<Exercises>>, saving: boolean, setSaving: (saving: boolean)=> void, notionReady: boolean }){

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
                <p className="text-xs bg-blue-100 border border-blue-300 rounded-md p-1 w-fit text-muted-foreground">Notion 연결 상태 : {notionReady ? '🟢' : '🔴'}</p>
                <div className="ml-auto flex items-center justify-end gap-0.5">
                    <Button onClick={saveSession} disabled={saving}>
                        {saving ? "저장중..." : "저장"}
                    </Button>
                    <Button onClick={clearDoneStatus}>
                        초기화
                    </Button>
                </div>
                </div>
        </header>
    )

    async function saveSession() {
        console.log('1. saveSession 시작, saving:', saving);
        if(saving) return;
        setSaving(true);
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
                    .filter(({ set }) => set.done && !set.synced);
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
        console.log('2. savedExercises:', savedExercises);
        console.log('3. savedExercises.length:', savedExercises.length);
        
        try{
            console.log('4. try 시작');
            if (savedExercises.length > 0) {
                console.log('5. savedExercises.length > 0');
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
                // payload가 기존에 존재하던 세션일 경우 중복방지를 위해 필터링
                const filtered = sessionData.filter((s => s.id !== payload.id));
                // 수정된 기존 세션을 맨 앞에 추가
                const nextSessions = [payload, ...filtered];

                if(notionReady){
                const response = await fetch("/api/notion/write", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });            
                
                if(response.ok){
                    const data = await response.json();
                    setExercises(
                        prev => prev.map(ex => ({
                            ...ex,
                            sets: ex.sets.map(set=>(
                                set.done && !set.synced?
                                {...set, synced: true} : 
                                set
                            ))
                        }))
                    )
                    onSavedHistory();
                    alert(`노션에 ${data.created_count}개 세트 저장되었습니다`);
                    
                }
                else{
                    alert("노션에 세트 저장 실패");
                    return;
                }
                
            } else {
                alert(`수행한 세션이 로컬 스토리지에 저장되었습니다. 
                    노션에 저장하려면 연결을 해주세요.`)
                localStorage.setItem(sessionKey, JSON.stringify(nextSessions));
                onSavedHistory();
                return;
            }
        }
    }
        finally{
            setSaving(false);
        }
    }
}