"""Mel, chroma, and beat-synchronous segmentation.

Matches the assignment preprocessing:
  resample 22_050 Hz → log-mel (128) or chroma (12) → fixed or beat windows.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

try:
    import librosa
except ImportError:  # synthetic path does not need librosa
    librosa = None


@dataclass
class AudioFeatures:
    sr: int
    chroma: np.ndarray  # (12, T)
    logmel: np.ndarray  # (n_mels, T)
    mfcc: np.ndarray  # (13, T)
    tempo: float
    beats: np.ndarray


def load_mono(path: str, sr: int = 22050) -> np.ndarray:
    if librosa is None:
        raise RuntimeError("librosa is required to read audio files")
    y, _ = librosa.load(path, sr=sr, mono=True)
    peak = np.max(np.abs(y)) + 1e-9
    return (y / peak).astype(np.float32)


def extract(y: np.ndarray, sr: int = 22050, n_mels: int = 128) -> AudioFeatures:
    if librosa is None:
        raise RuntimeError("librosa is required for feature extraction")
    hop = 512
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop)
    mel = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=n_mels, hop_length=hop)
    logmel = librosa.power_to_db(mel, ref=np.max)
    mfcc = librosa.feature.mfcc(S=logmel, n_mfcc=13)
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop)
    return AudioFeatures(sr, chroma, logmel, mfcc, float(np.asarray(tempo)), beats)


def window_features(feat: AudioFeatures, seconds: float = 5.0) -> list[dict]:
    """Fixed-length windows. Each window is a graph node."""
    hop = 512
    frames_per = max(1, int(seconds * feat.sr / hop))
    t = feat.chroma.shape[1]
    segs = []
    i = 0
    idx = 0
    while i < t:
        j = min(t, i + frames_per)
        segs.append(
            {
                "id": idx,
                "start": i,
                "end": j,
                "chroma": feat.chroma[:, i:j].mean(axis=1),
                "mfcc": feat.mfcc[:, i:j].mean(axis=1),
                "logmel": feat.logmel[:, i:j].mean(axis=1),
            }
        )
        idx += 1
        i = j
    return segs
