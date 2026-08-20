import { EMPTY_SCHEMA, Edge, Person, Schema, Skill } from "./types";

const STORAGE_KEY = "mindcode.v1";

// ---------- localStorage ----------

export function load(): Schema {
  if (typeof window === "undefined") return EMPTY_SCHEMA;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_SCHEMA;
    const parsed = JSON.parse(raw) as unknown;
    return migrateAndValidate(parsed);
  } catch (err) {
    console.warn("Mindcode: failed to load saved data, starting fresh.", err);
    return EMPTY_SCHEMA;
  }
}

export function save(schema: Schema): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(schema));
  } catch (err) {
    console.error("Mindcode: failed to save to localStorage.", err);
  }
}

export function clear(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

// ---------- import / export ----------

export function exportJSON(schema: Schema): string {
  return JSON.stringify(schema, null, 2);
}

export function downloadJSON(schema: Schema, filename: string): void {
  const blob = new Blob([exportJSON(schema)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importJSON(text: string): Schema {
  const parsed = JSON.parse(text) as unknown;
  return migrateAndValidate(parsed);
}

// ---------- validation / migration ----------

class ValidationError extends Error {}

function migrateAndValidate(input: unknown): Schema {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError("Root must be an object.");
  }
  const obj = input as Record<string, unknown>;

  if (obj.version !== 1) {
    throw new ValidationError(
      `Unsupported schema version: ${String(obj.version)}. Expected 1.`,
    );
  }
  if (!Array.isArray(obj.people)) {
    throw new ValidationError('"people" must be an array.');
  }

  const people: Person[] = (obj.people as unknown[]).map((p, i) =>
    validatePerson(p, i),
  );

  const activePersonId =
    typeof obj.activePersonId === "string" ? obj.activePersonId : null;

  // Drop dangling edges and warn.
  for (const person of people) {
    const skillIds = new Set(person.skills.map((s) => s.id));
    const kept: Edge[] = [];
    for (const edge of person.edges) {
      if (!skillIds.has(edge.source) || !skillIds.has(edge.target)) {
        console.warn(
          `Mindcode: dropping edge ${edge.id} (references missing skill).`,
        );
        continue;
      }
      if (edge.source === edge.target) {
        console.warn(`Mindcode: dropping self-loop edge ${edge.id}.`);
        continue;
      }
      kept.push(edge);
    }
    person.edges = kept;
  }

  // Drop activePersonId if it doesn't exist anymore.
  const finalActive =
    activePersonId && people.some((p) => p.id === activePersonId)
      ? activePersonId
      : (people[0]?.id ?? null);

  return { version: 1, people, activePersonId: finalActive };
}

function validatePerson(input: unknown, index: number): Person {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError(`people[${index}] must be an object.`);
  }
  const obj = input as Record<string, unknown>;

  if (typeof obj.id !== "string" || !obj.id) {
    throw new ValidationError(`people[${index}].id must be a string.`);
  }
  if (typeof obj.name !== "string") {
    throw new ValidationError(`people[${index}].name must be a string.`);
  }
  if (!Array.isArray(obj.skills)) {
    throw new ValidationError(`people[${index}].skills must be an array.`);
  }
  if (!Array.isArray(obj.edges)) {
    throw new ValidationError(`people[${index}].edges must be an array.`);
  }

  const skills = (obj.skills as unknown[]).map((s, i) =>
    validateSkill(s, index, i),
  );

  // Detect duplicate skill IDs within a person.
  const seen = new Set<string>();
  for (const s of skills) {
    if (seen.has(s.id)) {
      throw new ValidationError(
        `people[${index}] has duplicate skill id ${s.id}.`,
      );
    }
    seen.add(s.id);
  }

  const edges = (obj.edges as unknown[]).map((e, i) =>
    validateEdge(e, index, i),
  );

  return {
    id: obj.id,
    name: obj.name,
    description:
      typeof obj.description === "string" ? obj.description : undefined,
    skills,
    edges,
  };
}

function validateSkill(input: unknown, personIndex: number, i: number): Skill {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError(
      `people[${personIndex}].skills[${i}] must be an object.`,
    );
  }
  const obj = input as Record<string, unknown>;
  if (typeof obj.id !== "string" || !obj.id) {
    throw new ValidationError(
      `people[${personIndex}].skills[${i}].id must be a string.`,
    );
  }
  if (typeof obj.label !== "string") {
    throw new ValidationError(
      `people[${personIndex}].skills[${i}].label must be a string.`,
    );
  }
  if (typeof obj.category !== "string") {
    throw new ValidationError(
      `people[${personIndex}].skills[${i}].category must be a string.`,
    );
  }
  const lvl = Number(obj.level);
  if (!Number.isInteger(lvl) || lvl < 1 || lvl > 5) {
    throw new ValidationError(
      `people[${personIndex}].skills[${i}].level must be 1–5.`,
    );
  }
  const skill: Skill = {
    id: obj.id,
    label: obj.label,
    category: obj.category || "General",
    level: lvl as Skill["level"],
    notes: typeof obj.notes === "string" ? obj.notes : undefined,
  };
  if (
    obj.position &&
    typeof obj.position === "object" &&
    obj.position !== null &&
    typeof (obj.position as Record<string, unknown>).x === "number" &&
    typeof (obj.position as Record<string, unknown>).y === "number"
  ) {
    skill.position = {
      x: (obj.position as Record<string, number>).x,
      y: (obj.position as Record<string, number>).y,
    };
  }
  return skill;
}

function validateEdge(input: unknown, personIndex: number, i: number): Edge {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError(
      `people[${personIndex}].edges[${i}] must be an object.`,
    );
  }
  const obj = input as Record<string, unknown>;
  if (typeof obj.id !== "string" || !obj.id) {
    throw new ValidationError(
      `people[${personIndex}].edges[${i}].id must be a string.`,
    );
  }
  if (typeof obj.source !== "string" || typeof obj.target !== "string") {
    throw new ValidationError(
      `people[${personIndex}].edges[${i}] must have source/target strings.`,
    );
  }
  if (
    obj.relation !== "prerequisite" &&
    obj.relation !== "related" &&
    obj.relation !== "leads-to"
  ) {
    throw new ValidationError(
      `people[${personIndex}].edges[${i}].relation must be prerequisite | related | leads-to.`,
    );
  }
  return {
    id: obj.id,
    source: obj.source,
    target: obj.target,
    relation: obj.relation,
  };
}
