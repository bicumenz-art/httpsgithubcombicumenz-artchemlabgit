import type { Stage } from "@/lib/recipes";

export function PipelineDiagram({ stages }: { stages: Stage[] }) {
  if (!stages.length) {
    return (
      <div className="font-mono text-sm text-[rgba(150,220,230,0.6)]">
        // no stages defined
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex flex-col gap-5 md:flex-row md:items-stretch md:gap-0 md:overflow-x-auto md:pb-4">
        {stages.map((stage, i) => (
          <div key={stage.id} className="flex flex-col md:flex-row md:items-center">
            <StageNode stage={stage} index={i} />
            {i < stages.length - 1 && <Connector />}
          </div>
        ))}
      </div>
    </div>
  );
}

function StageNode({ stage, index }: { stage: Stage; index: number }) {
  return (
    <div className="group relative w-full md:w-72 shrink-0 glass-card neon-border rounded-md p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(0,245,255,0.55)]">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[rgba(150,220,230,0.7)]">
          stage {String(index + 1).padStart(2, "0")}
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#39ff14] shadow-[0_0_6px_#39ff14]" />
      </div>
      <h3 className="font-display text-base font-bold text-cyan-glow mb-3 break-words">
        {stage.name || "Unnamed"}
      </h3>
      <DataRow label="Inputs" value={stage.chemicals} />
      <DataRow label="Conditions" value={stage.conditions} />
      <DataRow label="Output" value={stage.output} accent />
    </div>
  );
}

function DataRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-[rgba(150,220,230,0.5)]">
        {label}
      </div>
      <div
        className={
          "font-mono text-xs break-words " +
          (accent ? "text-green-glow" : "text-[#d6f7ff]")
        }
      >
        {value || "—"}
      </div>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex items-center justify-center my-1 md:my-0 md:mx-2 md:w-16 self-center">
      {/* horizontal on md+, vertical on mobile */}
      <svg
        className="hidden md:block"
        width="64"
        height="20"
        viewBox="0 0 64 20"
        fill="none"
      >
        <defs>
          <linearGradient id="hgrad" x1="0" x2="1">
            <stop offset="0" stopColor="#00f5ff" stopOpacity="0.2" />
            <stop offset="1" stopColor="#00f5ff" stopOpacity="1" />
          </linearGradient>
        </defs>
        <line
          x1="0"
          y1="10"
          x2="56"
          y2="10"
          stroke="url(#hgrad)"
          strokeWidth="1.5"
          strokeDasharray="6 6"
          className="flow-arrow"
        />
        <path d="M52 4 L60 10 L52 16" stroke="#00f5ff" strokeWidth="1.5" fill="none" />
      </svg>
      <svg
        className="md:hidden"
        width="20"
        height="40"
        viewBox="0 0 20 40"
        fill="none"
      >
        <defs>
          <linearGradient id="vgrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#00f5ff" stopOpacity="0.2" />
            <stop offset="1" stopColor="#00f5ff" stopOpacity="1" />
          </linearGradient>
        </defs>
        <line
          x1="10"
          y1="0"
          x2="10"
          y2="32"
          stroke="url(#vgrad)"
          strokeWidth="1.5"
          strokeDasharray="6 6"
          className="flow-arrow"
        />
        <path d="M4 28 L10 36 L16 28" stroke="#00f5ff" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}