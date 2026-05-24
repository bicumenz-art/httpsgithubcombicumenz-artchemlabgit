import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useRecipes, type Recipe } from "@/lib/recipes";

export const Route = createFileRoute("/")({
  component: LibraryPage,
  head: () => ({
    meta: [
      { title: "Recipe Library — ChemFlow" },
      { name: "description", content: "Browse and search your chemistry recipes in the ChemFlow holographic lab." },
    ],
  }),
});

function LibraryPage() {
  const { recipes, ready, deleteRecipe } = useRecipes();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((r) => r.name.toLowerCase().includes(q));
  }, [recipes, query]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-[rgba(150,220,230,0.6)]">
          // recipe.library
        </div>
        <h1 className="font-display text-3xl md:text-5xl font-black tracking-[0.08em] text-cyan-glow">
          SYNTHESIS ARCHIVE
        </h1>
        <p className="font-mono text-sm text-[rgba(200,230,240,0.7)] max-w-2xl">
          A live registry of your saved chemistry protocols. Query the index, inspect pipelines, and forge new compounds.
        </p>
      </section>

      <section className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#00f5ff]">
            {">"}
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search recipes by name..."
            className="input-neon pl-8 tracking-wider"
            aria-label="Search recipes"
          />
        </div>
        <Link to="/new" className="btn-neon btn-neon-green whitespace-nowrap">
          + new recipe
        </Link>
      </section>

      <section>
        {!ready ? (
          <div className="font-mono text-sm text-[rgba(150,220,230,0.6)]">// loading archive…</div>
        ) : filtered.length === 0 ? (
          <EmptyState hasQuery={!!query} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <RecipeCard key={r.id} recipe={r} onDelete={() => deleteRecipe(r.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RecipeCard({ recipe, onDelete }: { recipe: Recipe; onDelete: () => void }) {
  return (
    <div className="group relative glass-card neon-border rounded-md p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_36px_rgba(0,245,255,0.6)]">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[rgba(150,220,230,0.6)]">
          rcp_{recipe.id.slice(0, 6)}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-green-glow">
          {recipe.stages.length} stage{recipe.stages.length === 1 ? "" : "s"}
        </span>
      </div>
      <Link
        to="/recipes/$recipeId"
        params={{ recipeId: recipe.id }}
        className="block"
      >
        <h2 className="font-display text-xl font-bold text-cyan-glow mb-2 break-words">
          {recipe.name}
        </h2>
        <p className="font-mono text-xs text-[rgba(200,230,240,0.75)] line-clamp-3 min-h-[3.6em]">
          {recipe.description || "// no description"}
        </p>
      </Link>
      <div className="mt-4 flex items-center justify-between gap-2">
        <Link
          to="/recipes/$recipeId"
          params={{ recipeId: recipe.id }}
          className="btn-neon text-[10px] py-1.5 px-3"
        >
          inspect →
        </Link>
        <button
          onClick={() => {
            if (confirm(`Delete "${recipe.name}"?`)) onDelete();
          }}
          className="btn-neon btn-neon-danger text-[10px] py-1.5 px-3"
          aria-label={`Delete ${recipe.name}`}
        >
          purge
        </button>
      </div>
    </div>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="glass-card neon-border rounded-md p-10 text-center">
      <div className="font-display text-2xl text-cyan-glow mb-2">
        {hasQuery ? "NO MATCHES" : "ARCHIVE EMPTY"}
      </div>
      <p className="font-mono text-sm text-[rgba(200,230,240,0.7)] mb-5">
        {hasQuery
          ? "No recipes match the current query string."
          : "Forge your first protocol to begin populating the archive."}
      </p>
      {!hasQuery && (
        <Link to="/new" className="btn-neon btn-neon-green">
          + create recipe
        </Link>
      )}
    </div>
  );
}