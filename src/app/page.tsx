import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusButton } from "./PlusButton";
import { Row } from "./Row";
import { WorkoutSessionClient } from "./WorkoutSessionClient";

export default function Home() {

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b supports-[backdrop-filter]:bg-background/60">
        <div className="flex justify-between items-center px-4 py-2">
          <div>부위</div>
          <div className="flex gap-1">
            <div>날짜</div>
          </div>
        </div>
      </header>
      <main className="p-2">
        <WorkoutSessionClient />
      </main>
    </>
  );
}
