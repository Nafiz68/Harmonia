import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Page } from "@/components/app-shell";
import { TrackPicker } from "@/components/track-picker";
import { GraphCanvas } from "@/components/graph-canvas";
import { Badge } from "@/components/ui/badge";
import { TRACKS } from "@/lib/music/tracks";
import { buildSegmentGraph } from "@/lib/music/graphs";
import { fuseTrack } from "@/lib/music/fusion";
import { ABLATIONS } from "@/lib/music/metrics";

export const Route = createFileRoute("/lab/fusion")({ component: FusionPage });

function FusionPage() {
  const [track, setTrack] = useState(TRACKS[0]!);
  const graph = useMemo(() => buildSegmentGraph(track), [track]);
  const r = useMemo(() => fuseTrack(track), [track]);

  return (
    <AppShell>
      <Page
        kicker="Task 3 · Hard"
        title="Cross-attention fusion"
        lede="The graph readout queries BERT token states. Concatenate g with the attended text, then predict tags and optional valence/arousal."
      >
        <div className="mb-6 rounded-[24px] border border-border bg-surface p-5">
          <p className="eq text-muted">
            A = softmax(Q K⊤ / √d)&nbsp;&nbsp; Q = g W<sub>Q</sub>&nbsp;&nbsp; K = H<sub>text</sub> W<sub>K</sub>
            <br />
            z = CONCAT(g, A H<sub>text</sub>)&nbsp;&nbsp; L = L<sub>tags</sub> + α‖v−v̂‖² + β‖a−â‖²
          </p>
        </div>

        <TrackPicker value={track} onChange={setTrack} />

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[24px] border border-border bg-surface p-4">
            <h2 className="px-2 font-serif text-2xl">Segment graph → g</h2>
            <GraphCanvas graph={graph} className="h-[280px] w-full" />
          </div>
          <div className="rounded-[24px] border border-border bg-surface p-5">
            <h2 className="font-serif text-2xl">Token attention from g</h2>
            <p className="mt-1 text-[12px] text-muted">
              Darker tokens are what the graph is looking at in the caption.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {r.tokens.map((tok, i) => (
                <span
                  key={tok + i}
                  className="rounded-md px-1.5 py-0.5 font-mono text-[12px]"
                  style={{
                    backgroundColor: `rgba(212,216,224,${(0.06 + r.attn[i]! * 1.8).toFixed(3)})`,
                  }}
                >
                  {tok}
                </span>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Valence</p>
                <p className="font-mono text-2xl tabular-nums">{r.valence.toFixed(2)}</p>
                <p className="text-[12px] text-muted">gold {track.valence.toFixed(1)}</p>
              </div>
              <div className="rounded-2xl border border-border p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Arousal</p>
                <p className="font-mono text-2xl tabular-nums">{r.arousal.toFixed(2)}</p>
                <p className="text-[12px] text-muted">gold {track.arousal.toFixed(1)}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Badge variant="accent">{r.predictedGenre}</Badge>
              {r.predictedTags.slice(0, 8).map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
          </div>
        </div>

        <h2 className="mt-10 font-serif text-2xl">Ablations (assignment target)</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ABLATIONS.map((a) => (
            <div key={a.name} className="rounded-[24px] border border-border bg-surface p-5">
              <p className="text-[13px] text-muted">{a.name}</p>
              <p className="mt-2 font-mono text-3xl tabular-nums">{a.f1.toFixed(2)}</p>
              <p className="mt-2 text-[12px] text-muted">{a.note}</p>
            </div>
          ))}
        </div>
      </Page>
    </AppShell>
  );
}
