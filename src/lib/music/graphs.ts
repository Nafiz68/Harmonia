import { chromaFromChord, cosine } from "./theory";
import type { Track } from "./tracks";

export interface GraphNode {
  id: number;
  kind: "chord" | "segment";
  label: string;
  features: number[];
  extra?: string;
}

export interface GraphEdge {
  source: number;
  target: number;
  weight: number;
  kind: "transition" | "temporal" | "similarity";
}

export interface MusicGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  kind: "chord" | "segment";
}

function uniqueChords(track: Track): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of track.chords) {
    if (!seen.has(c.symbol)) {
      seen.add(c.symbol);
      out.push(c.symbol);
    }
  }
  return out;
}

export function buildChordGraph(track: Track): MusicGraph {
  const chords = uniqueChords(track);
  const index = new Map(chords.map((c, i) => [c, i]));
  const nodes: GraphNode[] = chords.map((symbol, id) => ({
    id,
    kind: "chord",
    label: symbol,
    features: chromaFromChord(symbol),
  }));

  const counts = new Map<string, number>();
  for (let i = 0; i < track.chords.length - 1; i++) {
    const a = index.get(track.chords[i]!.symbol);
    const b = index.get(track.chords[i + 1]!.symbol);
    if (a === undefined || b === undefined || a === b) continue;
    const key = `${a}-${b}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const max = Math.max(1, ...counts.values());
  const edges: GraphEdge[] = [];
  for (const [key, w] of counts) {
    const [s, t] = key.split("-").map(Number);
    edges.push({
      source: s!,
      target: t!,
      weight: w / max,
      kind: "transition",
    });
  }
  return { nodes, edges, kind: "chord" };
}

export function buildSegmentGraph(track: Track, tau = 0.72): MusicGraph {
  const nodes: GraphNode[] = track.segments.map((s) => ({
    id: s.id,
    kind: "segment",
    label: s.label,
    extra: `${s.start}–${s.end} beats`,
    features: [...s.chroma, ...s.mfcc],
  }));
  const edges: GraphEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      source: i,
      target: i + 1,
      weight: 1,
      kind: "temporal",
    });
  }
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 2; j < nodes.length; j++) {
      const sim = cosine(nodes[i]!.features, nodes[j]!.features);
      if (sim > tau) {
        edges.push({
          source: i,
          target: j,
          weight: sim,
          kind: "similarity",
        });
      }
    }
  }
  return { nodes, edges, kind: "segment" };
}

export function adjacency(graph: MusicGraph): number[][] {
  const n = graph.nodes.length;
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const e of graph.edges) {
    adj[e.source]!.push(e.target);
    adj[e.target]!.push(e.source);
  }
  return adj.map((row) => [...new Set(row)]);
}

export function edgeIndex(graph: MusicGraph): [number[], number[]] {
  const src: number[] = [];
  const dst: number[] = [];
  for (const e of graph.edges) {
    src.push(e.source, e.target);
    dst.push(e.target, e.source);
  }
  return [src, dst];
}
