import {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { EMPTY_SCHEMA, Person, Schema, Skill, Edge } from "./types";
import * as storage from "./storage";
import { newId } from "./utils/ids";

// ---------- actions ----------

export type Action =
  | { type: "REPLACE"; schema: Schema }
  | { type: "RESET" }
  | { type: "ADD_PERSON"; name: string }
  | { type: "RENAME_PERSON"; personId: string; name: string }
  | {
      type: "UPDATE_PERSON_DESCRIPTION";
      personId: string;
      description: string;
    }
  | { type: "DELETE_PERSON"; personId: string }
  | { type: "SELECT_PERSON"; personId: string }
  | {
      type: "ADD_SKILL";
      personId: string;
      label: string;
      category: string;
      level: Skill["level"];
      notes?: string;
    }
  | {
      type: "UPDATE_SKILL";
      personId: string;
      skillId: string;
      patch: Partial<Omit<Skill, "id">>;
    }
  | { type: "DELETE_SKILL"; personId: string; skillId: string }
  | {
      type: "MOVE_SKILL";
      personId: string;
      skillId: string;
      position: { x: number; y: number };
    }
  | {
      type: "ADD_EDGE";
      personId: string;
      source: string;
      target: string;
      relation: Edge["relation"];
    }
  | { type: "UPDATE_EDGE"; personId: string; edgeId: string; relation: Edge["relation"] }
  | { type: "DELETE_EDGE"; personId: string; edgeId: string };

// ---------- reducer ----------

function reducer(state: Schema, action: Action): Schema {
  switch (action.type) {
    case "REPLACE":
      return action.schema;
    case "RESET":
      return EMPTY_SCHEMA;
    case "ADD_PERSON": {
      const person: Person = {
        id: newId(),
        name: action.name.trim() || "Untitled",
        skills: [],
        edges: [],
      };
      return {
        ...state,
        people: [...state.people, person],
        activePersonId: state.activePersonId ?? person.id,
      };
    }
    case "RENAME_PERSON":
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.personId ? { ...p, name: action.name.trim() || p.name } : p,
        ),
      };
    case "UPDATE_PERSON_DESCRIPTION":
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.personId
            ? { ...p, description: action.description.trim() || undefined }
            : p,
        ),
      };
    case "DELETE_PERSON": {
      const people = state.people.filter((p) => p.id !== action.personId);
      const activePersonId =
        state.activePersonId === action.personId
          ? (people[0]?.id ?? null)
          : state.activePersonId;
      return { ...state, people, activePersonId };
    }
    case "SELECT_PERSON":
      return { ...state, activePersonId: action.personId };
    case "ADD_SKILL": {
      const skill: Skill = {
        id: newId(),
        label: action.label.trim() || "Untitled skill",
        category: action.category.trim() || "General",
        level: action.level,
        notes: action.notes?.trim() || undefined,
        // Stagger initial positions so new nodes don't all stack on top of each other.
        position: {
          x: 60 + Math.random() * 220,
          y: 60 + Math.random() * 180,
        },
      };
      return mapPerson(state, action.personId, (p) => ({
        ...p,
        skills: [...p.skills, skill],
      }));
    }
    case "UPDATE_SKILL":
      return mapPerson(state, action.personId, (p) => ({
        ...p,
        skills: p.skills.map((s) =>
          s.id === action.skillId ? { ...s, ...action.patch } : s,
        ),
      }));
    case "DELETE_SKILL":
      return mapPerson(state, action.personId, (p) => ({
        ...p,
        skills: p.skills.filter((s) => s.id !== action.skillId),
        edges: p.edges.filter(
          (e) => e.source !== action.skillId && e.target !== action.skillId,
        ),
      }));
    case "MOVE_SKILL":
      return mapPerson(state, action.personId, (p) => ({
        ...p,
        skills: p.skills.map((s) =>
          s.id === action.skillId ? { ...s, position: action.position } : s,
        ),
      }));
    case "ADD_EDGE": {
      if (action.source === action.target) return state;
      const edge: Edge = {
        id: newId(),
        source: action.source,
        target: action.target,
        relation: action.relation,
      };
      return mapPerson(state, action.personId, (p) => ({
        ...p,
        edges: [...p.edges, edge],
      }));
    }
    case "UPDATE_EDGE":
      return mapPerson(state, action.personId, (p) => ({
        ...p,
        edges: p.edges.map((e) =>
          e.id === action.edgeId ? { ...e, relation: action.relation } : e,
        ),
      }));
    case "DELETE_EDGE":
      return mapPerson(state, action.personId, (p) => ({
        ...p,
        edges: p.edges.filter((e) => e.id !== action.edgeId),
      }));
    default:
      return state;
  }
}

function mapPerson(
  state: Schema,
  personId: string,
  fn: (p: Person) => Person,
): Schema {
  return {
    ...state,
    people: state.people.map((p) => (p.id === personId ? fn(p) : p)),
  };
}

// ---------- context ----------

interface Store {
  schema: Schema;
  dispatch: Dispatch<Action>;
  activePerson: Person | null;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [schema, dispatch] = useReducer(reducer, EMPTY_SCHEMA, () => storage.load());

  // Persist on every change.
  useEffect(() => {
    storage.save(schema);
  }, [schema]);

  const activePerson =
    schema.people.find((p) => p.id === schema.activePersonId) ?? null;

  return (
    <StoreContext.Provider value={{ schema, dispatch, activePerson }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}
