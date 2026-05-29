import "reactflow/dist/style.css";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  ReactFlowProvider,
  Handle,
  Position,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeProps,
} from "reactflow";
import type { CanvasData, Stage } from "@/lib/recipes";
import { uid } from "@/lib/recipes";

interface Props {
  stages: Stage[];
  canvas: CanvasData;
  onStagesChange: (stages: Stage[]) => void;
  onCanvasChange: (canvas: CanvasData) => void;
}

interface NodePayload {
  stage: Stage;
  onEdit: (id: string, patch: Partial<Stage>) => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1.5 last:mb-0">
      <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-[rgba(150,220,230,0.55)]">
        {label}
      </div>
      {children}
    </div>
  );
}

function StageNode({ data, selected }: NodeProps<NodePayload>) {
  const { stage, onEdit } = data;
  const [editing, setEditing] = useState(false);
  return (
    <div
      className={
        "glass-card rounded-md p-3 w-64 transition-all duration-200 " +
        (selected
          ? "border border-[#39ff14] shadow-[0_0_22px_rgba(57,255,20,0.6)]"
          : "neon-border hover:shadow-[0_0_22px_rgba(0,245,255,0.55)]")
      }
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#00f5ff", boxShadow: "0 0 8px #00f5ff" }}
      />
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[rgba(150,220,230,0.7)]">
          stage
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#39ff14] shadow-[0_0_6px_#39ff14]" />
      </div>
      {editing ? (
        <input
          autoFocus
          className="input-neon mb-2 nodrag"
          value={stage.name}
          onChange={(e) => onEdit(stage.id, { name: e.target.value })}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setEditing(false);
          }}
        />
      ) : (
        <h3
          className="font-display text-sm text-cyan-glow mb-2 break-words cursor-text"
          onDoubleClick={() => setEditing(true)}
          title="Double-click to rename"
        >
          {stage.name || "Unnamed"}
        </h3>
      )}
      <Row label="Inputs">
        <textarea
          className="input-neon nodrag text-xs min-h-[36px]"
          value={stage.chemicals}
          onChange={(e) => onEdit(stage.id, { chemicals: e.target.value })}
        />
      </Row>
      <Row label="Conditions">
        <textarea
          className="input-neon nodrag text-xs min-h-[36px]"
          value={stage.conditions}
          onChange={(e) => onEdit(stage.id, { conditions: e.target.value })}
        />
      </Row>
      <Row label="Output">
        <textarea
          className="input-neon nodrag text-xs min-h-[36px]"
          value={stage.output}
          onChange={(e) => onEdit(stage.id, { output: e.target.value })}
        />
      </Row>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#39ff14", boxShadow: "0 0 8px #39ff14" }}
      />
    </div>
  );
}

// MUST be module-level — recreating these inside the component triggers
// React Flow's StoreUpdater into an infinite setState loop.
const nodeTypes = { stage: StageNode };
const edgeTypes = {};

const EDGE_STYLE = {
  animated: true,
  type: "smoothstep",
  style: { stroke: "#00f5ff", strokeWidth: 2, strokeDasharray: "6 4" },
  labelBgStyle: { fill: "#010812", stroke: "#00f5ff", strokeWidth: 1 },
  labelStyle: {
    fill: "#00f5ff",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
  },
  labelBgPadding: [6, 4] as [number, number],
  labelBgBorderRadius: 4,
  markerEnd: { type: "arrowclosed", color: "#00f5ff" } as never,
};

function buildNodes(
  stages: Stage[],
  canvas: CanvasData,
  onEdit: (id: string, patch: Partial<Stage>) => void
): Node<NodePayload>[] {
  const posMap = new Map<string, { x: number; y: number }>();
  (canvas?.nodes ?? []).forEach((n) => posMap.set(n.id, n.position));
  return stages.map((s, i) => ({
    id: s.id,
    type: "stage",
    position:
      posMap.get(s.id) ?? {
        x: 80 + (i % 3) * 320,
        y: 80 + Math.floor(i / 3) * 280,
      },
    data: { stage: s, onEdit },
  }));
}

function buildEdges(canvas: CanvasData): Edge[] {
  return (canvas?.edges ?? []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    ...EDGE_STYLE,
  }));
}

