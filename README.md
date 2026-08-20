# Mindcode

Interactive skill map app. Build skill maps for people and visualize them as a graph.

## Features

- **Multiple people** — keep a skill map for each person in one document.
- **Skill graph** — nodes are skills, edges show relationships (prerequisite, related, leads-to). Nodes are colored by category and sized by proficiency.
- **Drag-to-position** — node positions persist automatically.
- **Local-first** — everything is stored in your browser via `localStorage`. No backend, no account.
- **Export / Import JSON** — back up or share a skill map with one file.

## Quick start

```bash
npm install
npm run dev     # opens http://localhost:5173
npm run build   # produces dist/
```

Open the app and:

1. Click **+ Person** in the sidebar to create your first profile.
2. Use the **Add Skill** panel to add skills with a label, category, and level (1–5).
3. Switch to the **Graph** view to see the network. Drag nodes around to lay it out.
4. Use **Export JSON** in the toolbar to back up.

## Data model

Everything is one JSON document stored under the `mindcode.v1` `localStorage` key:

```ts
type Schema = {
  version: 1;
  people: Person[];
  activePersonId: string | null;
};

type Person = {
  id: string;
  name: string;
  description?: string;
  skills: Skill[];
  edges: Edge[];
};

type Skill = {
  id: string;
  label: string;
  category: string;
  level: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  position?: { x: number; y: number };
};

type Edge = {
  id: string;
  source: string;
  target: string;
  relation: "prerequisite" | "related" | "leads-to";
};
```

## Tech

- React 18 + TypeScript
- Vite
- [React Flow](https://reactflow.dev/) for the interactive graph
- Plain CSS

## License

MIT
