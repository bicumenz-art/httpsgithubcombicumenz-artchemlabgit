import { Link } from "@tanstack/react-router";

export function AppHeader() {
  return (
    <header className="relative z-10 border-b border-[rgba(0,245,255,0.2)] backdrop-blur-md bg-[rgba(1,8,18,0.7)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative h-9 w-9 rounded-sm neon-border animate-pulse-glow flex items-center justify-center font-display font-bold text-cyan-glow">
            C
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold tracking-[0.25em] text-cyan-glow">
              CHEMFLOW
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[rgba(150,220,230,0.6)]">
              holographic recipe lab
            </span>
          </div>
        </Link>
        <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[rgba(150,220,230,0.6)]">
          <span className="h-2 w-2 rounded-full bg-[#39ff14] shadow-[0_0_8px_#39ff14]" />
          system online
        </div>
      </div>
    </header>
  );
}