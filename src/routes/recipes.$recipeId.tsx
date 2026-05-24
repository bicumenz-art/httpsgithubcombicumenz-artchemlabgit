import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useRecipes, type Recipe } from "@/lib/recipes";
import { PipelineDiagram } from "@/components/PipelineDiagram";

export const Route = createFileRoute("/recipes/$recipeId")({
  component: RecipeDetailPage,
  head: () => ({
    meta: [
      { title: "Recipe Detail — ChemFlow" },
      { name: "description", content: "Inspect the full stage pipeline of a ChemFlow chemistry recipe." },
    ],
  }),
});

function RecipeDetailPage() {
  const { recipeId } = Route.useParams();
  const { getRecipe, deleteRecipe, ready } = useRecipes();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | undefined>();

  useEffect(() => {
    if (ready) setRecipe(getRecipe(recipeId));
  }, [ready, recipeId, getRecipe]);

  if (!ready) {
    return <div className="font-mono text-sm text-[rgba(150,220,230,0.6)]">// loading…</div>;
  }

  if (!recipe) {
    return (
      <div className="glass-card neon-border rounded-md p-10 text-center space-y-4">
        <h1 className="font-display text-2xl text-cyan-glow">RECIPE NOT FOUND</h1>
        <p className="font-mono text-sm text-[rgba(200,230,240,0.7)]">
          // signal lost — this protocol is no longer in the archive.
        </p>
        <Link to="/" className="btn-neon inline-flex">← back to archive</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Link to="/" className="btn-neon">← archive</Link>
        <button
          onClick={() => {
            if (confirm(`Delete "${recipe.name}"?`)) {
              deleteRecipe(recipe.id);
              navigate({ to: "/" });
            }
          }}
          className="btn-neon btn-neon-danger"
        >
          ✕ delete recipe
        </button>
      </div>

      <header className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-[rgba(150,220,230,0.6)]">
          // protocol.id = {recipe.id}
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-black tracking-[0.06em] text-cyan-glow break-words">
          {recipe.name}
        </h1>
        {recipe.description && (
          <p className="font-mono text-sm md:text-base text-[rgba(220,240,245,0.8)] max-w-3xl">
            {recipe.description}
          </p>
        )}
        <div className="flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-[0.3em] text-[rgba(150,220,230,0.6)]">
          <span>stages: <span className="text-green-glow">{recipe.stages.length}</span></span>
          <span>created: <span className="text-cyan-glow">{new Date(recipe.createdAt).toLocaleString()}</span></span>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="font-display text-lg tracking-[0.2em] text-cyan-glow">PIPELINE</h2>
        <div className="glass-card neon-border rounded-md p-5 md:p-7">
          <PipelineDiagram stages={recipe.stages} />
        </div>
      </section>
    </div>
  );
}