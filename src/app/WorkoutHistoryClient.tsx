"use client";

import { useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Session } from "./types";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

export function WorkoutHistoryClient({showHistory, historyVersion, displayUnit}: {showHistory: boolean, historyVersion: number, displayUnit: "kg" | "lb"}) {
    const [sessions, setSessions] = useState<Session[]>([]);

    
    useEffect(()=>{
        if (!showHistory) return;
        const history = localStorage.getItem("workout.sessions.v1");
        try{

            if (history){
                const parsedHistory = JSON.parse(history);
                if(!Array.isArray(parsedHistory)) {
                    return ;
                }
                setSessions(parsedHistory);
            }
        } catch (e) {
            console.error("올바르지 않은 JSON 데이터", e);
            setSessions([]);
            localStorage.removeItem("workout.sessions.v1");
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
                                {daySessions.map((session, j) => {
                                    return(
                                        <div key={session.id}>
                                        <Collapsible key={session.id}>
                                                <CollapsibleTrigger><div className="ps-4">{session.part}</div></CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    {session.exercises.map((ex, k) => {
                                                        return(
                                                        <Collapsible key={ex.id}>
                                                            <CollapsibleTrigger>
                                                                <div className="ps-8">{ex.name}</div>
                                                            </CollapsibleTrigger>
                                                            <CollapsibleContent>
                                                                    <div className="grid grid-cols-3 justify-items-center">
                                                                        <div>세트번호</div>
                                                                        <div>무게</div>
                                                                        <div>횟수</div>
                                                                    </div>
                                                                    {ex.sets.map((set, l) => {
                                                                        return(
                                                                            <div className="grid grid-cols-3 justify-items-center" key={set.setNo}>
                                                                                <div>{set.setNo}</div>
                                                                                <div>{displayUnit === "kg" ? set.weight+"kg" : Math.round(set.weight * 2.205).toString()+"lb"}</div>
                                                                                <div>{set.reps}</div>
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