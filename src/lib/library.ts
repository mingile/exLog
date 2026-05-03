import { LibraryCategory, LibraryExercise } from "@/app/types";

const CATEGORY_ORDER: LibraryCategory[] = [
  "등",
  "가슴",
  "하체",
  "어깨",
  "팔",
  "코어",
  "유산소",
  "기타",
];

function extractTitle(property: any): string | null {
  if (!property) return null;
  if (!property.title) return null;
  if (!property.title.length) return null;
  const text = property.title.map((t: any) => t.plain_text).join("");
  if (text.trim() === "") return null;
  return text.trim();
}

function extractRichText(property: any): string | null {
  if (!property) return null;
  if (!Array.isArray(property.rich_text)) return null;
  if (property.rich_text.length === 0) return null;
  const text = property.rich_text.map((t: any) => t.plain_text).join("");
  if (text.trim() === "") return null;
  return text.trim();
}

function extractSelect(property: any): string | null {
  if (!property) return null;
  if (!property.select) return null;
  if (!property.select.name) return null;
  return property.select.name;
}

function normalizeCategory(categoryFromNotion: string | null): LibraryCategory {
  if (!categoryFromNotion) return "기타";

  const normalized = categoryFromNotion.trim();

  if (CATEGORY_ORDER.includes(normalized as LibraryCategory)) {
    return normalized as LibraryCategory;
  }

  return "기타";
}

export function transformNotionRowToLibraryExercise(
  row: any,
): LibraryExercise | null {
  const properties = row.properties;
  if (!properties) return null;

  const exerciseId = extractRichText(properties.exercise_id);
  const name = extractTitle(properties["이름"]);
  const notionPageId = row.id; // Notion page id

  if (!exerciseId) {
    console.warn("exercise_id missing in row:", row.id);
    return null;
  }

  if (!name) {
    console.warn("이름 missing in row:", row.id);
    return null;
  }

  const categoryRaw = extractSelect(properties["카테고리"]);
  const category = normalizeCategory(categoryRaw);

  const equipment = extractSelect(properties["장비"]) || undefined;
  const primaryEffect = extractRichText(properties["주요 효과"]) || undefined;

  return {
    id: exerciseId,
    name,
    category,
    equipment,
    primaryEffect,
    notionPageId,
  };
}

export function groupExercisesByCategory(
  exercises: LibraryExercise[],
): Map<LibraryCategory, LibraryExercise[]> {
  const grouped = new Map<LibraryCategory, LibraryExercise[]>();

  for (const category of CATEGORY_ORDER) {
    grouped.set(category, []);
  }

  for (const exercise of exercises) {
    const list = grouped.get(exercise.category);
    if (list) {
      list.push(exercise);
    }
  }

  return grouped;
}

export function getOrderedCategories(
  groupedMap: Map<LibraryCategory, LibraryExercise[]>,
): LibraryCategory[] {
  return CATEGORY_ORDER.filter((cat) => {
    const exercises = groupedMap.get(cat);
    return exercises && exercises.length > 0;
  });
}

export function getFirstValidCategory(
  categories: LibraryCategory[],
): LibraryCategory | null {
  return categories.length > 0 ? categories[0] : null;
}
