import { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasData, CanvasNode, CanvasEdge, Stage } from "@/lib/recipes";
import { uid } from "@/lib/recipes";

interface Props {
  stages: Stage[];
  canvas: CanvasData;
  onStagesChange: (stages: Stage[]) => void;
  onCanvasChange: (canvas: CanvasData) => void;
}

const NODE_W = 256;
const NODE_H = 220;
const HANDLE_R = 7;

function defaultPos(i: number) {
  return { x: 60 + (i % 3) * 320, y: 60 + Math.floor(i / 3) * 260 };
}

function ensureNodes(stages: Stage[], canvas: CanvasData): CanvasNode[] {
  const existing = new Map((canvas?.nodes ?? []).map((n) => [n.id, n]));
  return stages.map((s, i) => {
    const cur = existing.get(s.id);
    return cur ?? { id: s.id, position: defaultPos(i), data: { stageId: s.id } };
  });
}

export function CanvasEditor({
  stages,
  canvas,
  onStagesChange,
  onCanvasChange,
}: Props) {
  const [nodes, setNodes] = useState<CanvasNode[]>(() =>
    ensureNodes(stages, canvas)
  );
  const [edges, setEdges] = useState<CanvasEdge[]>(() => canvas?.edges ?? []);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null); // source node id for new edge
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(
    null
  );

  // Refs for stable handlers
  const stagesRef = useRef(stages);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const onStagesChangeRef = useRef(onStagesChange);
  const onCanvasChangeRef = useRef(onCanvasChange);
  useEffect(() => {
    stagesRef.current = stages;
    nodesRef.current = nodes;
    edgesRef.current = edges;
    onStagesChangeRef.current = onStagesChange;
    onCanvasChangeRef.current = onCanvasChange;
  });

  // Sync when stage set changes externally
  const stageSig = stages.map((s) => s.id).join("|");
  useEffect(() => {
    setNodes((current) => {
      const byId = new Map(current.map((n) => [n.id, n]));
      const next = stages.map((s, i) => {
        const cur = byId.get(s.id);
        if (cur) return cur;
        return {
          id: s.id,
          position: {
            x: 80 + (current.length + i) * 50,
            y: 80 + (current.length + i) * 40,
          },
          data: { stageId: s.id },
        };
      });
      // Drop nodes whose stage was deleted externally
      return next;
    });
    setEdges((current) => {
      const valid = new Set(stages.map((s) => s.id));
      return current.filter((e) => valid.has(e.source) && valid.has(e.target));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageSig]);

  const persistCanvas = (nextNodes: CanvasNode[], nextEdges: CanvasEdge[]) => {
    onCanvasChangeRef.current({ nodes: nextNodes, edges: nextEdges });
  };

  const editStage = useCallback((id: string, patch: Partial<Stage>) => {
    const next = stagesRef.current.map((s) =>
      s.id === id ? { ...s, ...patch } : s
    );
    onStagesChangeRef.current(next);
  }, []);

  // ===== Drag =====
  const dragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const onNodePointerDown = (e: React.PointerEvent, id: string) => {
    // Ignore drags initiated from form fields / buttons
    const t = e.target as HTMLElement;
    if (t.closest("input,textarea,button,.no-drag")) return;
    const surface = surfaceRef.current;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    const node = nodesRef.current.find((n) => n.id === id);
    if (!node) return;
    dragRef.current = {
      id,
      offsetX: e.clientX - rect.left - node.position.x,
      offsetY: e.clientY - rect.top - node.position.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSelectedNodes([id]);
    setSelectedEdge(null);
  };

  const onNodePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const surface = surfaceRef.current;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left - drag.offsetX);
    const y = Math.max(0, e.clientY - rect.top - drag.offsetY);
    setNodes((curr) =>
      curr.map((n) => (n.id === drag.id ? { ...n, position: { x, y } } : n))
    );
  };

  const onNodePointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    dragRef.current = null;
    persistCanvas(nodesRef.current, edgesRef.current);
  };

  // ===== Edges =====
  const startEdge = (sourceId: string) => {
    setPending(sourceId);
  };

  const completeEdge = (targetId: string) => {
    if (!pending || pending === targetId) {
      setPending(null);
      return;
    }
    const exists = edgesRef.current.some(
      (e) => e.source === pending && e.target === targetId
    );
    if (!exists) {
      const next = [
        ...edgesRef.current,
        { id: uid(), source: pending, target: targetId } as CanvasEdge,
      ];
      setEdges(next);
      persistCanvas(nodesRef.current, next);
    }
    setPending(null);
  };

  const onSurfaceMove = (e: React.PointerEvent) => {
    if (!pending) return;
    const surface = surfaceRef.current;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    setHoverPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const onSurfaceClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedNodes([]);
      setSelectedEdge(null);
      setPending(null);
    }
  };

  const editEdgeLabel = (edgeId: string) => {
    const existing = edgesRef.current.find((e) => e.id === edgeId);
    const label = prompt("Edge label:", existing?.label ?? "");
    if (label === null) return;
    const next = edgesRef.current.map((e) =>
      e.id === edgeId ? { ...e, label: label || undefined } : e
    );
    setEdges(next);
    persistCanvas(nodesRef.current, next);
  };

  // ===== Toolbar actions =====
  const addBlock = () => {
    const newStage: Stage = {
      id: uid(),
      name: "New Stage",
      chemicals: "",
      conditions: "",
      output: "",
    };
    const i = nodesRef.current.length;
    const newNode: CanvasNode = {
      id: newStage.id,
      position: { x: 100 + i * 40, y: 100 + i * 30 },
      data: { stageId: newStage.id },
    };
    const nextNodes = [...nodesRef.current, newNode];
    setNodes(nextNodes);
    onStagesChangeRef.current([...stagesRef.current, newStage]);
    persistCanvas(nextNodes, edgesRef.current);
  };

  const deleteSelected = () => {
    if (selectedNodes.length === 0 && !selectedEdge) return;
    let nextEdges = edgesRef.current;
    let nextNodes = nodesRef.current;
    if (selectedEdge) {
      nextEdges = nextEdges.filter((e) => e.id !== selectedEdge);
    }
    if (selectedNodes.length) {
      nextNodes = nextNodes.filter((n) => !selectedNodes.includes(n.id));
      nextEdges = nextEdges.filter(
        (e) =>
          !selectedNodes.includes(e.source) && !selectedNodes.includes(e.target)
      );
      onStagesChangeRef.current(
        stagesRef.current.filter((s) => !selectedNodes.includes(s.id))
      );
    }
    setNodes(nextNodes);
    setEdges(nextEdges);
    persistCanvas(nextNodes, nextEdges);
    setSelectedNodes([]);
    setSelectedEdge(null);
  };

  // ===== Render edges =====
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  const renderEdge = (edge: CanvasEdge) => {
    const s = nodeById.get(edge.source);
    const t = nodeById.get(edge.target);
    if (!s || !t) return null;
    const x1 = s.position.x + NODE_W;
    const y1 = s.position.y + NODE_H / 2;
    const x2 = t.position.x;
    const y2 = t.position.y + NODE_H / 2;
    const dx = Math.max(40, Math.abs(x2 - x1) / 2);
    const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const isSelected = selectedEdge === edge.id;
    return (
      <g key={edge.id} style={{ cursor: "pointer" }}>
        {/* invisible hit area */}
        <path
          d={path}
          stroke="transparent"
          strokeWidth={18}
          fill="none"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEdge(edge.id);
            setSelectedNodes([]);
            editEdgeLabel(edge.id);
          }}
        />
        <path
          d={path}
          stroke={isSelected ? "#39ff14" : "#00f5ff"}
          strokeWidth={2}
          strokeDasharray="6 4"
          fill="none"
          markerEnd={isSelected ? "url(#arrow-green)" : "url(#arrow-cyan)"}
          style={{
            filter: isSelected
              ? "drop-shadow(0 0 6px rgba(57,255,20,0.7))"
              : "drop-shadow(0 0 6px rgba(0,245,255,0.5))",
          }}
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-20"
            dur="1s"
            repeatCount="indefinite"
          />
        </path>
        {edge.label ? (
          <g pointerEvents="none">
            <rect
              x={mx - edge.label.length * 3.4 - 6}
              y={my - 10}
              width={edge.label.length * 6.8 + 12}
              height={20}
              rx={4}
              fill="#010812"
              stroke="#00f5ff"
              strokeWidth={1}
            />
            <text
              x={mx}
              y={my + 4}
              textAnchor="middle"
              fill="#00f5ff"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {edge.label}
            </text>
          </g>
        ) : null}
      </g>
    );
  };

  const pendingPath = (() => {
    if (!pending || !hoverPoint) return null;
    const s = nodeById.get(pending);
    if (!s) return null;
    const x1 = s.position.x + NODE_W;
    const y1 = s.position.y + NODE_H / 2;
    const x2 = hoverPoint.x;
    const y2 = hoverPoint.y;
    const dx = Math.max(40, Math.abs(x2 - x1) / 2);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  })();

  // Surface size to ensure scroll
  const surfaceW = Math.max(
    1200,
    ...nodes.map((n) => n.position.x + NODE_W + 80)
  );
  const surfaceH = Math.max(
    800,
    ...nodes.map((n) => n.position.y + NODE_H + 80)
  );

  return (
    <div
      className="relative glass-card neon-border rounded-md overflow-hidden"
      style={{ height: "70vh", minHeight: 500 }}
    >
      <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-2">
        <button onClick={addBlock} className="btn-neon btn-neon-green">
          + Add Block
        </button>
        <button
          onClick={deleteSelected}
          className="btn-neon btn-neon-danger"
          disabled={selectedNodes.length === 0 && !selectedEdge}
          style={{
            opacity:
              selectedNodes.length === 0 && !selectedEdge ? 0.4 : 1,
          }}
        >
          ✕ Delete Selected
        </button>
        {pending ? (
          <button onClick={() => setPending(null)} className="btn-neon">
            ✕ Cancel Link
          </button>
        ) : null}
      </div>
      <div className="absolute bottom-3 right-3 z-20 font-mono text-[9px] uppercase tracking-[0.3em] text-[rgba(150,220,230,0.5)] pointer-events-none">
        // drag blocks · click ▸ then a block to link · click arrow to label
      </div>

      <div
        ref={surfaceRef}
        className="absolute inset-0 overflow-auto"
        onPointerMove={onSurfaceMove}
        onClick={onSurfaceClick}
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,245,255,0.18) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          backgroundColor: "transparent",
        }}
      >
        <div
          className="relative"
          style={{ width: surfaceW, height: surfaceH }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedNodes([]);
              setSelectedEdge(null);
              setPending(null);
            }
          }}
        >
          <svg
            className="absolute inset-0 pointer-events-none"
            width={surfaceW}
            height={surfaceH}
            style={{ overflow: "visible" }}
          >
            <defs>
              <marker
                id="arrow-cyan"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#00f5ff" />
              </marker>
              <marker
                id="arrow-green"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#39ff14" />
              </marker>
            </defs>
            <g style={{ pointerEvents: "auto" }}>{edges.map(renderEdge)}</g>
            {pendingPath ? (
              <path
                d={pendingPath}
                stroke="#39ff14"
                strokeWidth={2}
                strokeDasharray="4 4"
                fill="none"
                opacity={0.8}
              />
            ) : null}
          </svg>

          {nodes.map((n) => {
            const stage = stages.find((s) => s.id === n.id);
            if (!stage) return null;
            const isSelected = selectedNodes.includes(n.id);
            return (
              <StageBlock
                key={n.id}
                stage={stage}
                x={n.position.x}
                y={n.position.y}
                selected={isSelected}
                pendingActive={!!pending}
                isPendingSource={pending === n.id}
                onPointerDown={(e) => onNodePointerDown(e, n.id)}
                onPointerMove={onNodePointerMove}
                onPointerUp={onNodePointerUp}
                onClick={(e) => {
                  e.stopPropagation();
                  if (pending) completeEdge(n.id);
                }}
                onStartLink={() => startEdge(n.id)}
                onEdit={editStage}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface BlockProps {
  stage: Stage;
  x: number;
  y: number;
  selected: boolean;
  pendingActive: boolean;
  isPendingSource: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  onStartLink: () => void;
  onEdit: (id: string, patch: Partial<Stage>) => void;
}

function StageBlock({
  stage,
  x,
  y,
  selected,
  pendingActive,
  isPendingSource,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onClick,
  onStartLink,
  onEdit,
}: BlockProps) {
  const [editing, setEditing] = useState(false);
  return (
    <div
      className={
        "absolute glass-card rounded-md p-3 transition-shadow duration-200 select-none " +
        (selected
          ? "border border-[#39ff14] shadow-[0_0_22px_rgba(57,255,20,0.6)]"
          : "neon-border hover:shadow-[0_0_22px_rgba(0,245,255,0.55)]") +
        (pendingActive && !isPendingSource
          ? " ring-1 ring-[#39ff14] cursor-crosshair"
          : "")
      }
      style={{
        left: x,
        top: y,
        width: NODE_W,
        touchAction: "none",
        cursor: "move",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={onClick}
    >
      {/* Source handle */}
      <button
        type="button"
        title="Drag a link from here"
        className="no-drag absolute"
        style={{
          right: -HANDLE_R - 2,
          top: NODE_H / 2 - HANDLE_R,
          width: HANDLE_R * 2,
          height: HANDLE_R * 2,
          borderRadius: "9999px",
          background: isPendingSource ? "#39ff14" : "#39ff14",
          boxShadow: "0 0 8px #39ff14",
          border: "none",
          cursor: "crosshair",
          padding: 0,
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onStartLink();
        }}
      />
      {/* Target dot */}
      <span
        className="absolute pointer-events-none"
        style={{
          left: -HANDLE_R - 2,
          top: NODE_H / 2 - HANDLE_R,
          width: HANDLE_R * 2,
          height: HANDLE_R * 2,
          borderRadius: "9999px",
          background: "#00f5ff",
          boxShadow: "0 0 8px #00f5ff",
        }}
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
          className="input-neon mb-2 no-drag"
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
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          title="Double-click to rename"
        >
          {stage.name || "Unnamed"}
        </h3>
      )}
      <Row label="Inputs">
        <textarea
          className="input-neon no-drag text-xs min-h-[36px]"
          value={stage.chemicals}
          onChange={(e) => onEdit(stage.id, { chemicals: e.target.value })}
          onPointerDown={(e) => e.stopPropagation()}
        />
      </Row>
      <Row label="Conditions">
        <textarea
          className="input-neon no-drag text-xs min-h-[36px]"
          value={stage.conditions}
          onChange={(e) => onEdit(stage.id, { conditions: e.target.value })}
          onPointerDown={(e) => e.stopPropagation()}
        />
      </Row>
      <Row label="Output">
        <textarea
          className="input-neon no-drag text-xs min-h-[36px]"
          value={stage.output}
          onChange={(e) => onEdit(stage.id, { output: e.target.value })}
          onPointerDown={(e) => e.stopPropagation()}
        />
      </Row>
    </div>
  );
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