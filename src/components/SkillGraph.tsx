import { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Connection,
  Controls,
  Edge as RFEdge,
  MarkerType,
  MiniMap,
  Node,
  NodeChange,
  applyNodeChanges,
} from "reactflow";
import { useStore } from "../store";
import { Edge, Skill } from "../types";

// Stable, vivid palette. Cycles for unknown categories.
const PALETTE = [
  "#6366f1", // indigo
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#a855f7", // purple
  "#ec4899", // pink
  "#84cc16", // lime
];

function colorForCategory(category: string, allCategories: string[]): string {
  const idx = allCategories.indexOf(category);
  if (idx === -1) return PALETTE[0];
  return PALETTE[idx % PALETTE.length];
}

function SkillNode(props: { data: SkillNodeData }) {
  const { skill, color } = props.data;
  const size = 56 + skill.level * 8; // 64..96px
  return (
    <div
      className="skill-node"
      style={{
        width: size,
        height: size,
        borderColor: color,
        background: `${color}22`,
      }}
      title={`${skill.label} · ${skill.category} · Level ${skill.level}${
        skill.notes ? `\n${skill.notes}` : ""
      }`}
    >
      <div className="skill-node-label" style={{ color }}>
        {skill.label}
      </div>
      <div className="skill-node-level">L{skill.level}</div>
    </div>
  );
}

interface SkillNodeData {
  skill: Skill;
  color: string;
}

const nodeTypes = { skill: SkillNode };

export function SkillGraph() {
  const { activePerson, dispatch } = useStore();
  if (!activePerson) return null;

  const categories = useMemo(() => {
    return Array.from(
      new Set(activePerson.skills.map((s) => s.category || "General")),
    );
  }, [activePerson.skills]);

  const nodes: Node<SkillNodeData>[] = useMemo(
    () =>
      activePerson.skills.map((skill, i) => ({
        id: skill.id,
        type: "skill",
        position: skill.position ?? { x: 80 + (i % 4) * 160, y: 80 + Math.floor(i / 4) * 140 },
        data: {
          skill,
          color: colorForCategory(skill.category || "General", categories),
        },
      })),
    [activePerson.skills, categories],
  );

  const edges: RFEdge[] = useMemo(
    () =>
      activePerson.edges.map((edge: Edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.relation,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: strokeForRelation(edge.relation),
        labelStyle: { fontSize: 11 },
      })),
    [activePerson.edges],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // We only persist position drags. Ignore selection/etc.
      for (const change of changes) {
        if (change.type === "position" && change.position && change.dragging === false) {
          dispatch({
            type: "MOVE_SKILL",
            personId: activePerson.id,
            skillId: change.id,
            position: { x: change.position.x, y: change.position.y },
          });
        }
      }
      // Allow React Flow to apply its internal updates without us re-rendering nodes from store.
      applyNodeChanges(changes, nodes);
    },
    [activePerson.id, dispatch, nodes],
  );

  const onConnect = useCallback(
    (conn: Connection) => {
      if (!conn.source || !conn.target) return;
      dispatch({
        type: "ADD_EDGE",
        personId: activePerson.id,
        source: conn.source,
        target: conn.target,
        relation: "related",
      });
    },
    [activePerson.id, dispatch],
  );

  if (activePerson.skills.length === 0) {
    return (
      <p className="muted">
        No skills yet. Switch to the <strong>Skills</strong> tab to add some —
        once you do, they'll appear here as a graph you can lay out by dragging.
      </p>
    );
  }

  return (
    <div className="graph-wrap">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        fitView
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} size={1} />
        <Controls position="bottom-right" showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => (n.data?.color as string) ?? "#6366f1"}
        />
      </ReactFlow>
    </div>
  );
}

function strokeForRelation(rel: Edge["relation"]) {
  switch (rel) {
    case "prerequisite":
      return { stroke: "#ef4444", strokeWidth: 1.5 };
    case "leads-to":
      return { stroke: "#10b981", strokeWidth: 1.5 };
    default:
      return { stroke: "#6b7280", strokeWidth: 1.2 };
  }
}
