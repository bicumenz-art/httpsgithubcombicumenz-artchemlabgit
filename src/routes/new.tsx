import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { uid, useRecipes, type Stage } from "@/lib/recipes";

export const Route = createFileRoute("/new")({
  component: NewRecipePage,
  head: () => ({
    meta: [
      { title: "New Recipe — ChemFlow" },
      { name: "description", content: "Compose a new multi-stage chemistry recipe in the ChemFlow lab." },
    ],
  }),
});

function emptyStage(): Stage {
  return { id: uid(), name: "", chemicals: "", conditions: "", output: "" };
}

function NewRecipePage() {
  const navigate = useNavigate();
  const { addRecipe } = useRecipes();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stages, setStages] = useState<Stage[]>([emptyStage()]);
  const [error, setError] = useState<string | null>(null);

  function updateStage(id: string, patch: Partial<Stage>) {
    setStages((s) => s.map((st) => (st.id === id ? { ...st, ...patch } : st)));
  }
  function removeStage(id: string) {
    setStages((s) => (s.length === 1 ? s : s.filter((st) => st.id !== id)));
  }
  function addStage() {
    setStages((s) => [...s, emptyStage()]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Recipe name is required.");
      return;
    }
    const cleanStages = stages
      .map((s) => ({ ...s, name: s.name.trim(), chemicals: s.chemicals.trim(), conditions: s.conditions.trim(), output: s.output.trim() }))
      .filter((s) => s.name || s.chemicals || s.conditions || s.output);
    if (cleanStages.length === 0) {
      setError("Add at least one stage.");
      return;
    }
    const id = uid();
    addRecipe({
      id,
      name: name.trim(),
      description: description.trim(),
      stages: cleanStages,
      createdAt: Date.now(),
    });
    navigate({ to: "/recipes/$recipeId", params: { recipeId: id } });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-[rgba(150,220,230,0.6)]">
            // recipe.compose
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-black tracking-[0.08em] text-cyan-glow">
            NEW PROTOCOL
          </h1>
        </div>
        <Link to="/" className="btn-neon">← archive</Link>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="glass-card neon-border rounded-md p-5 space-y-4">
          <Field label="Recipe Name">
            <input
              className="input-neon"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Quantum Catalysis"
            />
          </Field>
          <Field label="Description">
            <textarea
              className="input-neon min-h-[90px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary of intent, target compound, and conditions..."
            />
          </Field>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg tracking-[0.2em] text-cyan-glow">STAGES</h2>
            <button type="button" onClick={addStage} className="btn-neon btn-neon-green text-[10px]">
              + add stage
            </button>
          </div>
          {stages.map((stage, i) => (
            <div key={stage.id} className="glass-card neon-border rounded-md p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[rgba(150,220,230,0.7)]">
                  stage {String(i + 1).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => removeStage(stage.id)}
                  disabled={stages.length === 1}
                  className="btn-neon btn-neon-danger text-[10px] py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  remove
                </button>
              </div>
              <Field label="Stage Name">
                <input
                  className="input-neon"
                  value={stage.name}
                  onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                  placeholder="e.g. Activation"
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Chemicals / Inputs">
                  <input
                    className="input-neon"
                    value={stage.chemicals}
                    onChange={(e) => updateStage(stage.id, { chemicals: e.target.value })}
                    placeholder="H2O, NaCl, CuSO4"
                  />
                </Field>
                <Field label="Conditions">
                  <input
                    className="input-neon"
                    value={stage.conditions}
                    onChange={(e) => updateStage(stage.id, { conditions: e.target.value })}
                    placeholder="180°C · 3 atm"
                  />
                </Field>
              </div>
              <Field label="Output / Result">
                <input
                  className="input-neon"
                  value={stage.output}
                  onChange={(e) => updateStage(stage.id, { output: e.target.value })}
                  placeholder="Cyan luminescent gel"
                />
              </Field>
            </div>
          ))}
        </div>

        {error && (
          <div className="font-mono text-xs text-[#ff5577] border border-[rgba(255,85,119,0.5)] rounded px-3 py-2">
            // {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-neon btn-neon-green">
            ▣ save recipe
          </button>
          <Link to="/" className="btn-neon">cancel</Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[rgba(150,220,230,0.7)]">
        {label}
      </span>
      {children}
    </label>
  );
}