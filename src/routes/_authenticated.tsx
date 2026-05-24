import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-glow animate-pulse-glow">
          // initializing terminal…
        </div>
      </div>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-7xl px-5 py-8 animate-page">
        <Outlet />
      </main>
    </>
  );
}