import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Page } from "@/components/app-shell";
import { TrackPicker } from "@/components/track-picker";
import { GraphCanvas } from "@/components/graph-canvas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TRACKS, GENRES } from "@/lib/music/tracks";
import { buildChordGraph, buildSegmentGraph } from "@/lib/music/graphs";
import { encodeGraph } from "@/lib/music/graphsage";
import { playChord, playProgression } from "@/lib/music/audio";
import { fuseTrack } from "@/lib/music/fusion";

export const Route = createFileRoute("/lab/gnn")({ component: GnnPage });

function GnnPage() {
  const [track, setTrack] = useState(TRACKS[1]!);
  const [mode, setMode] = useState<"chord" | "segment">("chord");
  const [hi, setHi] = useState<number | null>(null);
  const [layer, setLayer] = useState(2);
  const graph = useMemo(
    () => (mode === "chord" ? buildChordGraph(track) : buildSegmentGraph(track)),
    [mode, track],
  );
  const encoded = useMemo(() => encodeGraph(graph), [graph]);
  const fused = useMemo(() => fuseTrack(track), [track]);
  const [stopper, setStopper] = useState<null | (() => void)>(null);

  return (
    <AppShell>
      <Page
        kicker="Task 2 · Medium"
        title="GraphSAGE on music structure"
        lede="Nodes are chords or time segments. Edges are transitions, temporal adjacency, and chroma/MFCC similarity. Two GraphSAGE layers, then mean pooling."
      >
        <div className="mb-6 rounded-[24px] border border-border bg-surface p-5">
          <p className="eq text-muted">
            h<sub>i</sub>
            <sup>(l+1)</sup> = σ( W<sup>(l)</sup> · CONCAT( h<sub>i</sub>
            <sup>(l)</sup>, MEAN<sub>j∈N(i)</sub> h<sub>j</sub>
            <sup>(l)</sup> ) )
            <br />
            g = 1/|V| Σ<sub>i</sub> h<sub>i</sub>
            <sup>(L)</sup>
            &nbsp;&nbsp; ŷ = σ(W g + b)
          </p>
        </div>

        <TrackPicker value={track} onChange={setTrack} />

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            variant={mode === "chord" ? "default" : "secondary"}
            size="sm"
            onClick={() => setMode("chord")}
          >
            Chord graph
          </Button>
          <Button
            variant={mode === "segment" ? "default" : "secondary"}
            size="sm"
            onClick={() => setMode("segment")}
          >
            Segment graph
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              stopper?.();
              const stop = playProgression(track.chords, track.bpm, (i) => {
                const sym = track.chords[i]?.symbol;
                const idx = graph.nodes.findIndex((n) => n.label === sym);
                if (idx >= 0) setHi(idx);
              });
              setStopper(() => stop);
            }}
          >
            Play progression
          </Button>
          <div className="ml-auto flex items-center gap-2 text-[12px] text-muted">
            Layer
            {[0, 1, 2].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLayer(l)}
                className={
                  layer === l
                    ? "rounded-lg bg-elevated px-2 py-1 text-fg"
                    : "rounded-lg px-2 py-1"
                }
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-border bg-surface p-3">
            <GraphCanvas
              graph={graph}
              highlight={hi}
              pulseLayer={layer}
              onSelect={(id) => {
                setHi(id);
                const n = graph.nodes[id];
                if (n && mode === "chord") playChord(n.label);
              }}
              className="h-[360px] w-full"
            />
          </div>
          <div className="space-y-4">
            <div className="rounded-[24px] border border-border bg-surface p-5">
              <h2 className="font-serif text-2xl">Readout</h2>
              <p className="mt-1 text-[13px] text-muted">
                {graph.nodes.length} nodes · {graph.edges.length} edges · dim {encoded.readout.length}
              </p>
              <div className="mt-3 flex h-16 items-end gap-px">
                {encoded.readout.map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-accent/80"
                    style={{ height: `${8 + Math.abs(v) * 90}%` }}
                  />
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="accent">{fused.predictedGenre}</Badge>
                <Badge variant="outline">gold {track.genre}</Badge>
              </div>
            </div>
            <div className="rounded-[24px] border border-border bg-surface p-5">
              <h2 className="font-serif text-xl">Genre distribution</h2>
              <ul className="mt-3 space-y-1.5">
                {GENRES.map((g, i) => (
                  <li key={g} className="flex items-center gap-2 text-[12px]">
                    <span className="w-20 text-muted">{g}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
                      <div
                        className="h-full bg-signal"
                        style={{ width: `${Math.round(fused.genreProbs[i]! * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Page>
    </AppShell>
  );
}
