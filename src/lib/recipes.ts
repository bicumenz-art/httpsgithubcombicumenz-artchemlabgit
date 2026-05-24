import { useEffect, useState, useCallback } from "react";

export interface Stage {
  id: string;
  name: string;
  chemicals: string;
  conditions: string;
  output: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  stages: Stage[];
  createdAt: number;
}

const KEY = "chemflow:recipes:v1";

const seed: Recipe[] = [
  {
    id: "seed-1",
    name: "Aurora Catalysis",
    description: "A two-stage exothermic synthesis producing a luminescent cyan compound.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    stages: [
      {
        id: "s1",
        name: "Activation",
        chemicals: "H2O, NaCl, CuSO4",
        conditions: "25°C · 1 atm",
        output: "Activated brine solution",
      },
      {
        id: "s2",
        name: "Catalysis",
        chemicals: "Pt catalyst",
        conditions: "180°C · 3 atm · 12 min",
        output: "Cyan luminescent gel",
      },
    ],
  },
  {
    id: "seed-2",
    name: "Plasma Bloom",
    description: "High-energy plasma reaction yielding a stable neon-green isotope.",
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    stages: [
      {
        id: "p1",
        name: "Ionization",
        chemicals: "Argon gas, Xenon trace",
        conditions: "−40°C · low pressure",
        output: "Ionized plasma cloud",
      },
      {
        id: "p2",
        name: "Stabilization",
        chemicals: "Magnetic confinement",
        conditions: "2.4 T field · 800ms",
        output: "Stabilized plasma core",
      },
      {
        id: "p3",
        name: "Crystallization",
        chemicals: "Liquid nitrogen quench",
        conditions: "−196°C · 5s",
        output: "Neon-green crystal lattice",
      },
    ],
  },
];

function load(): Recipe[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return seed;
  }
}

function save(recipes: Recipe[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(recipes));
}

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRecipes(load());
    setReady(true);
    const sync = () => setRecipes(load());
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const addRecipe = useCallback((r: Recipe) => {
    const next = [r, ...load()];
    save(next);
    emit();
  }, []);

  const deleteRecipe = useCallback((id: string) => {
    const next = load().filter((r) => r.id !== id);
    save(next);
    emit();
  }, []);

  const getRecipe = useCallback((id: string) => load().find((r) => r.id === id), []);

  return { recipes, ready, addRecipe, deleteRecipe, getRecipe };
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}