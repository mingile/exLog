import Link from "next/link";
import { HardDrive, Minimize2, NotebookPen, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: HardDrive,
    title: "Local-first",
    description:
      "운동 기록은 브라우저에 먼저 저장됩니다. 네트워크 없이도 기록하고 이어갈 수 있습니다.",
  },
  {
    icon: Minimize2,
    title: "미니멀 UX",
    description:
      "세트·중량·횟수 입력에만 집중할 수 있도록 불필요한 요소를 줄였습니다.",
  },
  {
    icon: NotebookPen,
    title: "Notion 백업",
    description:
      "원하면 Notion 데이터베이스로 기록을 백업합니다. 연동하지 않아도 앱은 그대로 사용할 수 있습니다.",
  },
  {
    icon: Smartphone,
    title: "PWA 설치",
    description:
      "홈 화면에 추가해 앱처럼 실행하세요. 헬스장에서도 빠르게 기록을 시작할 수 있습니다.",
  },
] as const;

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-md font-semibold tracking-tight hover:underline underline-offset-4"
          >
            Daily Set
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-muted-foreground">
              운동 기록에 집중한 미니멀 웹앱
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              기록은 가볍게,
              <br />
              운동에만 집중
            </h1>
            <p className="mt-6 text-base text-muted-foreground sm:text-lg">
              Daily Set는 세트 기록을 빠르게 남기고, 로컬에 안전하게 보관하며,
              <br />
              필요 시 Notion 데이터베이스에 백업하는 운동 기록 앱입니다.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link href="/app">앱 시작하기</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/app">운동 라이브러리 보기</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight">
                필요한 것만 담았습니다
              </h2>
              <p className="mt-3 text-muted-foreground">
                복잡한 설정 없이 바로 기록을 시작할 수 있습니다.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, description }) => (
                <Card key={title} className="h-full">
                  <CardHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-lg border bg-background">
                      <Icon className="size-5 text-foreground" />
                    </div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t">
          <div className="mx-auto max-w-5xl px-6 py-16 text-center sm:py-20">
            <h2 className="text-2xl font-semibold tracking-tight">
              지금 바로 기록을 시작하세요
            </h2>
            <p className="mt-3 text-muted-foreground">
              계정 없이 브라우저에서 바로 사용할 수 있습니다.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/app">앱 시작하기</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-8 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
          <span>© {new Date().getFullYear()} Daily Set</span>
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <div className="flex  flex-row items-center gap-4">
              <Link
                href="/termsofservice"
                className="hover:text-foreground underline-offset-4 hover:underline"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="hover:text-foreground underline-offset-4 hover:underline"
              >
                Privacy Policy
              </Link>
            </div>
            <span>운동 기록에 집중한 미니멀 웹앱</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
