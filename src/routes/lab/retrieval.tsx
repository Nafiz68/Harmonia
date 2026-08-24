import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Page } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { retrieveFromCaption, retrievalTable } from "@/lib/music/contrastive";

export const Route = createFileRoute("/lab/retrieval")({ component: RetrievalPage });

const EXAMPLES = [
  "late night jazz piano with walking bass and brushed drums",
  "aggressive distorted guitars and double kick drums",
  "quiet acoustic folk song about leaving a coastal town",
  "four on the floor synths in a dark club",
  "string quartet in a resonant hall, slow arching theme",
  "lo-fi dusty piano loop with vinyl crackle",
];

function RetrievalPage() {
  const [q, setQ] = useState(EXAMPLES[0]!);
  const hits = useMemo(() => retrieveFromCaption(q, 5), [q]);
  const table = retrievalTable();

  return (
    <AppShell>
      <Page
        kicker="Task 4 · Advanced"
        title="Caption to audio retrieval"
        lede="A dual encoder maps graphs and captions into one space. InfoNCE pulls matched pairs together and pushes the rest of the batch away. Query with language, rank clips."
      >
        <div className="mb-6 rounded-[24px] border border-border bg-surface p-5">
          <p className="eq text-muted">
            L<sub>NCE</sub> = −log [ exp(sim(g<sub>i</sub>, t<sub>i</sub>)/τ) / Σ<sub>j</sub> exp(sim(g<sub>i</sub>, t<sub>j</sub>)/τ) ]
            <br />
            sim(u, v) = u⊤v / (‖u‖ ‖v‖)
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { k: "R@1", v: table.r1 },
            { k: "R@5", v: table.r5 },
            { k: "R@10", v: table.r10 },
          ].map((m) => (
            <div key={m.k} className="rounded-[24px] border border-border bg-surface p-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
                Toy corpus · {m.k}
              </p>
              <p className="mt-1 font-mono text-3xl tabular-nums">{(m.v * 100).toFixed(0)}%</p>
              <p className="text-[12px] text-muted">{table.n} paired clips</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-[24px] border border-border bg-surface p-5">
          <label className="text-[12px] uppercase tracking-[0.14em] text-muted">
            Query caption
          </label>
          <textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            rows={2}
            className="mt-2 w-full rounded-2xl border border-border bg-bg px-3 py-2 text-sm outline-none ring-ring/60 focus:ring-2"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <Button key={ex} size="sm" variant="secondary" onClick={() => setQ(ex)}>
                {ex.slice(0, 28)}…
              </Button>
            ))}
          </div>
        </div>

        <ol className="mt-6 space-y-3">
          {hits.map((h, i) => (
            <li
              key={h.track.id}
              className="rounded-[24px] border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[12px] text-muted">#{i + 1}</p>
                  <h3 className="font-serif text-2xl">
                    {h.track.title}
                    <span className="text-muted"> · {h.track.artist}</span>
                  </h3>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg tabular-nums">{h.score.toFixed(3)}</p>
                  <p className="text-[11px] text-muted">cosine</p>
                </div>
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{h.track.caption}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="outline">{h.track.genre}</Badge>
                {h.track.tags.slice(0, 6).map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </Page>
    </AppShell>
  );
}
