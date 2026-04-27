"use client";

import { useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Session } from "./types";
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
     
    function groupByDay(sessions: Session[]){
        const groupedSessions: {[dayKey: string]: Session[]} = {};
        sessions.forEach(session => {
            const dayKey = session.id.split('_')[0];
            if(!groupedSessions[dayKey]){
                groupedSessions[dayKey] = [];
            }
            groupedSessions[dayKey].push(session);
        });
        return groupedSessions;
    }

    function deleteSession(sessionId: string){
            const filteredHistory = sessions.filter((s: Session) => s.id !== sessionId);
            localStorage.setItem(sessionKey, JSON.stringify(filteredHistory));
            setSessions(filteredHistory);
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
    const grouped = groupByDay(sessions);
    const days = Object.keys(grouped).sort((a,b)=> b.localeCompare(a));
    return(
        <main className="p-2">
            {days.map((dayKey, i) => {
                const daySessions = grouped[dayKey];
                return(
                    <Accordion key={dayKey} type="single" collapsible>
                        <AccordionItem value={`item-${i}`}>
                            <AccordionTrigger><div>{dayKey}</div></AccordionTrigger>
                            <AccordionContent>
                                {daySessions.map((session) => {
                                    return(
                                        <div key={session.id}>
                                        <Collapsible>
                                                <div className="ps-4 flex">
                                                <CollapsibleTrigger>
                                                    <div className="text-md font-bold">{session.part}</div>
                                                </CollapsibleTrigger>
                                                    </div>
                                                <CollapsibleContent>
                                                    {session.exercises.map((ex) => {
                                                        return(
                                                        <Collapsible key={ex.id}>
                                                            <CollapsibleTrigger>
                                                                <div className="ps-8">
                                                                    {ex.name}
                                                                    </div>
                                                            </CollapsibleTrigger>
                                                            <CollapsibleContent>
                                                                    <div className="grid grid-cols-4 justify-items-center">
                                                                        <div>세트번호</div>
                                                                        <div>무게</div>
                                                                        <div>횟수</div>
                                                                        <div>RPE</div>
                                                                    </div>
                                                                    {ex.sets.map((set) => {
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
                                                                                    className="grid grid-cols-4 justify-items-center bg-white transition-transform"
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

