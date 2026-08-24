import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const LINKS = [
  { to: "/", label: "Lab" },
  { to: "/guide", label: "Build guide" },
  { to: "/datasets", label: "Datasets" },
  { to: "/pipeline", label: "Pipeline" },
  { to: "/lab/bert", label: "Task 1" },
  { to: "/lab/gnn", label: "Task 2" },
  { to: "/lab/fusion", label: "Task 3" },
  { to: "/lab/retrieval", label: "Task 4" },
  { to: "/results", label: "Results" },
  { to: "/code", label: "Code" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-serif text-xl italic tracking-tight sm:text-[22px]">
              Harmonia
            </span>
            <span className="hidden text-[11px] uppercase tracking-[0.18em] text-muted sm:inline">
              GNN · BERT
            </span>
          </Link>
          <nav className="hidden items-center gap-0.5 lg:flex">
            {LINKS.map((l) => {
              const active =
                l.to === "/"
                  ? pathname === "/"
                  : pathname === l.to || pathname.startsWith(l.to + "/");
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-[13px] transition-colors duration-150",
                    active ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
        {open ? (
          <nav className="grid gap-1 border-t border-border px-3 py-3 lg:hidden">
            {LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-3 text-sm",
                  pathname === l.to ? "bg-elevated text-fg" : "text-muted",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>
      <main>{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>CSE425 / EEE474 / CSE715 · GNN-based BERT for musical context</p>
          <p>Interactive lab + downloadable PyTorch project</p>
        </div>
      </footer>
    </div>
  );
}

export function Page({
  kicker,
  title,
  lede,
  children,
}: {
  kicker?: string;
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="stagger-in mb-10 max-w-2xl">
        {kicker ? (
          <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-muted">
            {kicker}
          </p>
        ) : null}
        <h1 className="font-serif text-4xl leading-[1.1] tracking-tight sm:text-5xl">
          {title}
        </h1>
        {lede ? <p className="mt-4 text-[15px] leading-relaxed text-muted">{lede}</p> : null}
      </div>
      {children}
    </div>
  );
}
