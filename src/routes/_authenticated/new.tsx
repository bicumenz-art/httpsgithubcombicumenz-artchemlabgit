import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useRecipes } from "@/lib/recipes";

export const Route = createFileRoute("/_authenticated/new")({
  component: NewRecipePage,
});

function NewRecipePage() {
  const navigate = useNavigate();
  const { createRecipe } = useRecipes();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await createRecipe({ name, description });
      navigate({ to: "/recipes/$recipeId", params: { recipeId: r.id } });
    } catch (e2) {
      setErr((e2 as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[rgba(150,220,230,0.6)]">
          // initialize new protocol
        </div>
        <h1 className="font-display text-3xl text-cyan-glow mt-1">NEW PROTOCOL</h1>
      </div>
      <form onSubmit={handleSubmit} className="glass-card neon-border rounded-md p-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[rgba(150,220,230,0.7)]">
            Recipe Name
          </span>
          <input
            className="input-neon"
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[rgba(150,220,230,0.7)]">
            Description
          </span>
          <textarea
            className="input-neon min-h-[100px]"
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        {err && <div className="font-mono text-xs text-[#ff5577]">// {err}</div>}
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-neon btn-neon-danger" onClick={() => navigate({ to: "/" })}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className="btn-neon btn-neon-green">
            {busy ? "Forging…" : "Create & Configure Stages"}
          </button>
        </div>
      </form>
    </div>
  );
}