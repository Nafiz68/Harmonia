import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Page } from "@/components/app-shell";
import { TrackPicker } from "@/components/track-picker";
import { GraphCanvas } from "@/components/graph-canvas";
import { Badge } from "@/components/ui/badge";
import { TRACKS } from "@/lib/music/tracks";
import { buildChordGraph, buildSegmentGraph } from "@/lib/music/graphs";
import { playChord } from "@/lib/music/audio";
import { NOTE_NAMES } from "@/lib/music/theory";

export const Route = createFileRoute("/pipeline")({ component: PipelinePage });

function Spectrogram({ chroma }: { chroma: number[][] }) {
  return (
    <div className="grid h-36 grid-cols-1 overflow-hidden rounded-2xl border border-border bg-bg">
      <div
        className="grid h-full"
        style={{ gridTemplateColumns: `repeat(${chroma.length}, minmax(0, 1fr))` }}
      >
        {chroma.map((col, i) => (
          <div key={i} className="flex h-full flex-col-reverse">
            {col.map((v, pc) => (
              <div
                key={pc}
                className="flex-1"
                style={{
                  backgroundColor: `rgba(212,216,224,${(0.08 + v * 0.75).toFixed(3)})`,
                }}
                title={`${NOTE_NAMES[pc]}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelinePage() {
  const [track, setTrack] = useState(TRACKS[0]!);
  const chordGraph = useMemo(() => buildChordGraph(track), [track]);
  const segGraph = useMemo(() => buildSegmentGraph(track), [track]);
  const chromaCols = useMemo(
    () => track.chords.map((c) => {
      // reuse node chroma
      const n = chordGraph.nodes.find((x) => x.label === c.symbol);
      return n?.features.slice(0, 12) ?? new Array(12).fill(0.1);
    }),
    [track, chordGraph],
  );

  return (
    <AppShell>
      <Page
        kicker="Preprocessing"
        title="Audio to graph, text to tokens"
        lede="The assignment pipeline: resample, log-mel or chroma, segment, build graphs, tokenize. This lab uses chroma-derived chord graphs so every node is audible."
      >
        <TrackPicker value={track} onChange={setTrack} />

        <ol className="mt-8 grid gap-3 lg:grid-cols-5">
          {[
            "22,050 Hz resample",
            "Chroma / log-mel",
            "Beat or 5–10 s windows",
            "Chord + segment graphs",
            "BERT tokenize ≤ 256",
          ].map((s, i) => (
            <li
              key={s}
              className="rounded-2xl border border-border bg-surface px-4 py-3 text-[13px]"
            >
              <span className="font-mono text-[11px] text-muted">0{i + 1}</span>
              <div className="mt-1">{s}</div>
            </li>
          ))}
        </ol>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[24px] border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-2xl">Chroma over the progression</h2>
              <Badge variant="outline">{track.key} · {track.bpm} BPM</Badge>
            </div>
            <Spectrogram chroma={chromaCols} />
            <p className="mt-3 text-[13px] text-muted">
              12 pitch classes, one column per chord event. In the Python project this is
              <span className="font-mono"> librosa.feature.chroma_cqt</span> on the waveform.
            </p>
          </div>
          <div className="rounded-[24px] border border-border bg-surface p-5">
            <h2 className="font-serif text-2xl">Segments</h2>
            <ul className="mt-3 space-y-2">
              {track.segments.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-[13px]"
                >
                  <span className="capitalize">{s.label}</span>
                  <span className="font-mono text-muted">
                    {s.start}–{s.end} · {s.chords.join(" ")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[24px] border border-border bg-surface p-4">
            <h2 className="px-2 font-serif text-2xl">Chord-transition graph</h2>
            <GraphCanvas
              graph={chordGraph}
              onSelect={(id) => {
                const n = chordGraph.nodes[id];
                if (n) playChord(n.label);
              }}
              className="h-[280px] w-full"
            />
          </div>
          <div className="rounded-[24px] border border-border bg-surface p-4">
            <h2 className="px-2 font-serif text-2xl">Segment graph</h2>
            <p className="px-2 text-[12px] text-muted">
              {"Solid = temporal adjacency. Teal dashed = cosine(chroma, mfcc) > τ."}
            </p>
            <GraphCanvas graph={segGraph} className="h-[260px] w-full" />
          </div>
        </div>
      </Page>
    </AppShell>
  );
}
