import { useState } from "react";
import { useStore } from "../store";
import { EdgeRelation } from "../types";

const RELATIONS: EdgeRelation[] = ["prerequisite", "related", "leads-to"];

export function EdgeEditor() {
  const { activePerson, dispatch } = useStore();
  if (!activePerson) return null;

  const [draft, setDraft] = useState({
    source: "",
    target: "",
    relation: "related" as EdgeRelation,
  });

  const skillOptions = activePerson.skills;

  return (
    <div className="edge-editor">
      <form
        className="add-edge"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.source || !draft.target || draft.source === draft.target)
            return;
          dispatch({
            type: "ADD_EDGE",
            personId: activePerson.id,
            source: draft.source,
            target: draft.target,
            relation: draft.relation,
          });
          setDraft({ source: "", target: "", relation: "related" });
        }}
      >
        <select
          value={draft.source}
          onChange={(e) => setDraft({ ...draft, source: e.target.value })}
        >
          <option value="">From skill…</option>
          {skillOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="arrow" aria-hidden>
          →
        </span>
        <select
          value={draft.target}
          onChange={(e) => setDraft({ ...draft, target: e.target.value })}
        >
          <option value="">To skill…</option>
          {skillOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={draft.relation}
          onChange={(e) =>
            setDraft({ ...draft, relation: e.target.value as EdgeRelation })
          }
        >
          {RELATIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          + Add edge
        </button>
      </form>

      {activePerson.edges.length === 0 ? (
        <p className="muted">
          No edges yet. Edges connect skills — for example, "JavaScript →
          React (prerequisite)". You can also drag from one node to another
          directly in the Graph view.
        </p>
      ) : (
        <ul className="edge-list">
          {activePerson.edges.map((edge) => {
            const source = activePerson.skills.find((s) => s.id === edge.source);
            const target = activePerson.skills.find((s) => s.id === edge.target);
            if (!source || !target) return null;
            return (
              <li key={edge.id} className="edge-row">
                <span className="edge-from">{source.label}</span>
                <select
                  className="edge-relation-select"
                  value={edge.relation}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_EDGE",
                      personId: activePerson.id,
                      edgeId: edge.id,
                      relation: e.target.value as EdgeRelation,
                    })
                  }
                >
                  {RELATIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <span className="edge-to">{target.label}</span>
                <button
                  className="icon-btn danger"
                  title="Delete edge"
                  onClick={() =>
                    dispatch({
                      type: "DELETE_EDGE",
                      personId: activePerson.id,
                      edgeId: edge.id,
                    })
                  }
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
