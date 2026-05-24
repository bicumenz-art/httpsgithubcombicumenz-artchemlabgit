import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setErr(error.message);
    else navigate({ to: "/" });
  };

  const handleGoogle = async () => {
    setErr("");
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (r.error) setErr(String((r.error as Error).message ?? r.error));
    if (r.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-12 animate-page">
        <div className="glass-card neon-border rounded-md p-6">
          <div className="mb-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[rgba(150,220,230,0.6)]">
              // access terminal
            </div>
            <h1 className="font-display text-2xl text-cyan-glow mt-1">LOGIN</h1>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Field label="Email">
              <input
                className="input-neon"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Field>
            <Field label="Password">
              <input
                className="input-neon"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            {err && (
              <div className="font-mono text-xs text-[#ff5577]">// {err}</div>
            )}
            <button disabled={busy} type="submit" className="btn-neon mt-2">
              {busy ? "Authenticating…" : "Initiate Session"}
            </button>
          </form>
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-[rgba(0,245,255,0.2)]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[rgba(150,220,230,0.5)]">
              or
            </span>
            <div className="h-px flex-1 bg-[rgba(0,245,255,0.2)]" />
          </div>
          <button onClick={handleGoogle} className="btn-neon w-full">
            Continue with Google
          </button>
          <div className="mt-6 font-mono text-xs text-[rgba(150,220,230,0.7)]">
            // new operator?{" "}
            <Link to="/register" className="text-green-glow">
              register here
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[rgba(150,220,230,0.7)]">
        {label}
      </span>
      {children}
    </label>
  );
}