"use client";

import { useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Session } from "./types";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const sessionKey = `workout.sessions.v1`;

export function WorkoutHistoryClient({showHistory, historyVersion}: {showHistory: boolean, historyVersion: number}) {
    const [sessions, setSessions] = useState<Session[]>([]);
    
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
                                                    <Button variant="outline" size="xs" className="ml-auto mr-4"
                                                    onClick={e=>{
                                                        e.stopPropagation();
                                                        deleteSession(session.id)}
                                                    }
                                                    >
                                                        <TrashIcon className="size-4" />
                                                    </Button>
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
                                                                        return(
                                                                            <div className="grid grid-cols-4 justify-items-center" key={set.setNo}>
                                                                                <div>{set.setNo}</div>
                                                                                <div>{set.weight+"kg"}</div>
                                                                                <div>{set.reps}</div>
                                                                                <div>{set.rpe ?? "미입력"}</div>
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

