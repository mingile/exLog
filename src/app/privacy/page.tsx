import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
  description: "Daily Set 개인정보 처리방침",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight hover:underline underline-offset-4"
          >
            Daily Set
          </Link>
          <Button asChild size="sm" variant="outline">
            <Link href="/">홈으로</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
          <h1 className="text-3xl font-semibold tracking-tight">
            개인정보 처리방침
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Daily Set는 사용자의 운동 기록과 개인정보를 최소한으로 처리하는
            것을 원칙으로 합니다.
          </p>

          <div className="mt-10 space-y-10 text-sm leading-relaxed sm:text-base">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">1. 처리하는 정보</h2>
              <p className="text-muted-foreground">
                Daily Set는 서비스 제공을 위해 다음 정보를 처리할 수 있습니다.
              </p>

              <h3 className="font-medium">운동 및 앱 데이터</h3>
              <p className="text-muted-foreground">
                사용자의 브라우저에 다음 정보가 저장될 수 있습니다.
              </p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>진행 중인 운동 세션</li>
                <li>완료된 운동 기록</li>
                <li>운동명, 세트, 중량, 횟수, 메모 및 장비 정보</li>
                <li>운동 타이머 및 세션 상태</li>
                <li>테마 등 앱 설정</li>
              </ul>
              <p className="text-muted-foreground">
                운동 기록은 기본적으로 사용자의 브라우저에 저장됩니다.
              </p>

              <h3 className="font-medium">Notion 연결 정보</h3>
              <p className="text-muted-foreground">
                사용자가 Notion 연동을 선택한 경우 다음 정보가 처리될 수
                있습니다.
              </p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>익명 브라우저 식별 정보</li>
                <li>Notion OAuth 인증 정보</li>
                <li>Notion Workspace 식별 정보</li>
                <li>사용자가 선택한 Notion 데이터베이스 식별 정보</li>
              </ul>
              <p className="text-muted-foreground">
                Daily Set는 이름, 이메일 주소 등 사용자를 직접 식별하기 위한
                계정 정보를 별도로 수집하지 않습니다.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">2. 정보의 이용 목적</h2>
              <p className="text-muted-foreground">
                처리되는 정보는 다음 목적으로 사용됩니다.
              </p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>운동 기록 저장 및 조회</li>
                <li>진행 중인 운동 세션 유지</li>
                <li>사용자 설정 유지</li>
                <li>Notion OAuth 인증 및 연결 상태 유지</li>
                <li>사용자가 선택한 Notion 데이터베이스로 운동 기록 동기화</li>
                <li>Notion에 저장된 운동 기록 및 운동 목록 조회</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">3. 운동 기록의 저장</h2>
              <p className="text-muted-foreground">
                운동 기록은 기본적으로 사용자의 브라우저 로컬 저장소에
                저장됩니다.
              </p>
              <p className="text-muted-foreground">
                Daily Set 서버는 운동 세션 및 세트 기록을 자체 데이터베이스에
                영구 저장하지 않습니다.
              </p>
              <p className="text-muted-foreground">
                사용자가 Notion 연동을 사용하는 경우 운동 기록은 Daily Set
                서버를 통해 Notion API로 전달되며, Daily Set와 연결된 Notion
                데이터베이스에 저장됩니다.
              </p>
              <p className="text-muted-foreground">
                Notion에서 운동 기록이나 운동 목록을 조회하는 경우에도 Daily
                Set 서버가 API 요청을 중계할 수 있으나, 조회된 운동 기록을
                Daily Set의 서버 데이터베이스에 영구 저장하지 않습니다.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">4. Notion 연동</h2>
              <p className="text-muted-foreground">
                Notion 연동은 선택 사항이며, Notion을 연결하지 않아도 Daily
                Set의 기본 운동 기록 기능을 사용할 수 있습니다.
              </p>
              <p className="text-muted-foreground">
                사용자가 Notion 연동을 승인하면 Daily Set는 Notion OAuth를
                통해 발급된 인증 정보를 사용하여 사용자가 허용한 Notion
                Workspace 및 데이터베이스에 접근합니다.
              </p>
              <p className="text-muted-foreground">
                연결 상태를 유지하고 Notion API를 호출하기 위해 필요한 OAuth
                인증 정보와 Notion 연결 정보는 Daily Set이 사용하는 서버
                데이터베이스에 저장됩니다.
              </p>
              <p className="text-muted-foreground">
                Notion 연결 과정에서 생성되는 임시 인증 정보는 연결이 완료되면
                삭제되며, 연결이 완료되지 않은 경우 일정 시간이 지나면 자동으로
                삭제됩니다.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">5. 정보의 보관 및 삭제</h2>
              <h3 className="font-medium">브라우저에 저장된 운동 기록</h3>
              <p className="text-muted-foreground">
                운동 기록 및 앱 설정은 사용자의 브라우저에 저장되며, 사용자가
                앱에서 기록을 삭제하거나 브라우저의 저장 데이터를 삭제할 때
                제거될 수 있습니다.
              </p>
              <p className="text-muted-foreground">
                Daily Set 서버는 사용자의 브라우저에 저장된 로컬 데이터를
                원격으로 삭제할 수 없습니다.
              </p>

              <h3 className="font-medium">Notion 연결 정보</h3>
              <p className="text-muted-foreground">
                사용자가 Daily Set에서 Notion 연결을 해제하면 Daily Set
                서버에 저장된 해당 Notion 연결 정보와 남아 있는 임시 연결
                정보가 삭제됩니다.
              </p>
              <p className="text-muted-foreground">
                다만 연결 해제는 다음 데이터를 자동으로 삭제하지 않습니다.
              </p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>사용자의 브라우저에 저장된 운동 기록</li>
                <li>이미 사용자의 Notion 데이터베이스에 동기화된 운동 기록</li>
              </ul>
              <p className="text-muted-foreground">
                Notion에 이미 저장된 데이터는 사용자가 Notion에서 직접 관리하거나
                삭제할 수 있습니다.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">
                6. 쿠키 및 브라우저 식별 정보
              </h2>
              <p className="text-muted-foreground">
                Daily Set는 Notion 연결 상태 유지와 OAuth 인증 과정의 보안을
                위해 필요한 쿠키를 사용할 수 있습니다.
              </p>
              <p className="text-muted-foreground">
                이 과정에서 사용되는 브라우저 식별자는 무작위로 생성되며, Daily
                Set이 별도로 수집하는 이름이나 이메일 주소와 연결되지
                않습니다.
              </p>
              <p className="text-muted-foreground">
                OAuth 인증 과정에서 사용되는 임시 정보는 인증 절차 완료 또는
                일정 시간 경과 후 만료됩니다.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">7. 외부 서비스</h2>
              <p className="text-muted-foreground">
                Daily Set는 서비스 제공을 위해 다음 외부 서비스를 사용합니다.
              </p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>
                  <strong className="font-medium text-foreground">Notion</strong>{" "}
                  — OAuth 인증 및 운동 데이터 저장·조회
                </li>
                <li>
                  <strong className="font-medium text-foreground">
                    MongoDB Atlas
                  </strong>{" "}
                  — Notion 연결 및 인증 정보 저장
                </li>
                <li>
                  <strong className="font-medium text-foreground">Vercel</strong>{" "}
                  — Daily Set 애플리케이션 및 서버 기능 호스팅
                </li>
              </ul>
              <p className="text-muted-foreground">
                Notion 연동을 사용하지 않는 경우, Daily Set는 Notion 또는
                MongoDB Atlas를 통해 사용자의 운동 기록을 처리하지 않습니다.
              </p>
              <p className="text-muted-foreground">
                각 외부 서비스에서 처리되는 정보에는 해당 서비스 제공자의
                개인정보 처리방침 및 관련 정책이 적용될 수 있습니다.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">8. 사용자의 선택과 권리</h2>
              <p className="text-muted-foreground">
                사용자는 다음과 같은 선택을 할 수 있습니다.
              </p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>Notion 연동을 사용하지 않고 Daily Set을 사용할 수 있습니다.</li>
                <li>언제든지 Daily Set에서 Notion 연결을 해제할 수 있습니다.</li>
                <li>브라우저에 저장된 운동 기록을 삭제할 수 있습니다.</li>
                <li>
                  Notion에 동기화된 운동 기록을 Notion에서 직접 관리하거나
                  삭제할 수 있습니다.
                </li>
              </ul>
              <p className="text-muted-foreground">
                개인정보 처리와 관련한 문의 또는 삭제 요청이 필요한 경우 아래
                문의 방법을 통해 운영자에게 요청할 수 있습니다.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">9. 정보 보호</h2>
              <p className="text-muted-foreground">
                Daily Set는 서비스 제공에 필요한 범위에서 최소한의 정보를
                처리하도록 설계합니다.
              </p>
              <p className="text-muted-foreground">
                Notion OAuth 인증 정보는 클라이언트에서 직접 사용할 수 있도록
                노출하지 않고, 서버에서 Notion API 요청을 처리하는 데
                사용합니다.
              </p>
              <p className="text-muted-foreground">
                운동 기록은 기본적으로 사용자 브라우저에 저장되며, Daily Set
                서버 데이터베이스에 운동 기록 자체를 영구 보관하지 않습니다.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">
                10. 개인정보 처리방침의 변경
              </h2>
              <p className="text-muted-foreground">
                서비스 기능이나 정보 처리 방식이 변경되는 경우 본 개인정보
                처리방침도 변경될 수 있습니다.
              </p>
              <p className="text-muted-foreground">
                중요한 변경 사항이 있는 경우 서비스 내 적절한 방법을 통해
                안내합니다.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">11. 문의</h2>
              <p className="text-muted-foreground">
                개인정보 처리와 관련한 문의는 Daily Set 운영자에게 연락해
                주세요.
              </p>
              <p className="text-muted-foreground">
                이메일:{" "}
                <a
                  href="mailto:vhrehf2408@gmail.com"
                  className="text-foreground underline underline-offset-4 hover:text-primary"
                >
                  vhrehf2408@gmail.com
                </a>
              </p>
            </section>

            <section className="space-y-3 border-t pt-8">
              <h2 className="text-lg font-semibold">시행일</h2>
              <p className="text-muted-foreground">
                본 개인정보 처리방침은 2026년 8월 10일부터 적용됩니다.
              </p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
