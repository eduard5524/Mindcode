export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export type EdgeRelation = "prerequisite" | "related" | "leads-to";

export interface Skill {
  id: string;
  label: string;
  category: string;
  level: SkillLevel;
  notes?: string;
  position?: { x: number; y: number };
}

export interface Edge {
  id: string;
  source: string; // Skill.id
  target: string; // Skill.id
  relation: EdgeRelation;
}

export interface Person {
  id: string;
  name: string;
  description?: string;
  skills: Skill[];
  edges: Edge[];
}

export interface Schema {
  version: 1;
  people: Person[];
  activePersonId: string | null;
}

export const EMPTY_SCHEMA: Schema = {
  version: 1,
  people: [],
  activePersonId: null,
};
