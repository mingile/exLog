"use client";

import { useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Session, SavedExercise } from "./types";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { TrashIcon } from "lucide-react";

const sessionKey = `workout.sessions.v1`;

export function WorkoutHistoryClient({showHistory, historyVersion}: {showHistory: boolean, historyVersion: number}) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [swipingSet, setSwipingSet] = useState<string | null>(null);
    const [swipeOffset, setSwipeOffset] = useState<number>(0);
    
    useEffect(()=>{
        if (!showHistory) return;
        const history = localStorage.getItem(sessionKey);
        try{
            const parsedHistory: Session[] = history ? JSON.parse(history) : [];
            if (history){
                if(!Array.isArray(parsedHistory)) {
                    return ;
                }
                setSessions(parsedHistory);
            }else{
                setSessions([]);
            }
        } catch (e) {
            console.error("올바르지 않은 JSON 데이터", e);
            setSessions([]);
            localStorage.removeItem(sessionKey);
        }
    }, [showHistory, historyVersion]);
     
    function groupBySessionName(sessions: Session[]){
        const groupedSessions: {[sessionName: string]: Session[]} = {};
        sessions.forEach(session => {
            let sessionName = session.sessionName;
            if (!sessionName) {
                // sessionName이 없으면 savedAt에서 생성
                const date = new Date(session.savedAt);
                if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    sessionName = `${year}-${month}-${day} ${hours}:${minutes} 세션`;
                } else {
                    sessionName = "세션";
                }
            }
            if(!groupedSessions[sessionName]){
                groupedSessions[sessionName] = [];
            }
            groupedSessions[sessionName].push(session);
        });
        return groupedSessions;
    }
    
    function groupExercisesByPart(exercises: (SavedExercise & { part?: string })[]): Map<string, (SavedExercise & { part?: string })[]> {
        const grouped = new Map<string, (SavedExercise & { part?: string })[]>();
        exercises.forEach(ex => {
            const part = ex.part || "기타";
            if (!grouped.has(part)) {
                grouped.set(part, []);
            }
            grouped.get(part)!.push(ex);
        });
        return grouped;
    }

    function deleteSet(sessionId: string, exerciseId: string, setNo: number) {
        const updatedSessions = sessions.map(session => {
            if (session.id !== sessionId) return session;

            const updatedExercises = session.exercises.map(exercise => {
                if (exercise.id !== exerciseId) return exercise;

                const updatedSets = exercise.sets.filter(set => set.setNo !== setNo);
                return { ...exercise, sets: updatedSets };
            }).filter(exercise => exercise.sets.length > 0);

            return { ...session, exercises: updatedExercises };
        }).filter(session => session.exercises.length > 0);

        localStorage.setItem(sessionKey, JSON.stringify(updatedSessions));
        setSessions(updatedSessions);
    }

    function handleTouchStart(e: React.TouchEvent, setKey: string) {
        const touch = e.touches[0];
        setSwipingSet(setKey);
        setSwipeOffset(0);
        (e.currentTarget as HTMLElement).dataset.startX = String(touch.clientX);
    }

    function handleTouchMove(e: React.TouchEvent, setKey: string) {
        if (swipingSet !== setKey) return;
        
        const touch = e.touches[0];
        const startX = Number((e.currentTarget as HTMLElement).dataset.startX);
        const currentX = touch.clientX;
        const diff = currentX - startX;
        
        if (diff < 0) {
            setSwipeOffset(Math.max(diff, -100));
        }
    }

    function handleTouchEnd(sessionId: string, exerciseId: string, setNo: number) {
        if (swipeOffset < -50) {
            deleteSet(sessionId, exerciseId, setNo);
        }
        setSwipingSet(null);
        setSwipeOffset(0);
    }

    function handleMouseDown(e: React.MouseEvent, setKey: string) {
        setSwipingSet(setKey);
        setSwipeOffset(0);
        (e.currentTarget as HTMLElement).dataset.startX = String(e.clientX);
    }

    function handleMouseMove(e: React.MouseEvent, setKey: string) {
        if (swipingSet !== setKey) return;
        
        const startX = Number((e.currentTarget as HTMLElement).dataset.startX);
        const currentX = e.clientX;
        const diff = currentX - startX;

        if (diff < 0) {
            setSwipeOffset(Math.max(diff, -100));
        }
    }

    function handleMouseUp(sessionId: string, exerciseId: string, setNo: number) {
        if (swipeOffset < -50) {
            deleteSet(sessionId, exerciseId, setNo);
        }
        setSwipingSet(null);
        setSwipeOffset(0);
    }

    function handleMouseLeave() {
        setSwipingSet(null);
        setSwipeOffset(0);
    }
    
    if (!showHistory) return null;
    const grouped = groupBySessionName(sessions);
    const sessionNames = Object.keys(grouped).sort((a,b)=> b.localeCompare(a));
    return(
        <main className="p-2">
            {sessionNames.map((sessionName, i) => {
                const sessionList = grouped[sessionName];
                const session = sessionList[0];
                const partGrouped = groupExercisesByPart(session.exercises);
                const parts = Array.from(partGrouped.keys());
                
                return(
                    <Accordion key={session.id} type="single" collapsible>
                        <AccordionItem value={`item-${i}`}>
                            <AccordionTrigger><div>{sessionName}</div></AccordionTrigger>
                            <AccordionContent>
                                {parts.map((part) => {
                                    const partExercises = partGrouped.get(part) || [];
                                    return(
                                        <div key={part}>
                                        <Collapsible>
                                                <div className="ps-4 flex">
                                                <CollapsibleTrigger>
                                                    <div className="text-md font-bold">
                                                        {part}
                                                    </div>
                                                </CollapsibleTrigger>
                                                    </div>
                                                <CollapsibleContent>
                                                    {partExercises.map((ex) => {
                                                        return(
                                                        <Collapsible key={ex.id}>
                                                            <CollapsibleTrigger>
                                                                <div className="ps-8">
                                                                    {ex.name}
                                                                    </div>
                                                            </CollapsibleTrigger>
                                                            <CollapsibleContent>
                                                                    <div className="ps-8 grid grid-cols-4 justify-items-center">
                                                                        <div>세트번호</div>
                                                                        <div>무게</div>
                                                                        <div>횟수</div>
                                                                        <div>RPE</div>
                                                                    </div>
                                                                    {ex.sets.map((set: SavedExercise['sets'][0]) => {
                                                                        const setKey = `${session.id}-${ex.id}-${set.setNo}`;
                                                                        const isActive = swipingSet === setKey;
                                                                        const offset = isActive ? swipeOffset : 0;
                                                                        
                                                                        return(
                                                                            <div 
                                                                                key={set.setNo}
                                                                                className="relative overflow-hidden cursor-pointer"
                                                                                onTouchStart={(e) => handleTouchStart(e, setKey)}
                                                                                onTouchMove={(e) => handleTouchMove(e, setKey)}
                                                                                onTouchEnd={() => handleTouchEnd(session.id, ex.id, set.setNo)}
                                                                                onMouseDown={(e) => handleMouseDown(e, setKey)}
                                                                                onMouseMove={(e) => handleMouseMove(e, setKey)}
                                                                                onMouseUp={() => handleMouseUp(session.id, ex.id, set.setNo)}
                                                                                onMouseLeave={handleMouseLeave}
                                                                            >
                                                                                <div 
                                                                                    className="absolute inset-0 bg-red-500 flex items-center justify-end pr-4"
                                                                                >
                                                                                    <TrashIcon className="size-5 text-white" />
                                                                                </div>
                                                                                <div 
                                                                                    className="grid grid-cols-4 ps-8 justify-items-center bg-white transition-transform"
                                                                                    style={{ transform: `translateX(${offset}px)` }}
                                                                                >
                                                                                    <div>{set.setNo}</div>
                                                                                    <div>{set.weight+"kg"}</div>
                                                                                    <div>{set.reps}</div>
                                                                                    <div>{set.rpe ?? "미입력"}</div>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </CollapsibleContent>
                                                            </Collapsible>
                                                        )
                                                    })}
                                                </CollapsibleContent>
                                                </Collapsible>
                                            </div>
                                    )
                                })}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )
            })}
        </main>
    );

}

