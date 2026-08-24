import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Page } from "@/components/app-shell";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/lab/")({ component: LabIndex });

const TASKS = [
  {
    to: "/lab/bert",
    n: "Task 1 · Easy",
    t: "BERT tag classifier",
    d: "Fine-tune DistilBERT on captions and tags. Binary cross-entropy per tag. Macro / Micro F1.",
  },
  {
    to: "/lab/gnn",
    n: "Task 2 · Medium",
    t: "GNN on music graphs",
    d: "Build chord and segment graphs, run GraphSAGE, compare against a CNN on log-mel.",
  },
  {
    to: "/lab/fusion",
    n: "Task 3 · Hard",
    t: "GNN–BERT fusion",
    d: "Cross-attention fusion, ablations, t-SNE, case studies, optional DEAM regression.",
  },
  {
    to: "/lab/retrieval",
    n: "Task 4 · Advanced",
    t: "Contrastive alignment",
    d: "Dual encoder, InfoNCE, caption→audio retrieval, qualitative top-3 matches.",
  },
];

function LabIndex() {
  return (
    <AppShell>
      <Page
        kicker="Interactive lab"
        title="Pick a task"
        lede="Each task runs the same architecture as the assignment on a 20-track toy corpus so you can see graphs, attention, and retrieval before you train on FMA."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {TASKS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="group rounded-[24px] border border-border bg-surface p-6 transition-colors hover:bg-elevated"
            >
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{t.n}</p>
              <h2 className="mt-3 font-serif text-2xl">{t.t}</h2>
              <p className="mt-2 text-[14px] text-muted">{t.d}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[13px]">
                Open
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </Page>
    </AppShell>
  );
}
