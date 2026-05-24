import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  fetchRecipe,
  updateRecipe,
  type Recipe,
  type Stage,
  type CanvasData,
} from "@/lib/recipes";
import { TextEditor } from "@/components/TextEditor";
import { CanvasEditor } from "@/components/CanvasEditor";

export const Route = createFileRoute("/_authenticated/recipes/$recipeId")({
  component: RecipeDetailPage,
});

type Mode = "text" | "canvas";

function RecipeDetailPage() {
  const { recipeId } = Route.useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mode, setMode] = useState<Mode>("text");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRecipe(recipeId).then((r) => {
      if (cancelled) return;
      if (!r) setNotFound(true);
      else setRecipe(r);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  const patch = (p: Partial<Recipe>) => {
    setRecipe((r) => (r ? { ...r, ...p } : r));
    setDirty(true);
  };

  const save = async () => {
    if (!recipe) return;
    setSaving(true);
    try {
      await updateRecipe(recipe.id, {
        name: recipe.name,
        description: recipe.description,
        stages: recipe.stages,
        canvas: recipe.canvas,
      });
      setDirty(false);
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="font-mono text-xs text-cyan-glow animate-pulse-glow">
        // loading protocol…
      </div>
    );
  }
  if (notFound || !recipe) {
    return (
      <div className="glass-card neon-border rounded-md p-8 text-center">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-[#ff5577]">
          // recipe not found
        </div>
        <button onClick={() => navigate({ to: "/" })} className="btn-neon mt-4">
          Back to Library
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-[260px]">
          <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[rgba(150,220,230,0.6)]">
            // protocol // {recipe.id.slice(0, 8)}
          </div>
          <input
            className="bg-transparent w-full font-display text-3xl text-cyan-glow mt-1 outline-none border-b border-transparent focus:border-[rgba(0,245,255,0.5)] py-1"
            value={recipe.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="Recipe name"
          />
          <textarea
            className="bg-transparent w-full font-mono text-sm text-[rgba(214,247,255,0.85)] mt-2 outline-none border-b border-transparent focus:border-[rgba(0,245,255,0.3)] resize-none"
            value={recipe.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="// add a description"
            rows={2}
          />
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle mode={mode} onChange={setMode} />
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="btn-neon btn-neon-green"
            style={{ opacity: !dirty ? 0.5 : 1 }}
          >
            {saving ? "Saving…" : dirty ? "Save" : savedAt ? "Saved" : "Saved"}
          </button>
          <button
            onClick={() => navigate({ to: "/" })}
            className="btn-neon"
          >
            Library
          </button>
        </div>
      </div>

      {mode === "text" ? (
        <TextEditor
          stages={recipe.stages}
          onChange={(stages: Stage[]) => patch({ stages })}
        />
      ) : (
        <CanvasEditor
          stages={recipe.stages}
          canvas={recipe.canvas}
          onStagesChange={(stages: Stage[]) => patch({ stages })}
          onCanvasChange={(canvas: CanvasData) => patch({ canvas })}
        />
      )}
    </div>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  return (
    <div className="inline-flex rounded border border-[rgba(0,245,255,0.4)] overflow-hidden">
      {(["text", "canvas"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={
            "px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] transition-all " +
            (mode === m
              ? "bg-[rgba(57,255,20,0.18)] text-green-glow shadow-[inset_0_0_12px_rgba(57,255,20,0.35)]"
              : "text-cyan-glow hover:bg-[rgba(0,245,255,0.08)]")
          }
        >
          {m === "text" ? "Text Mode" : "Canvas Mode"}
        </button>
      ))}
    </div>
  );
}