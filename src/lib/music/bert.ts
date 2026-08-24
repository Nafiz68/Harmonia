import { TAG_VOCAB, type Track } from "./tracks";
import {
  matVec,
  meanPool,
  seededMatrix,
  sigmoid,
  softmax,
  zeros,
} from "./nn";
import { l2normalize } from "./theory";

const DIM = 32;

const STOP = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "in",
  "on",
  "to",
  "with",
  "a",
  "is",
  "are",
  "for",
  "from",
  "by",
  "at",
  "as",
  "it",
  "its",
  "then",
  "than",
  "into",
  "over",
  "under",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9#\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t))
    .slice(0, 48);
}

function tokenVec(tok: string): number[] {
  const W = seededMatrix(DIM, 1, "tok-" + tok).map((r) => r[0]!);
  // Boost known music tags so attention is musically meaningful
  const boost = TAG_VOCAB.findIndex((t) => t === tok || t.replace(" ", "") === tok);
  if (boost >= 0) {
    const v = zeros(DIM);
    v[boost % DIM] = 1.4;
    return l2normalize(v.map((x, i) => x + W[i]! * 0.25));
  }
  return l2normalize(W);
}

export interface TextEncoding {
  tokens: string[];
  embeddings: number[][];
  cls: number[];
  attn: number[];
}

export function encodeText(text: string): TextEncoding {
  const tokens = tokenize(text);
  const toks = tokens.length ? tokens : ["music"];
  const embeddings = toks.map(tokenVec);
  const cls = l2normalize(meanPool(embeddings));
  // Self-attention of CLS against tokens (single head)
  const scores = embeddings.map((e) => {
    let s = 0;
    for (let i = 0; i < DIM; i++) s += cls[i]! * e[i]!;
    return s / Math.sqrt(DIM);
  });
  const attn = softmax(scores);
  return { tokens: toks, embeddings, cls, attn };
}

export function trackText(track: Track): string {
  return [track.caption, track.lyrics, track.tags.join(" "), track.genre].join(" ");
}

/** Linear tag head over CLS. Weights biased toward vocab identity. */
const TAG_HEAD = seededMatrix(TAG_VOCAB.length, DIM, "tag-head").map((row, k) =>
  row.map((w, i) => w * 0.15 + (i === k % DIM ? 1.1 : 0)),
);

export function predictTags(text: string, threshold = 0.5) {
  const enc = encodeText(text);
  const logits = matVec(TAG_HEAD, enc.cls);
  const probs = logits.map(sigmoid);
  const predicted = TAG_VOCAB.filter((_, i) => probs[i]! >= threshold);
  return { encoding: enc, probs, predicted };
}

export function tagProbMap(text: string): Record<string, number> {
  const { probs } = predictTags(text, 0);
  const m: Record<string, number> = {};
  TAG_VOCAB.forEach((t, i) => {
    m[t] = probs[i]!;
  });
  return m;
}
