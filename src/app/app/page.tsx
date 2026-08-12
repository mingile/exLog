import type { Metadata } from "next";
import { RootClient } from "../RootClient";

export const metadata: Metadata = {
  title: "운동 기록",
  description: "운동 세트, 중량, 횟수를 빠르게 기록하세요.",
};

export default function AppPage() {
  return <RootClient />;
}
