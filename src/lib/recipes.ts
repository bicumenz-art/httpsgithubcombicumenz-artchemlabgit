import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export interface Stage {
  id: string;
  name: string;
  chemicals: string;
  conditions: string;
  output: string;
}

export interface CanvasNode {
  id: string;
  position: { x: number; y: number };
  data: { stageId: string };
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface Recipe {
  id: string;
  user_id: string;
  name: string;
  description: string;
  stages: Stage[];
  canvas: CanvasData;
  created_at: string;
  updated_at: string;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function useRecipes() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setRecipes([]);
      setReady(true);
      return;
    }
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setRecipes(data as unknown as Recipe[]);
    setReady(true);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createRecipe = useCallback(
    async (input: { name: string; description: string; stages?: Stage[] }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("recipes")
        .insert({
          user_id: user.id,
          name: input.name,
          description: input.description,
          stages: (input.stages ?? []) as never,
          canvas: { nodes: [], edges: [] } as never,
        })
        .select()
        .single();
      if (error) throw error;
      await refresh();
      return data as unknown as Recipe;
    },
    [user, refresh]
  );

  const deleteRecipe = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("recipes").delete().eq("id", id);
      if (error) throw error;
      await refresh();
    },
    [refresh]
  );

  return { recipes, ready, createRecipe, deleteRecipe, refresh };
}

export async function fetchRecipe(id: string): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return (data as unknown as Recipe) ?? null;
}

export async function updateRecipe(
  id: string,
  patch: Partial<Pick<Recipe, "name" | "description" | "stages" | "canvas">>
) {
  const { error } = await supabase
    .from("recipes")
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}