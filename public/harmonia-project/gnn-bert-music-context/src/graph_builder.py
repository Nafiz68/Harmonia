"""Chord-transition and segment graphs.

A graph is stored as:
  x:          float tensor [N, F]
  edge_index: long tensor  [2, E]  (undirected, both directions)
  edge_weight: float tensor [E]
  y:          labels (set by the dataset)
"""
from __future__ import annotations

from collections import Counter

import numpy as np
import torch


def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    na = np.linalg.norm(a) * np.linalg.norm(b)
    if na == 0:
        return 0.0
    return float(np.dot(a, b) / na)


def segment_graph(segments: list[dict], tau: float = 0.7) -> dict:
    n = len(segments)
    x = np.stack(
        [np.concatenate([s["chroma"], s["mfcc"]]) for s in segments], axis=0
    ).astype(np.float32)
    src, dst, w = [], [], []
    for i in range(n - 1):
        src += [i, i + 1]
        dst += [i + 1, i]
        w += [1.0, 1.0]
    for i in range(n):
        for j in range(i + 2, n):
            sim = _cosine(x[i], x[j])
            if sim > tau:
                src += [i, j]
                dst += [j, i]
                w += [sim, sim]
    if not src:
        src, dst, w = [0], [0], [1.0]
    return {
        "x": torch.from_numpy(x),
        "edge_index": torch.tensor([src, dst], dtype=torch.long),
        "edge_weight": torch.tensor(w, dtype=torch.float32),
        "n": n,
    }


def chord_graph(chord_seq: list[str], chroma_of) -> dict:
    """Nodes = unique chords; edges = observed transitions, weighted by count."""
    uniq = list(dict.fromkeys(chord_seq))
    index = {c: i for i, c in enumerate(uniq)}
    x = np.stack([chroma_of(c) for c in uniq]).astype(np.float32)
    counts: Counter[tuple[int, int]] = Counter()
    for a, b in zip(chord_seq, chord_seq[1:]):
        ia, ib = index[a], index[b]
        if ia != ib:
            counts[(ia, ib)] += 1
    src, dst, w = [], [], []
    mx = max(counts.values()) if counts else 1
    for (i, j), c in counts.items():
        src += [i, j]
        dst += [j, i]
        ww = c / mx
        w += [ww, ww]
    if not src:
        src, dst, w = [0], [0], [1.0]
    return {
        "x": torch.from_numpy(x),
        "edge_index": torch.tensor([src, dst], dtype=torch.long),
        "edge_weight": torch.tensor(w, dtype=torch.float32),
        "n": len(uniq),
        "labels": uniq,
    }


def chroma_template(symbol: str) -> np.ndarray:
    """Very small chord → pitch-class template (no audio required)."""
    pc = {
        "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5,
        "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11,
    }
    q = {
        "": (0, 4, 7), "maj": (0, 4, 7), "m": (0, 3, 7), "min": (0, 3, 7),
        "7": (0, 4, 7, 10), "maj7": (0, 4, 7, 11), "m7": (0, 3, 7, 10),
        "5": (0, 7), "dim": (0, 3, 6), "aug": (0, 4, 8), "sus4": (0, 5, 7),
    }
    root, rest = symbol[0], symbol[1:]
    if rest[:1] in ("#", "b"):
        root, rest = symbol[:2], symbol[2:]
    r = pc.get(root, 0)
    iv = q.get(rest, (0, 4, 7))
    v = np.zeros(12, dtype=np.float32)
    for i in iv:
        v[(r + i) % 12] = 1.0
    n = np.linalg.norm(v) or 1.0
    return v / n
