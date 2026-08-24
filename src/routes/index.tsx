import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, AudioLines, GitGraph, Layers, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraphCanvas } from "@/components/graph-canvas";
import { buildChordGraph } from "@/lib/music/graphs";
import { TRACKS } from "@/lib/music/tracks";
import { playChord } from "@/lib/music/audio";

export const Route = createFileRoute("/")({ component: Home });

const TASKS = [
  {
    n: "01",
    title: "BERT tags",
    to: "/lab/bert",
    icon: AudioLines,
    body: "Multi-label classifier on lyrics, tags, and MusicCaps-style captions. CLS token, BCE, Macro-F1.",
  },
  {
    n: "02",
    title: "GNN structure",
    to: "/lab/gnn",
    icon: GitGraph,
    body: "GraphSAGE on chord-transition and segment graphs. Mean readout vs a CNN spectrogram baseline.",
  },
  {
    n: "03",
    title: "GNN–BERT fusion",
    to: "/lab/fusion",
    icon: Layers,
    body: "Cross-attention: query from the graph, keys from token states. Genre, mood, valence/arousal.",
  },
  {
    n: "04",
    title: "Contrastive retrieval",
    to: "/lab/retrieval",
    icon: Search,
    body: "Shared embedding space. Caption → audio R@K, InfoNCE, qualitative matches.",
  },
];

function Home() {
  const track = TRACKS[0]!;
  const graph = useMemo(() => buildChordGraph(track), [track]);
  const [hi, setHi] = useState<number | null>(0);

  return (
    <AppShell>
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="stagger-in">
            <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-muted">
              CSE425 · Neural Networks
            </p>
            <h1 className="font-serif text-[2.6rem] leading-[1.05] tracking-tight sm:text-6xl">
              Understand music as language and graph.
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted">
              Harmonia is a working GNN + BERT lab for the supervised project
              <em className="text-fg"> GNN-Based BERT for Understanding Context from Music</em>.
              Run the four tasks here, then download the PyTorch repo and train on FMA, MagnaTagATune, or MusicCaps.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/guide">
                  Open the build guide
                  <ArrowRight />
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link to="/lab/gnn">Play a chord graph</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              <Badge>DistilBERT</Badge>
              <Badge>GraphSAGE</Badge>
              <Badge>Cross-attention</Badge>
              <Badge>InfoNCE</Badge>
            </div>
          </div>
          <div className="rounded-[28px] border border-border bg-surface p-3 sm:p-4">
            <div className="flex items-center justify-between px-2 pb-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
                  Chord-transition graph
                </p>
                <p className="text-sm">
                  {track.title} · {track.artist}
                </p>
              </div>
              <Badge variant="outline">{track.genre}</Badge>
            </div>
            <GraphCanvas
              graph={graph}
              highlight={hi}
              onSelect={(id) => {
                setHi(id);
                const node = graph.nodes[id];
                if (node) playChord(node.label);
              }}
              className="h-[280px] w-full sm:h-[340px]"
            />
            <p className="px-2 pt-2 text-[12px] text-muted">
              Tap a node to hear the chord. Edges are observed transitions, weighted by count.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-muted">Four-task roadmap</p>
        <h2 className="font-serif text-3xl tracking-tight">The assignment, running.</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {TASKS.map((t) => (
            <Link
              key={t.n}
              to={t.to}
              className="group rounded-[24px] border border-border bg-surface p-5 transition-colors duration-150 hover:bg-elevated"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-[12px] text-muted">{t.n}</span>
                <t.icon className="size-4 text-muted" />
              </div>
              <h3 className="mt-4 font-serif text-2xl">{t.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{t.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[13px] text-fg">
                Open task
                <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-3">
          {[
            {
              t: "Audio becomes a graph",
              d: "Windows of chroma and MFCC become nodes. Temporal adjacency plus cosine similarity > τ become edges. GraphSAGE passes messages along chord changes and repeated sections.",
            },
            {
              t: "Text becomes context",
              d: "Lyrics, user tags, and expert captions go through BERT. The CLS vector is a semantic summary; token states stay available for cross-attention.",
            },
            {
              t: "Fusion predicts context",
              d: "z = Fusion(g, t). Multi-label tags, genre, and optional valence/arousal. Contrastive training aligns the two spaces for retrieval.",
            },
          ].map((b) => (
            <div key={b.t}>
              <h3 className="font-serif text-xl">{b.t}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{b.d}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
