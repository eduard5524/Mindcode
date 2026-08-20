import { useState } from "react";
import { useStore } from "../store";

export function PeopleSidebar() {
  const { schema, dispatch, activePerson } = useStore();
  const [draftName, setDraftName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  return (
    <div className="people">
      <div className="people-header">
        <h2>People</h2>
        <span className="muted small">{schema.people.length}</span>
      </div>

      <ul className="people-list">
        {schema.people.map((person) => {
          const isActive = person.id === schema.activePersonId;
          const isEditing = editingId === person.id;

          return (
            <li
              key={person.id}
              className={`person-row ${isActive ? "person-active" : ""}`}
            >
              {isEditing ? (
                <form
                  className="row-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    dispatch({
                      type: "RENAME_PERSON",
                      personId: person.id,
                      name: editingName,
                    });
                    setEditingId(null);
                  }}
                >
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <button
                    className="person-select"
                    onClick={() =>
                      dispatch({ type: "SELECT_PERSON", personId: person.id })
                    }
                    title={`${person.skills.length} skills, ${person.edges.length} edges`}
                  >
                    <span className="person-name-row">{person.name}</span>
                    <span className="person-meta">
                      {person.skills.length} skills · {person.edges.length}{" "}
                      edges
                    </span>
                  </button>
                  <div className="row-actions">
                    <button
                      className="icon-btn"
                      title="Rename"
                      onClick={() => {
                        setEditingId(person.id);
                        setEditingName(person.name);
                      }}
                    >
                      ✎
                    </button>
                    <button
                      className="icon-btn danger"
                      title="Delete"
                      onClick={() => {
                        if (
                          activePerson?.id === person.id &&
                          !window.confirm(
                            `Delete "${person.name}" and all their skills?`,
                          )
                        )
                          return;
                        if (
                          activePerson?.id !== person.id &&
                          !window.confirm(`Delete "${person.name}"?`)
                        )
                          return;
                        dispatch({
                          type: "DELETE_PERSON",
                          personId: person.id,
                        });
                      }}
                    >
                      ×
                    </button>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>

      <form
        className="add-person"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draftName.trim()) return;
          dispatch({ type: "ADD_PERSON", name: draftName });
          setDraftName("");
        }}
      >
        <input
          placeholder="Add a person…"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          + Person
        </button>
      </form>
    </div>
  );
}
