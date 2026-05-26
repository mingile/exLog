export const EQUIPMENTS = [
  "barbell",
  "dumbbell",
  "plate-machine",
  "cable-machine",
  "smith-machine",
  "bodyweight",
  "cardio-machine",
] as const;

export type Equipment = (typeof EQUIPMENTS)[number];

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: "바벨",
  dumbbell: "덤벨",
  "plate-machine": "원판",
  "cable-machine": "케이블",
  "smith-machine": "스미스",
  bodyweight: "맨몸",
  "cardio-machine": "유산소",
};
