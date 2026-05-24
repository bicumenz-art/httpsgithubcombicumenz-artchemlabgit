import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useRecipes } from "@/lib/recipes";

export const Route = createFileRoute("/_authenticated/")({
  component: LibraryPage,
});

function LibraryPage() {
  const { recipes, ready, deleteRecipe } = useRecipes();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const filtered = useMemo(
    () =>
      recipes.filter((r) =>
        r.name.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [recipes, query]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[rgba(150,220,230,0.6)]">
            // synthesis archive
          </div>
          <h1 className="font-display text-3xl text-cyan-glow mt-1">
            RECIPE LIBRARY
          </h1>
        </div>
        <Link to="/new" className="btn-neon btn-neon-green">
          + New Protocol
        </Link>
      </div>

      <div className="relative">
        <input
          className="input-neon pl-9"
          placeholder="search synthesis archive…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-cyan-glow">
          ▣
        </span>
      </div>

      {!ready ? (
        <div className="font-mono text-xs text-cyan-glow animate-pulse-glow">
          // syncing archive…
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card neon-border rounded-md p-10 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-[rgba(150,220,230,0.6)]">
            // no recipes in archive
          </div>
          <Link to="/new" className="btn-neon btn-neon-green mt-4 inline-flex">
            Forge first protocol
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="glass-card neon-border rounded-md p-4 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(0,245,255,0.45)] cursor-pointer"
              onClick={() =>
                navigate({ to: "/recipes/$recipeId", params: { recipeId: r.id } })
              }
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[rgba(150,220,230,0.6)]">
                  recipe // {r.id.slice(0, 6)}
                </span>
                <span className="font-mono text-[10px] text-green-glow">
                  {r.stages.length} stages
                </span>
              </div>
              <h3 className="font-display text-lg text-cyan-glow break-words">
                {r.name}
              </h3>
              <p className="font-mono text-xs text-[rgba(214,247,255,0.75)] line-clamp-3 min-h-[3rem]">
                {r.description || "// no description"}
              </p>
              <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                <Link
                  to="/recipes/$recipeId"
                  params={{ recipeId: r.id }}
                  className="btn-neon flex-1 text-center"
                >
                  Edit
                </Link>
                <button
                  className="btn-neon btn-neon-danger"
                  onClick={async () => {
                    if (confirm(`Delete recipe "${r.name}"?`)) {
                      await deleteRecipe(r.id);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}