export const PITCH_CLASS: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

const QUALITY_INTERVALS: Record<string, number[]> = {
  "": [0, 4, 7],
  maj: [0, 4, 7],
  M: [0, 4, 7],
  m: [0, 3, 7],
  min: [0, 3, 7],
  "7": [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  M7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  min7: [0, 3, 7, 10],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  "5": [0, 7],
  "6": [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  add9: [0, 4, 7, 14],
  "9": [0, 4, 7, 10, 14],
  m9: [0, 3, 7, 10, 14],
  "11": [0, 4, 7, 10, 14, 17],
  m11: [0, 3, 7, 10, 14, 17],
};

const CHORD_RE = /^([A-G](?:#|b)?)(.*)$/;

export function parseChord(symbol: string): { root: number; pcs: number[] } {
  const m = CHORD_RE.exec(symbol.trim());
  if (!m) return { root: 0, pcs: [0, 4, 7] };
  const root = PITCH_CLASS[m[1]!] ?? 0;
  const q = m[2] ?? "";
  const iv = QUALITY_INTERVALS[q] ?? QUALITY_INTERVALS[""]!;
  return { root, pcs: iv.map((i) => (root + i) % 12) };
}

export function chromaFromChord(symbol: string): number[] {
  const { pcs } = parseChord(symbol);
  const v = new Array(12).fill(0);
  for (const pc of pcs) v[pc] = 1;
  const n = Math.sqrt(pcs.length) || 1;
  return v.map((x) => x / n);
}

export function meanVec(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const d = vectors[0]!.length;
  const out = new Array(d).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < d; i++) out[i] += v[i] ?? 0;
  }
  for (let i = 0; i < d; i++) out[i] /= vectors.length;
  return out;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

export function l2normalize(v: number[]): number[] {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) || 1;
  return v.map((x) => x / n);
}

export function hash01(seed: string, i = 0): number {
  let h = 2166136261 ^ i;
  for (let k = 0; k < seed.length; k++) {
    h ^= seed.charCodeAt(k);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return ((h >>> 0) % 10000) / 10000;
}

/** A4 = 440. MIDI 69. */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function chordFrequencies(symbol: string, octave = 4): number[] {
  const { pcs } = parseChord(symbol);
  return pcs.map((pc) => midiToFreq(12 * octave + pc));
}

export const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
