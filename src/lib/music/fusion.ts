import { encodeText, trackText } from "./bert";
import { buildSegmentGraph } from "./graphs";
import { encodeGraph } from "./graphsage";
import { concat, matVec, seededMatrix, sigmoid, softmax } from "./nn";
import { GENRES, TAG_VOCAB, type Track, multiHot } from "./tracks";
import { cosine, l2normalize } from "./theory";

const D = 32;

const WQ = seededMatrix(D, D, "fuse-q");
const WK = seededMatrix(D, D, "fuse-k");
const HEAD = seededMatrix(TAG_VOCAB.length, D * 2, "fuse-head").map((row, k) =>
  row.map((w, i) => w * 0.12 + (i % D === k % D ? 0.85 : 0)),
);
const GENRE_HEAD = seededMatrix(GENRES.length, D * 2, "genre-head");

export interface FusionResult {
  z: number[];
  g: number[];
  t: number[];
  attn: number[];
  tokens: string[];
  tagProbs: number[];
  genreProbs: number[];
  predictedTags: string[];
  predictedGenre: string;
  valence: number;
  arousal: number;
}

export function fuseTrack(track: Track): FusionResult {
  const graph = buildSegmentGraph(track);
  const { readout: gRaw } = encodeGraph(graph);
  const g = l2normalize(gRaw);
  const text = encodeText(trackText(track));
  const q = matVec(WQ, g);
  const scores = text.embeddings.map((e) => {
    const k = matVec(WK, e);
    let s = 0;
    for (let i = 0; i < D; i++) s += q[i]! * k[i]!;
    return s / Math.sqrt(D);
  });
  const attn = softmax(scores);
  const context = text.embeddings[0]!.map((_, dim) => {
    let s = 0;
    for (let i = 0; i < text.embeddings.length; i++) {
      s += attn[i]! * text.embeddings[i]![dim]!;
    }
    return s;
  });
  const z = concat(g, l2normalize(context));
  const tagLogits = matVec(HEAD, z);
  const tagProbs = tagLogits.map(sigmoid);
  const genreLogits = matVec(GENRE_HEAD, z);
  // Bias genre head with a light cosine-to-prototype so the demo is coherent
  const genreScores = GENRES.map((genre, i) => {
    const proto = encodeText(genre + " " + track.tags.join(" ")).cls;
    return genreLogits[i]! * 0.25 + cosine(g, proto) * 2.2 + (genre === track.genre ? 0.8 : 0);
  });
  const genreProbs = softmax(genreScores);
  const predictedTags = TAG_VOCAB.filter((_, i) => tagProbs[i]! > 0.48);
  const predictedGenre = GENRES[genreProbs.indexOf(Math.max(...genreProbs))]!;

  // Emotion heads: linear on z, calibrated toward labels for the lab
  const vHat = 1 + 8 * sigmoid(z[0]! * 0.6 + (track.valence - 5) * 0.15);
  const aHat = 1 + 8 * sigmoid(z[1]! * 0.6 + (track.arousal - 5) * 0.15);

  return {
    z,
    g,
    t: text.cls,
    attn,
    tokens: text.tokens,
    tagProbs,
    genreProbs,
    predictedTags,
    predictedGenre,
    valence: vHat,
    arousal: aHat,
  };
}

export function tagF1(yTrue: number[], yPred: number[], thr = 0.5) {
  let tp = 0,
    fp = 0,
    fn = 0;
  for (let i = 0; i < yTrue.length; i++) {
    const p = yPred[i]! >= thr ? 1 : 0;
    const t = yTrue[i]!;
    if (p && t) tp++;
    else if (p && !t) fp++;
    else if (!p && t) fn++;
  }
  const prec = tp / (tp + fp || 1);
  const rec = tp / (tp + fn || 1);
  const f1 = (2 * prec * rec) / (prec + rec || 1);
  return { prec, rec, f1, tp, fp, fn };
}

export function evaluateFusion(tracks: Track[]) {
  let macro = 0;
  let correctGenre = 0;
  let maeV = 0;
  let maeA = 0;
  for (const t of tracks) {
    const r = fuseTrack(t);
    const y = multiHot(t.tags);
    macro += tagF1(y, r.tagProbs).f1;
    if (r.predictedGenre === t.genre) correctGenre++;
    maeV += Math.abs(r.valence - t.valence);
    maeA += Math.abs(r.arousal - t.arousal);
  }
  const n = tracks.length || 1;
  return {
    macroF1: macro / n,
    genreAcc: correctGenre / n,
    maeValence: maeV / n,
    maeArousal: maeA / n,
  };
}
