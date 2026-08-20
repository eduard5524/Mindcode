import { useRef } from "react";
import { useStore } from "../store";
import * as storage from "../storage";

export function Toolbar() {
  const { schema, dispatch, activePerson } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const filename = activePerson
      ? `mindcode-${slug(activePerson.name)}.json`
      : `mindcode-${dateStamp()}.json`;
    storage.downloadJSON(schema, filename);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    try {
      const text = await file.text();
      const imported = storage.importJSON(text);
      if (
        !window.confirm(
          `Replace current data with the imported file (${imported.people.length} people)? This cannot be undone.`,
        )
      )
        return;
      dispatch({ type: "REPLACE", schema: imported });
    } catch (err) {
      window.alert(
        `Could not import file:\n${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const handleReset = () => {
    if (
      !window.confirm(
        "Delete all people, skills, and edges from this browser? This cannot be undone.",
      )
    )
      return;
    dispatch({ type: "RESET" });
    storage.clear();
  };

  return (
    <div className="toolbar">
      <button className="btn" onClick={handleExport} title="Download JSON">
        ⬇ Export JSON
      </button>
      <button className="btn" onClick={handleImportClick} title="Load a JSON file">
        ⬆ Import JSON
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        style={{ display: "none" }}
        onChange={handleImportFile}
      />
      <button className="btn btn-danger" onClick={handleReset} title="Wipe all data">
        Reset
      </button>
    </div>
  );
}

function slug(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled"
  );
}

function dateStamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}
