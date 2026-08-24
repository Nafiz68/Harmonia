"""Synthetic toy corpus + hooks for GTZAN / FMA.

The synthetic set lets you train all four tasks on CPU in minutes.
Swap `--data gtzan` once audio is on disk.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import torch
from torch.utils.data import Dataset

from .graph_builder import chroma_template, chord_graph, segment_graph

GENRES = [
    "Jazz", "Rock", "Hip-Hop", "Classical", "Electronic",
    "Folk", "Metal", "Pop", "Blues", "Reggae",
]
TAGS = [
    "guitar", "piano", "drums", "bass", "synth", "violin", "vocals",
    "sad", "happy", "dark", "energetic", "calm", "melancholic", "aggressive",
    "fast", "slow", "acoustic", "electronic", "distorted", "ambient",
    "jazz", "rock", "classical", "hip hop", "metal", "folk", "pop", "blues",
    "reggae", "harmony", "melody", "swing", "groove", "reverb",
]

# (title, genre, tags, caption, chords, valence, arousal)
TOY = [
    ("Midnight Blue", "Jazz", ["jazz", "piano", "calm", "swing"],
     "late night jazz piano walking bass brushed drums warm sevenths",
     "Cm7 F7 Bbmaj7 Ebmaj7 Am7 D7 Gm7 C7 F7".split(), 4.2, 3.4),
    ("Iron Circuit", "Metal", ["metal", "guitar", "distorted", "aggressive", "fast"],
     "palm muted power chords double kick screamed vocal dense mix",
     "E5 E5 G5 A5 E5 C5 D5 E5".split(), 3.1, 8.4),
    ("Harbor Folk", "Folk", ["folk", "acoustic", "guitar", "sad", "slow"],
     "fingerpicked acoustic guitar close female vocal coastal leaving song",
     "G Em C D G C D".split(), 3.6, 2.8),
    ("Neon Pulse", "Electronic", ["electronic", "synth", "energetic", "fast"],
     "four on the floor analog bass staccato synth stabs dark club",
     "Am F C G".split(), 5.8, 7.6),
    ("Dust Road Blues", "Blues", ["blues", "guitar", "sad", "slow", "groove"],
     "slow twelve bar blues slide guitar upright bass brushed snare",
     "A7 A7 D7 A7 E7 D7 A7 E7".split(), 3.2, 3.9),
    ("Cathedral Air", "Classical", ["classical", "violin", "calm", "slow", "harmony"],
     "string quartet resonant hall arching theme suspensions chorale",
     "D A Bm F#m G D G A".split(), 5.4, 2.6),
    ("Cipher Flow", "Hip-Hop", ["hip hop", "drums", "bass", "dark", "groove"],
     "boom bap minor sample loop sub bass sparse piano stabs rap",
     "F#m D A E".split(), 4.8, 6.2),
    ("Glass Pop", "Pop", ["pop", "happy", "energetic", "melody"],
     "bright major pop stacked vocal harmonies acoustic verse synth chorus",
     "C G Am F".split(), 7.8, 6.9),
    ("Kingston Heat", "Reggae", ["reggae", "groove", "happy", "guitar", "bass"],
     "offbeat ska guitar round bass one drop drums horn answers",
     "A D A E".split(), 7.4, 5.5),
    ("Velvet Hour", "Jazz", ["jazz", "piano", "slow", "melancholic", "calm"],
     "ballad trio piano bass brushes extended tertian harmony late evening",
     "Dbmaj7 Bbm7 Eb7 Abmaj7 Fm7 Bb7 Ebm7 Ab7".split(), 3.8, 2.1),
    ("Static Garden", "Electronic", ["electronic", "ambient", "synth", "calm", "slow"],
     "long evolving pads granular noise rain under distant piano",
     "Em C G D".split(), 4.1, 1.8),
    ("Redline", "Rock", ["rock", "guitar", "energetic", "distorted", "fast"],
     "two overdriven guitars driving snare shouted chorus pentatonic solo",
     "A5 D5 E5 A5 G5 D5".split(), 6.2, 8.1),
    ("Paper Lanterns", "Folk", ["folk", "acoustic", "sad", "melancholic", "slow"],
     "nylon string guitar hushed male vocal letter never sent",
     "D Bm G A".split(), 2.9, 2.2),
    ("Voltage II", "Metal", ["metal", "guitar", "aggressive", "dark", "fast"],
     "odd meter riffs harmonic minor leads blast beat breakdown",
     "B5 B5 G5 F#5 E5".split(), 2.8, 8.7),
    ("Soft Grid", "Hip-Hop", ["hip hop", "piano", "calm", "slow", "melancholic"],
     "lofi dusty piano loop vinyl noise lazy snare warm sub",
     "Fm Dbmaj7 Eb Cm7".split(), 4.4, 2.9),
    ("Dawn String", "Classical", ["classical", "violin", "happy", "melody", "calm"],
     "bright allegro string orchestra rising first violin theme",
     "G D Em C G D".split(), 7.6, 5.8),
    ("Wire and Rain", "Rock", ["rock", "guitar", "sad", "melancholic"],
     "mid tempo rock ballad clean arpeggios overdrive chorus rain intro",
     "Em C G D".split(), 3.4, 4.6),
    ("Market Day", "Reggae", ["reggae", "bass", "groove", "happy"],
     "upbeat reggae bubbling bass horn riff call and response",
     "C F C G".split(), 8.1, 6.0),
    ("Crossroads 9", "Blues", ["blues", "guitar", "energetic", "groove", "fast"],
     "faster shuffle blues electric guitar harmonica shouted vocal",
     "E7 E7 A7 E7 B7 A7 E7 B7".split(), 6.4, 6.8),
    ("Silver Hook", "Pop", ["pop", "happy", "energetic", "melody"],
     "maximalist pop chorus sidechained pads whistled countermelody hook",
     "F C Dm Bb".split(), 8.2, 7.4),
]


def _onehot(label: str, vocab: list[str]) -> np.ndarray:
    y = np.zeros(len(vocab), dtype=np.float32)
    if label in vocab:
        y[vocab.index(label)] = 1.0
    return y


def _multihot(tags: list[str], vocab: list[str]) -> np.ndarray:
    y = np.zeros(len(vocab), dtype=np.float32)
    for t in tags:
        if t in vocab:
            y[vocab.index(t)] = 1.0
    return y


def _segments_from_chords(chords: list[str]) -> list[dict]:
    segs = []
    chunk = max(1, len(chords) // 4)
    for i in range(0, len(chords), chunk):
        sl = chords[i : i + chunk]
        chroma = np.mean([chroma_template(c) for c in sl], axis=0)
        mfcc = np.concatenate([chroma, chroma[:1]])  # 13-dim stand-in
        segs.append({"id": len(segs), "chroma": chroma, "mfcc": mfcc})
    return segs


class ToyMusic(Dataset):
    def __init__(self, split: str = "train"):
        n = len(TOY)
        idx = list(range(n))
        rng = np.random.RandomState(42)
        rng.shuffle(idx)
        cut = int(0.7 * n)
        cut2 = int(0.85 * n)
        if split == "train":
            pick = idx[:cut]
        elif split == "val":
            pick = idx[cut:cut2]
        else:
            pick = idx[cut2:]
        self.items = []
        for i in pick:
            title, genre, tags, caption, chords, v, a = TOY[i]
            g = segment_graph(_segments_from_chords(chords))
            cg = chord_graph(chords, chroma_template)
            self.items.append(
                {
                    "title": title,
                    "caption": caption,
                    "genre": torch.tensor(GENRES.index(genre)),
                    "tags": torch.from_numpy(_multihot(tags, TAGS)),
                    "valence": torch.tensor(v / 9.0),
                    "arousal": torch.tensor(a / 9.0),
                    "graph": g,
                    "chord_graph": cg,
                }
            )

    def __len__(self):
        return len(self.items)

    def __getitem__(self, i):
        return self.items[i]


def load_split(name: str, split: str, root: Path | None = None) -> Dataset:
    if name == "synthetic":
        return ToyMusic(split)
    raise SystemExit(
        f"Dataset '{name}' is not wired in this starter. "
        "Point src/dataset.py:load_split at your GTZAN/FMA folder "
        "(see README) or keep --data synthetic."
    )
