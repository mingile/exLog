export const PARTS = [
  "등",
  "가슴",
  "하체",
  "어깨",
  "팔",
  "코어",
  "유산소",
  "기타",
] as const;

export type Part = (typeof PARTS)[number];
