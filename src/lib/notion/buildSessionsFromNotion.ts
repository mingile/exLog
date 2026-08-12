import type { SavedExercise, Session } from "@/app/types";

export type NotionDatabasePage = {
  id: string;
  properties: Record<string, unknown>;
};

export type NotionSessionMeta = {
  pageId: string;
  sessionId: string;
  sessionName: string;
  startedAt: string | null;
};

type ParsedSetRow = {
  sessionPageId: string;
  exercisePageId: string;
  exerciseName: string;
  setNo: number;
  weight: number;
  reps: number;
  memo: string;
  equipment: string;
  part: string;
  date: string | null;
};

export type BuildSessionsFromNotionInput = {
  setPages: NotionDatabasePage[];
  sessionPages: NotionDatabasePage[];
  exerciseNameByPageId?: Record<string, string>;
};

const NOTION_TO_EQUIPMENT: Record<string, string> = {
  케이블: "cable-machine",
  스미스: "smith-machine",
  원판: "plate-machine",
  바벨: "barbell",
  덤벨: "dumbbell",
};

function getTitle(
  properties: Record<string, unknown>,
  propertyName: string,
): string | null {
  const property = properties[propertyName] as
    | { title?: { plain_text?: string }[] }
    | undefined;
  if (!property?.title?.length) return null;
  const text = property.title.map((item) => item.plain_text ?? "").join("");
  if (text.trim() === "") return null;
  return text.trim();
}

function getRichText(
  properties: Record<string, unknown>,
  propertyName: string,
): string | null {
  const property = properties[propertyName] as
    | { rich_text?: { plain_text?: string }[] }
    | undefined;
  if (!property?.rich_text?.length) return null;
  const text = property.rich_text
    .map((item) => item.plain_text ?? "")
    .join("");
  if (text.trim() === "") return null;
  return text.trim();
}

