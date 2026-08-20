import { useMemo, useState } from "react";
import { useStore } from "../store";
import { Skill, SkillLevel } from "../types";

const LEVELS: SkillLevel[] = [1, 2, 3, 4, 5];

export function SkillPanel() {
  const { activePerson, dispatch } = useStore();
  if (!activePerson) return null;

  const [draft, setDraft] = useState<{
    label: string;
    category: string;
    level: SkillLevel;
    notes: string;
  }>({
    label: "",
    category: "",
    level: 3,
    notes: "",
  });

  const grouped = useMemo(() => {
    const map = new Map<string, Skill[]>();
    for (const skill of activePerson.skills) {
      const key = skill.category || "General";
      const list = map.get(key) ?? [];
      list.push(skill);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [activePerson.skills]);

  const knownCategories = useMemo(
    () => Array.from(new Set(activePerson.skills.map((s) => s.category))).sort(),
    [activePerson.skills],
  );

  return (
    <div className="skill-panel">
      <form
        className="add-skill"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.label.trim()) return;
          dispatch({
            type: "ADD_SKILL",
            personId: activePerson.id,
            label: draft.label,
            category: draft.category,
            level: draft.level,
            notes: draft.notes,
          });
          setDraft({ label: "", category: draft.category, level: 3, notes: "" });
        }}
      >
        <input
          placeholder="Skill name (e.g. TypeScript)"
          value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
        />
        <input
          list="category-list"
          placeholder="Category (e.g. Languages)"
          value={draft.category}
          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
        />
        <datalist id="category-list">
          {knownCategories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <select
          value={draft.level}
          onChange={(e) =>
            setDraft({ ...draft, level: Number(e.target.value) as SkillLevel })
          }
          title="Proficiency"
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              Level {l}
            </option>
          ))}
        </select>
        <input
          placeholder="Notes (optional)"
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        />
        <button type="submit" className="btn btn-primary">
          + Add skill
        </button>
      </form>

      {grouped.length === 0 ? (
        <p className="muted">No skills yet. Add the first one above.</p>
      ) : (
        <div className="skill-groups">
          {grouped.map(([category, skills]) => (
            <section key={category} className="skill-group">
              <h3 className="skill-group-title">
                <span className="category-dot" aria-hidden /> {category}
                <span className="muted small"> · {skills.length}</span>
              </h3>
              <ul className="skill-list">
                {skills
                  .sort((a, b) => b.level - a.level)
                  .map((skill) => (
                    <SkillRow
                      key={skill.id}
                      skill={skill}
                      personId={activePerson.id}
                    />
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function SkillRow({ skill, personId }: { skill: Skill; personId: string }) {
  const { dispatch } = useStore();
  return (
    <li className="skill-row">
      <input
        className="skill-label-input"
        value={skill.label}
        onChange={(e) =>
          dispatch({
            type: "UPDATE_SKILL",
            personId,
            skillId: skill.id,
            patch: { label: e.target.value },
          })
        }
      />
      <select
        className="skill-level-select"
        value={skill.level}
        onChange={(e) =>
          dispatch({
            type: "UPDATE_SKILL",
            personId,
            skillId: skill.id,
            patch: { level: Number(e.target.value) as SkillLevel },
          })
        }
      >
        {LEVELS.map((l) => (
          <option key={l} value={l}>
            L{l}
          </option>
        ))}
      </select>
      <input
        className="skill-notes-input"
        placeholder="Notes"
        value={skill.notes ?? ""}
        onChange={(e) =>
          dispatch({
            type: "UPDATE_SKILL",
            personId,
            skillId: skill.id,
            patch: { notes: e.target.value },
          })
        }
      />
      <button
        className="icon-btn danger"
        title="Delete"
        onClick={() => {
          if (!window.confirm(`Delete "${skill.label}"?`)) return;
          dispatch({ type: "DELETE_SKILL", personId, skillId: skill.id });
        }}
      >
        ×
      </button>
    </li>
  );
}
