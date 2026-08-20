import { useState } from "react";
import { useStore } from "./store";
import { PeopleSidebar } from "./components/PeopleSidebar";
import { SkillPanel } from "./components/SkillPanel";
import { SkillGraph } from "./components/SkillGraph";
import { EdgeEditor } from "./components/EdgeEditor";
import { Toolbar } from "./components/Toolbar";

type Tab = "graph" | "skills" | "edges";

export function App() {
  const { schema, activePerson } = useStore();
  const [tab, setTab] = useState<Tab>("graph");

  const hasAnyData = schema.people.length > 0;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <span className="brand-name">Mindcode</span>
          <span className="brand-sub">skill maps</span>
        </div>
        <Toolbar />
      </header>

      <div className="layout">
        <aside className="sidebar">
          <PeopleSidebar />
        </aside>

        <main className="main">
          {!hasAnyData || !activePerson ? (
            <EmptyState />
          ) : (
            <>
              <div className="person-header">
                <div>
                  <h1 className="person-name">{activePerson.name}</h1>
                  {activePerson.description && (
                    <p className="person-desc">{activePerson.description}</p>
                  )}
                </div>
                <nav className="tabs" role="tablist">
                  <TabButton
                    current={tab}
                    value="graph"
                    onSelect={setTab}
                    label="Graph"
                  />
                  <TabButton
                    current={tab}
                    value="skills"
                    onSelect={setTab}
                    label={`Skills (${activePerson.skills.length})`}
                  />
                  <TabButton
                    current={tab}
                    value="edges"
                    onSelect={setTab}
                    label={`Edges (${activePerson.edges.length})`}
                  />
                </nav>
              </div>

              <div className="tab-content">
                {tab === "graph" && <SkillGraph />}
                {tab === "skills" && <SkillPanel />}
                {tab === "edges" && <EdgeEditor />}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function TabButton(props: {
  current: Tab;
  value: Tab;
  label: string;
  onSelect: (t: Tab) => void;
}) {
  const active = props.current === props.value;
  return (
    <button
      role="tab"
      aria-selected={active}
      className={`tab ${active ? "tab-active" : ""}`}
      onClick={() => props.onSelect(props.value)}
    >
      {props.label}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="empty">
      <div className="empty-card">
        <h2>No skill map yet</h2>
        <p>
          Add your first person from the sidebar to start mapping skills.
          Everything is saved locally in your browser.
        </p>
      </div>
    </div>
  );
}
