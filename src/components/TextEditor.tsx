import type { Stage } from "@/lib/recipes";
import { uid } from "@/lib/recipes";
import { PipelineDiagram } from "@/components/PipelineDiagram";

interface Props {
  stages: Stage[];
  onChange: (stages: Stage[]) => void;
}

export function TextEditor({ stages, onChange }: Props) {
  const updateStage = (i: number, patch: Partial<Stage>) => {
    const next = stages.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const addStage = () => {
    onChange([
      ...stages,
      { id: uid(), name: "", chemicals: "", conditions: "", output: "" },
    ]);
  };
  const removeStage = (i: number) => {
    onChange(stages.filter((_, idx) => idx !== i));
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= stages.length) return;
    const next = stages.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-6">
      {stages.length > 0 && (
        <div className="glass-card neon-border rounded-md p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[rgba(150,220,230,0.6)] mb-3">
            // live pipeline preview
          </div>
          <PipelineDiagram stages={stages} />
        </div>
      )}
      <div className="flex flex-col gap-4">
        {stages.map((s, i) => (
          <div key={s.id} className="glass-card neon-border rounded-md p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-green-glow">
                stage {String(i + 1).padStart(2, "0")}
              </div>
              <div className="flex gap-1">
                <IconBtn label="↑" onClick={() => move(i, -1)} disabled={i === 0} />
                <IconBtn
                  label="↓"
                  onClick={() => move(i, 1)}
                  disabled={i === stages.length - 1}
                />
                <IconBtn label="✕" onClick={() => removeStage(i)} danger />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Stage Name">
                <input
                  className="input-neon"
                  value={s.name}
                  onChange={(e) => updateStage(i, { name: e.target.value })}
                />
              </Field>
              <Field label="Chemicals / Inputs">
                <input
                  className="input-neon"
                  value={s.chemicals}
                  onChange={(e) => updateStage(i, { chemicals: e.target.value })}
                />
              </Field>
              <Field label="Conditions">
                <input
                  className="input-neon"
                  value={s.conditions}
                  onChange={(e) => updateStage(i, { conditions: e.target.value })}
                />
              </Field>
              <Field label="Output">
                <input
                  className="input-neon"
                  value={s.output}
                  onChange={(e) => updateStage(i, { output: e.target.value })}
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addStage} type="button" className="btn-neon self-start">
        + Add Stage
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[rgba(150,220,230,0.6)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "h-7 w-7 inline-flex items-center justify-center rounded border font-mono text-xs transition-all " +
        (danger
          ? "border-[rgba(255,60,90,0.5)] text-[#ff5577] hover:bg-[rgba(255,60,90,0.12)] hover:shadow-[0_0_10px_rgba(255,60,90,0.5)]"
          : "border-[rgba(0,245,255,0.4)] text-cyan-glow hover:bg-[rgba(0,245,255,0.12)] hover:shadow-[0_0_10px_rgba(0,245,255,0.5)]") +
        " disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none"
      }
    >
      {label}
    </button>
  );
}