function CanvasInner({ stages, canvas, onStagesChange, onCanvasChange }: Props) {
  // Refs to latest props/state so handlers stay stable with [] deps.
  const stagesRef = useRef(stages);
  const onStagesChangeRef = useRef(onStagesChange);
  const onCanvasChangeRef = useRef(onCanvasChange);

  const editStage = useCallback((id: string, patch: Partial<Stage>) => {
    const next = stagesRef.current.map((s) =>
      s.id === id ? { ...s, ...patch } : s
    );
    onStagesChangeRef.current(next);
  }, []);

  // Internal state — NOT derived from props on each render.
  const [nodes, setNodes] = useState<Node<NodePayload>[]>(() =>
    buildNodes(stages, canvas, editStage)
  );
  const [edges, setEdges] = useState<Edge[]>(() => buildEdges(canvas));
  const [selected, setSelected] = useState<{ nodes: string[]; edges: string[] }>(
    { nodes: [], edges: [] }
  );

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => {
    stagesRef.current = stages;
    onStagesChangeRef.current = onStagesChange;
    onCanvasChangeRef.current = onCanvasChange;
    nodesRef.current = nodes;
    edgesRef.current = edges;
  });

  // Sync internal state when stage set changes from the outside
  // (e.g. new block added externally) — keyed off length + id signature only.
  const stageSig = stages.map((s) => s.id).join("|");
  useEffect(() => {
    setNodes((current) => {
      const byId = new Map(current.map((n) => [n.id, n]));
      return stages.map((s, i) => {
        const existing = byId.get(s.id);
        if (existing) {
          return { ...existing, data: { stage: s, onEdit: editStage } };
        }
        return {
          id: s.id,
          type: "stage",
          position: {
            x: 80 + (current.length + i) * 60,
            y: 80 + (current.length + i) * 40,
          },
          data: { stage: s, onEdit: editStage },
        };
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageSig]);

  const persistCanvas = (nextNodes: Node[], nextEdges: Edge[]) => {
    onCanvasChangeRef.current({
      nodes: nextNodes.map((n) => ({
        id: n.id,
        position: n.position,
        data: { stageId: n.id },
      })),
      edges: nextEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: typeof e.label === "string" ? e.label : undefined,
      })),
    });
  };

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    const next = applyNodeChanges(changes, nodesRef.current);
    setNodes(next);
    const shouldPersist = changes.some(
      (c) =>
        (c.type === "position" && (c as { dragging?: boolean }).dragging === false) ||
        c.type === "remove"
    );
    if (shouldPersist) persistCanvas(next, edgesRef.current);
  }, []);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    const next = applyEdgeChanges(changes, edgesRef.current);
    setEdges(next);
    const shouldPersist = changes.some(
      (c) => c.type === "remove" || c.type === "add"
    );
    if (shouldPersist) persistCanvas(nodesRef.current, next);
  }, []);

  const handleConnect = useCallback((conn: Connection) => {
    const next = addEdge(
      { ...conn, id: uid(), ...EDGE_STYLE },
      edgesRef.current
    );
    setEdges(next);
    persistCanvas(nodesRef.current, next);
  }, []);

  const addBlock = () => {
    const newStage: Stage = {
      id: uid(),
      name: "New Stage",
      chemicals: "",
      conditions: "",
      output: "",
    };
    const newNode: Node<NodePayload> = {
      id: newStage.id,
      type: "stage",
      position: {
        x: 100 + nodesRef.current.length * 60,
        y: 100 + nodesRef.current.length * 40,
      },
      data: { stage: newStage, onEdit: editStage },
    };
    const nextNodes = [...nodesRef.current, newNode];
    setNodes(nextNodes);
    onStagesChangeRef.current([...stagesRef.current, newStage]);
    persistCanvas(nextNodes, edgesRef.current);
  };

  const deleteSelected = () => {
    if (selected.nodes.length === 0 && selected.edges.length === 0) return;
    const nextNodes = nodesRef.current.filter(
      (n) => !selected.nodes.includes(n.id)
    );
    const nextEdges = edgesRef.current.filter(
      (e) =>
        !selected.edges.includes(e.id) &&
        !selected.nodes.includes(e.source) &&
        !selected.nodes.includes(e.target)
    );
    setNodes(nextNodes);
    setEdges(nextEdges);
    onStagesChangeRef.current(
      stagesRef.current.filter((s) => !selected.nodes.includes(s.id))
    );
    persistCanvas(nextNodes, nextEdges);
    setSelected({ nodes: [], edges: [] });
  };

  const editLabel = (edgeId: string) => {
    const existing = edgesRef.current.find((e) => e.id === edgeId);
    const current = typeof existing?.label === "string" ? existing.label : "";
    const label = prompt("Edge label:", current);
    if (label === null) return;
    const next = edgesRef.current.map((e) =>
      e.id === edgeId ? { ...e, label: label || undefined } : e
    );
    setEdges(next);
    persistCanvas(nodesRef.current, next);
  };

  return (
    <div
      className="relative glass-card neon-border rounded-md overflow-hidden"
      style={{ height: "70vh", minHeight: 500 }}
    >
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
        <button onClick={addBlock} className="btn-neon btn-neon-green">
          + Add Block
        </button>
        <button
          onClick={deleteSelected}
          className="btn-neon btn-neon-danger"
          disabled={selected.nodes.length === 0 && selected.edges.length === 0}
          style={{
            opacity:
              selected.nodes.length === 0 && selected.edges.length === 0
                ? 0.4
                : 1,
          }}
        >
          ✕ Delete Selected
        </button>
      </div>
      <div className="absolute bottom-3 right-3 z-10 font-mono text-[9px] uppercase tracking-[0.3em] text-[rgba(150,220,230,0.5)] pointer-events-none">
        // double-click node name to rename · click edge to label
      </div>
      <ReactFlow
        nodes={nodes ?? []}
        edges={edges ?? []}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onEdgeClick={(_, edge) => editLabel(edge.id)}
        onSelectionChange={(sel) =>
          setSelected({
            nodes: (sel.nodes ?? []).map((n) => n.id),
            edges: (sel.edges ?? []).map((e) => e.id),
          })
        }
        fitView
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ animated: true, type: "smoothstep" }}
      >
        <Background color="#00f5ff" gap={24} size={1} style={{ opacity: 0.15 }} />
        <MiniMap
          maskColor="rgba(1,8,18,0.85)"
          nodeColor="#00f5ff"
          style={{
            background: "#010812",
            border: "1px solid rgba(0,245,255,0.3)",
          }}
        />
        <Controls
          style={{
            background: "rgba(2,12,26,0.85)",
            border: "1px solid rgba(0,245,255,0.3)",
          }}
        />
      </ReactFlow>
    </div>
  );
}

export function CanvasEditor(props: Props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}