import { encodeText } from "./bert";
import { buildSegmentGraph } from "./graphs";
import { graphEmbedding } from "./graphsage";
import { TRACKS, type Track } from "./tracks";
import { cosine, l2normalize } from "./theory";

export interface EmbeddingPair {
  track: Track;
  graph: number[];
  text: number[];
}

export function embedPair(track: Track): EmbeddingPair {
  const graph = l2normalize(graphEmbedding(buildSegmentGraph(track)));
  const text = encodeText(track.caption + " " + track.tags.join(" ")).cls;
  return { track, graph, text };
}

const CACHE: EmbeddingPair[] = TRACKS.map(embedPair);

export function allPairs(): EmbeddingPair[] {
  return CACHE;
}

export function retrieveFromCaption(query: string, k = 5) {
  const q = encodeText(query).cls;
  return CACHE.map((p) => ({
    track: p.track,
    score: cosine(q, p.graph),
  }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export function retrieveFromTrack(trackId: string, k = 5) {
  const p = CACHE.find((x) => x.track.id === trackId);
  if (!p) return [];
  return CACHE.filter((x) => x.track.id !== trackId)
    .map((x) => ({
      track: x.track,
      score: cosine(p.graph, x.text),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export function recallAtK(k: number): number {
  let hit = 0;
  for (const p of CACHE) {
    const ranked = CACHE.map((x) => ({
      id: x.track.id,
      score: cosine(p.text, x.graph),
    })).sort((a, b) => b.score - a.score);
    const idx = ranked.findIndex((r) => r.id === p.track.id);
    if (idx >= 0 && idx < k) hit++;
  }
  return hit / CACHE.length;
}

export function retrievalTable() {
  return {
    r1: recallAtK(1),
    r5: recallAtK(5),
    r10: recallAtK(10),
    n: CACHE.length,
  };
}
