'use client';

import { Button } from "@/components/ui/button";
import type { Exercises, Session, SavedExercise, SessionMetadata } from "./types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner"
import React from "react";

export function HeaderControls({ onSavedHistory, clearDoneStatus, exercises, date, setExercises, saving, setSaving, notionReady, setNotionReady, onStartNewSession, sessionMetadata }: { onSavedHistory: () => void, clearDoneStatus: () => void, exercises: Exercises, date: string, setExercises: React.Dispatch<React.SetStateAction<Exercises>>, saving: boolean, setSaving: (saving: boolean)=> void, notionReady: boolean, setNotionReady: (notionReady: boolean) => void, onStartNewSession: () => void, sessionMetadata: SessionMetadata | null }){

    return (
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b supports-[backdrop-filter]:bg-background/60">
            <div className="flex justify-start flex-wrap items-center px-4 py-2 gap-2">
                <span className="text-xs text-muted-foreground">{date}</span>
                <p className="text-xs bg-blue-100 border border-blue-300 rounded-md p-1 w-fit text-muted-foreground">Notion 연결 상태 : {notionReady ? '🟢' : '🔴'}</p>
                <Button className="px-1 text-xs h-7" onClick={() => {
                    fetch("/api/notion/disconnect", {
                        method: "POST",
                    }).then(data=>{
                        if(data.ok){
                            toast.success('Notion 연결 해제 완료', {
                                duration: 1000
                            });
                            checkNotionStatus();
                        }
                    }).catch(err=>{
                        toast.error('Notion 연결 해제 중 오류가 발생했습니다.', {
                            duration: 1000
                        });
                    });
                }}>
                    연결 해제
                </Button>
                <div className="ml-auto flex items-center justify-end gap-0.5">
                    <Button onClick={saveSession} disabled={saving}>
                        {saving ? "저장중..." : "저장"}
                    </Button>
                    {/* <Button onClick={clearDoneStatus}>
                        초기화
                    </Button> */}
                    <Button onClick={handleStartNewSession}>
                        새 세션
                    </Button>
                </div>
                </div>
        </header>
    )

    async function checkNotionStatus(){
        const response = await fetch("/api/notion/status")
        const data = await response.json()
        setNotionReady(data.notionConnected && data.dbConnected);
    }

    function handleStartNewSession() {
        const hasUnsavedChanges = exercises.some(ex => 
            ex.sets.some(set => set.done && !set.synced)
        );

        if (hasUnsavedChanges) {
            const confirmed = window.confirm(
                "저장되지 않은 변경사항이 있습니다.\n새 세션을 시작하시겠습니까?\n(현재 세션이 종료됩니다)"
            );
            if (!confirmed) return;
        }

        onStartNewSession();
        toast.success("새 세션을 시작합니다", {
            duration: 1000
        });
    }

    async function saveSession() {
        console.log('1. saveSession 시작, saving:', saving);
        if(saving) return;
        setSaving(true);
        const savedAt = new Date().toISOString();
        const dayKey = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).slice(2, 12 );
        
        // done === true인 세트만 추출 (Notion 저장용)
        const notionExercises: (SavedExercise & { part: string; exercisePageId?: string })[] = exercises
            .map((ex) => {
                const doneSets = ex.sets
                    .map((set, i) => {
                        console.log(`세트 ${i}:`, {
                            weight: set.weight,
                            reps: set.reps,
                            done: set.done,
                            synced: set.synced,
                            memo: set.memo,
                            rpe: set.rpe
                        });
                        return {
                            set,
                            setNo: i + 1,
                        };
                    })
                    .filter(({ set }) => {
                        const pass = set.done && !set.synced;
                        return pass;
                    });
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
                    part: ex.part || "기타",
                    exercisePageId: ex.exercisePageId,
                    sets: ex.sets.map(({ set, setNo }) => {
                        return {
                            setNo,
                            weight: set.weight,
                            reps: set.reps,
                            memo: set.memo,
                            equipment: set.equipment,
                            rpe: set.rpe,
                        };
                    }),
                };
            });
        
        // exercisePageId 없는 운동 체크
        const hasInvalidExercise = notionExercises.some(ex => !ex.exercisePageId);
        if (hasInvalidExercise && notionReady) {
            toast.error("일부 운동에 Exercise 정보가 없습니다.", {
                description: "라이브러리에서 운동을 다시 선택해주세요.",
                duration: 3000
            });
            setSaving(false);
            return;
        }

        const localExercises: (SavedExercise & { part: string })[] = exercises
            .map((ex) => {
                const doneSets = ex.sets
                    .map((set, i) => {
                        console.log(`세트 ${i}:`, {
                            weight: set.weight,
                            reps: set.reps,
                            done: set.done,
                            synced: set.synced,
                            memo: set.memo,
                            rpe: set.rpe
                        });
                        return {
                            set,
                            setNo: i + 1,
                        };
                    })
                    .filter(({ set }) => {
                        const pass = set.done;
                        return pass;
                    });
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
                    part: ex.part || "기타",
                    exercisePageId: ex.exercisePageId,
                    sets: ex.sets.map(({ set, setNo }) => {
                        return {
                            setNo,
                            weight: set.weight,
                            reps: set.reps,
                            memo: set.memo,
                            equipment: set.equipment,
                            rpe: set.rpe,
                        };
                    }),
                };
            });
        const notionPayload = {
            saved_at: savedAt,
            exercises: notionExercises,
        };
        const sessionId = sessionMetadata?.sessionId || new Date().toISOString();
        const sessionName = sessionMetadata?.sessionName || "세션";
        const localPayload = {
            id: sessionId,
            savedAt: savedAt,
            sessionName: sessionName,
            exercises: localExercises,
        };
        try{
            if (localExercises.length > 0) {
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
                    localStorage.setItem(sessionKey, JSON.stringify([localPayload]));
                    return;
                }
                
                const filtered = sessionData.filter((s => s.id !== localPayload.id));
                // 병합이 아닌 전체 스냅샷 교체 방식
                // 왜? 이게 더 구현하기 쉽기 떄문
                // 나중에 문제가 생기면 mergedSession 방식도 고려해보자.
                const nextSessions = [localPayload, ...filtered];

                if(notionReady && notionExercises.length > 0){
                    // 1. Session row 확보
                    if (!sessionMetadata) {
                        toast.error("세션 정보가 없습니다.", {
                            duration: 2000
                        });
                        return;
                    }

                    const finalSessionName = sessionMetadata.sessionName.trim() || (() => {
                        const now = new Date(sessionMetadata.startedAt);
                        const year = now.getFullYear();
                        const month = String(now.getMonth() + 1).padStart(2, '0');
                        const day = String(now.getDate()).padStart(2, '0');
                        const hours = String(now.getHours()).padStart(2, '0');
                        const minutes = String(now.getMinutes()).padStart(2, '0');
                        return `${year}-${month}-${day} ${hours}:${minutes} 세션`;
                    })();

                    let sessionPageId: string;
                    try {
                        const sessionResponse = await fetch("/api/notion/session-ensure", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                sessionId: sessionMetadata.sessionId,
                                sessionName: sessionMetadata.sessionName,
                                startedAt: sessionMetadata.startedAt
                            }),
                        });

                        if (!sessionResponse.ok) {
                            const errorData = await sessionResponse.json();
                            toast.error("Session 생성 실패: " + errorData.error, {
                                description: "Sets 저장이 중단되었습니다.",
                                duration: 3000
                            });
                            return;
                        }

                        const sessionData = await sessionResponse.json();
                        sessionPageId = sessionData.pageId;
                        console.log(`Session ${sessionData.created ? '생성' : '조회'} 완료:`, sessionPageId);
                    } catch (error) {
                        console.error("Session 확보 중 오류:", error);
                        toast.error("Session 확보 중 오류가 발생했습니다.", {
                            description: "Sets 저장이 중단되었습니다.",
                            duration: 3000
                        });
                        return;
                    }

                    // 2. Sets 저장 (Session relation 포함)
                    try {
                        const writeResponse = await fetch("/api/notion/write", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                ...notionPayload,
                                sessionPageId
                            }),
                        });            
                        
                        if(writeResponse.ok){
                            const data = await writeResponse.json();
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
                            localStorage.setItem(sessionKey, JSON.stringify(nextSessions));
                            onSavedHistory();
                            toast.success(`노션에 ${data.created_count}개 세트 저장되었습니다`, {
                                duration: 2000
                            });
                        } else {
                            const errorData = await writeResponse.json();
                            toast.error("노션에 세트 저장 실패: " + errorData.error, {
                                description: "Session은 생성되었으나 Sets 저장 실패",
                                duration: 3000
                            });
                            return;
                        }
                    } catch (error) {
                        console.error("Sets 저장 중 오류:", error);
                        toast.error("Sets 저장 중 오류가 발생했습니다.", {
                            description: "Session은 생성되었으나 Sets 저장 실패",
                            duration: 3000
                        });
                        return;
                    }
                    
                } else if (notionReady && notionExercises.length === 0) {
                    toast.info("새로 저장할 세트가 없습니다.", {
                        description: "모든 세트가 이미 저장되었습니다.",
                        duration: 2000
                    });
                    localStorage.setItem(sessionKey, JSON.stringify(nextSessions));
                    onSavedHistory();
                } else {
                    toast.success(`로컬에 저장 완료!`, {
                        description: "노션에 저장하려면 연결을 해주세요.",
                        duration: 2000
                    })                    
                    localStorage.setItem(sessionKey, JSON.stringify(nextSessions));
                    onSavedHistory();
                }
            }
            else{
                toast.error("새로 저장할 내용이 없습니다.", {
                    duration: 1000
                });
                return;
            }
        }
        finally{
            setSaving(false);
        }
    }
}