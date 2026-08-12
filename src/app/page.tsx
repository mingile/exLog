import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { withBasePath } from "@/lib/base-path";

const landingTitle = "Daily Set — 기록은 가볍게, 운동에만 집중";
const landingDescription =
  "Daily Set는 세트 기록을 빠르게 남기고, 로컬에 안전하게 보관하며, 필요할 때 Notion으로 백업하는 운동 기록 앱입니다.";

export const metadata: Metadata = {
  title: landingTitle,
  description: landingDescription,
  openGraph: {
    title: landingTitle,
    description: landingDescription,
    url: withBasePath("/"),
    siteName: "Daily Set",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: withBasePath("/icons/icon-512.png"),
        width: 512,
        height: 512,
        alt: "Daily Set",
      },
    ],
  },
};

export default function Home() {
  return <LandingPage />;
}