function getNumber(
  properties: Record<string, unknown>,
  propertyName: string,
): number | null {
  const value = (properties[propertyName] as { number?: number } | undefined)
    ?.number;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getDateStart(
  properties: Record<string, unknown>,
  propertyName: string,
): string | null {
  const start = (
    properties[propertyName] as { date?: { start?: string } } | undefined
  )?.date?.start;
  return typeof start === "string" && start.trim() !== "" ? start : null;
}

function getSelectName(
  properties: Record<string, unknown>,
  propertyName: string,
): string | null {
  const name = (
    properties[propertyName] as { select?: { name?: string } } | undefined
  )?.select?.name;
  return typeof name === "string" && name.trim() !== "" ? name.trim() : null;
}

function getRelationPageId(
  properties: Record<string, unknown>,
  propertyName: string,
): string | null {
  const relation = (
    properties[propertyName] as { relation?: { id?: string }[] } | undefined
  )?.relation;
  if (!relation?.length) return null;
  const id = relation[0]?.id;
  return typeof id === "string" && id.trim() !== "" ? id : null;
}

function notionEquipmentToSlug(notionName: string | null): string {
  if (!notionName) return "cable-machine";
  return NOTION_TO_EQUIPMENT[notionName] ?? "cable-machine";
}

export function parseExerciseNameFromSetTitle(
  title: string,
  setNo: number,
): string | null {
  const match = title.match(/^(.+) - #(\d+)$/);
  if (!match) return null;
  const parsedSetNo = Number(match[2]);
  if (!Number.isFinite(parsedSetNo) || parsedSetNo !== setNo) return null;
  const name = match[1]?.trim();
  return name ? name : null;
}

export function parseNotionSessionMeta(
  page: NotionDatabasePage,
): NotionSessionMeta | null {
  const sessionId = getRichText(page.properties, "Session ID");
  if (!sessionId) return null;

  return {
    pageId: page.id,
    sessionId,
    sessionName: getTitle(page.properties, "이름") ?? "세션",
    startedAt: getDateStart(page.properties, "시작시간"),
  };
}

export function buildSessionMetaByPageId(
  sessionPages: NotionDatabasePage[],
): Map<string, NotionSessionMeta> {
  const map = new Map<string, NotionSessionMeta>();
  for (const page of sessionPages) {
    const meta = parseNotionSessionMeta(page);
    if (meta) {
      map.set(meta.pageId, meta);
    }
  }
  return map;
}

function resolveExerciseName(params: {
  title: string | null;
  setNo: number;
  exercisePageId: string;
  exerciseNameByPageId?: Record<string, string>;
}): string | null {
  const fromLookup = params.exerciseNameByPageId?.[params.exercisePageId];
  if (fromLookup?.trim()) {
    return fromLookup.trim();
  }

  if (params.title) {
    const fromTitle = parseExerciseNameFromSetTitle(params.title, params.setNo);
    if (fromTitle) return fromTitle;
  }

  return null;
}

function parseNotionSetRow(
  page: NotionDatabasePage,
  exerciseNameByPageId?: Record<string, string>,
): ParsedSetRow | null {
  const properties = page.properties;
  const sessionPageId = getRelationPageId(properties, "Session");
  const exercisePageId = getRelationPageId(properties, "Exercise");
  const setNo = getNumber(properties, "Set No");
  const weight = getNumber(properties, "Weight");
  const reps = getNumber(properties, "Reps");

  if (!sessionPageId || !exercisePageId || setNo === null) {
    return null;
  }
  if (weight === null || reps === null) {
    return null;
  }

  const exerciseName = resolveExerciseName({
    title: getTitle(properties, "Name"),
    setNo,
    exercisePageId,
    exerciseNameByPageId,
  });
  if (!exerciseName) {
    return null;
  }

  return {
    sessionPageId,
    exercisePageId,
    exerciseName,
    setNo,
    weight,
    reps,
    memo: getRichText(properties, "Memo") ?? "",
    equipment: notionEquipmentToSlug(getSelectName(properties, "Equipment")),
    part: getSelectName(properties, "Part") ?? "기타",
    date: getDateStart(properties, "Date"),
  };
}

function compareSetRows(a: ParsedSetRow, b: ParsedSetRow): number {
  const dateA = a.date ? new Date(a.date).getTime() : 0;
  const dateB = b.date ? new Date(b.date).getTime() : 0;
  if (dateA !== dateB) {
    return dateB - dateA;
  }
  return b.setNo - a.setNo;
}

function pickSavedAt(
  meta: NotionSessionMeta,
  setRows: ParsedSetRow[],
): string {
  if (meta.startedAt) {
    return meta.startedAt;
  }

  const datedRows = setRows
    .map((row) => row.date)
    .filter((date): date is string => date !== null)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (datedRows.length > 0) {
    return datedRows[0];
  }

  return new Date(0).toISOString();
}

function buildSavedExercises(setRows: ParsedSetRow[]): SavedExercise[] {
  const byExercise = new Map<string, ParsedSetRow[]>();

  for (const row of setRows) {
    const existing = byExercise.get(row.exercisePageId) ?? [];
    existing.push(row);
    byExercise.set(row.exercisePageId, existing);
  }

  const exercises: SavedExercise[] = [];

  for (const [exercisePageId, rows] of byExercise) {
    const dedupedBySetNo = new Map<number, ParsedSetRow>();
    for (const row of rows.sort(compareSetRows)) {
      if (!dedupedBySetNo.has(row.setNo)) {
        dedupedBySetNo.set(row.setNo, row);
      }
    }

    const sortedSets = Array.from(dedupedBySetNo.values()).sort(
      (a, b) => a.setNo - b.setNo,
    );
    if (sortedSets.length === 0) continue;

    const firstRow = sortedSets[0];
    exercises.push({
      id: exercisePageId,
      name: firstRow.exerciseName,
      exercisePageId,
      sets: sortedSets.map((row) => ({
        setNo: row.setNo,
        weight: row.weight,
        reps: row.reps,
        memo: row.memo,
        equipment: row.equipment,
      })),
    });
  }

  return exercises.sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

export function buildSessionsFromNotion(
  input: BuildSessionsFromNotionInput,
): Session[] {
  const sessionMetaByPageId = buildSessionMetaByPageId(input.sessionPages);
  const rowsBySessionId = new Map<string, ParsedSetRow[]>();

  for (const page of input.setPages) {
    const parsed = parseNotionSetRow(page, input.exerciseNameByPageId);
    if (!parsed) continue;

    const sessionMeta = sessionMetaByPageId.get(parsed.sessionPageId);
    if (!sessionMeta) continue;

    const existing = rowsBySessionId.get(sessionMeta.sessionId) ?? [];
    existing.push(parsed);
    rowsBySessionId.set(sessionMeta.sessionId, existing);
  }

  const sessions: Session[] = [];

  for (const [, setRows] of rowsBySessionId) {
    if (setRows.length === 0) continue;

    const sessionMeta = sessionMetaByPageId.get(setRows[0].sessionPageId);
    if (!sessionMeta) continue;

    const exercises = buildSavedExercises(setRows);
    if (exercises.length === 0) continue;

    sessions.push({
      id: sessionMeta.sessionId,
      savedAt: pickSavedAt(sessionMeta, setRows),
      sessionName: sessionMeta.sessionName,
      exercises: exercises.map((exercise) => ({
        ...exercise,
        part: setRows.find((row) => row.exercisePageId === exercise.exercisePageId)
          ?.part,
      })),
    });
  }

  return sessions.sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  );
}
