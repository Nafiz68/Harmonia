/** Tiny linear-algebra helpers for in-browser GraphSAGE / attention. */

export function zeros(n: number): number[] {
  return new Array(n).fill(0);
}

export function matVec(W: number[][], x: number[]): number[] {
  return W.map((row) => {
    let s = 0;
    for (let i = 0; i < row.length; i++) s += row[i]! * (x[i] ?? 0);
    return s;
  });
}

export function relu(x: number[]): number[] {
  return x.map((v) => (v > 0 ? v : 0));
}

export function sigmoid(x: number): number {
  if (x > 20) return 1;
  if (x < -20) return 0;
  return 1 / (1 + Math.exp(-x));
}

export function softmax(x: number[]): number[] {
  const m = Math.max(...x);
  const e = x.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0) || 1;
  return e.map((v) => v / s);
}

export function add(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + (b[i] ?? 0));
}

export function scale(a: number[], s: number): number[] {
  return a.map((v) => v * s);
}

export function concat(a: number[], b: number[]): number[] {
  return a.concat(b);
}

export function meanPool(rows: number[][]): number[] {
  if (rows.length === 0) return [];
  const d = rows[0]!.length;
  const out = zeros(d);
  for (const r of rows) {
    for (let i = 0; i < d; i++) out[i]! += r[i] ?? 0;
  }
  for (let i = 0; i < d; i++) out[i]! /= rows.length;
  return out;
}

export function seededMatrix(rows: number, cols: number, seed: string): number[][] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    const u = (h >>> 0) / 4294967296;
    return (u * 2 - 1) * Math.sqrt(2 / cols);
  };
  return Array.from({ length: rows }, () => Array.from({ length: cols }, rand));
}

export function pad(v: number[], dim: number): number[] {
  if (v.length >= dim) return v.slice(0, dim);
  return v.concat(zeros(dim - v.length));
}

export function argmax(v: number[]): number {
  let i = 0;
  for (let k = 1; k < v.length; k++) if (v[k]! > v[i]!) i = k;
  return i;
}

export function topk(v: number[], k: number): { index: number; score: number }[] {
  return v
    .map((score, index) => ({ index, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
