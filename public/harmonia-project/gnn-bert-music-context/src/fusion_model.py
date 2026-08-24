"""Task 3: GNN–BERT fusion with concat or cross-attention."""
from __future__ import annotations

import torch
import torch.nn as nn

from .gnn_model import GraphSAGE


class CrossAttentionFusion(nn.Module):
    def __init__(self, g_dim: int, t_dim: int, n_tags: int, n_genre: int = 10):
        super().__init__()
        d = g_dim
        self.wq = nn.Linear(g_dim, d)
        self.wk = nn.Linear(t_dim, d)
        self.wv = nn.Linear(t_dim, d)
        self.tag_head = nn.Linear(g_dim + d, n_tags)
        self.genre_head = nn.Linear(g_dim + d, n_genre)
        self.valence = nn.Linear(g_dim + d, 1)
        self.arousal = nn.Linear(g_dim + d, 1)

    def forward(self, g: torch.Tensor, h_text: torch.Tensor):
        # g: [B, Dg] or [Dg]; h_text: [B, L, Dt] or [L, Dt]
        if g.dim() == 1:
            g = g.unsqueeze(0)
        if h_text.dim() == 2:
            h_text = h_text.unsqueeze(0)
        q = self.wq(g).unsqueeze(1)  # [B, 1, d]
        k = self.wk(h_text)
        v = self.wv(h_text)
        attn = torch.softmax(q @ k.transpose(1, 2) / (k.size(-1) ** 0.5), dim=-1)
        ctx = (attn @ v).squeeze(1)
        z = torch.cat([g, ctx], dim=-1)
        return {
            "z": z,
            "attn": attn.squeeze(1),
            "tag_logits": self.tag_head(z),
            "genre_logits": self.genre_head(z),
            "valence": self.valence(z).squeeze(-1),
            "arousal": self.arousal(z).squeeze(-1),
        }


class ConcatFusion(nn.Module):
    def __init__(self, g_dim: int, t_dim: int, n_tags: int, n_genre: int = 10):
        super().__init__()
        self.tag_head = nn.Linear(g_dim + t_dim, n_tags)
        self.genre_head = nn.Linear(g_dim + t_dim, n_genre)

    def forward(self, g, t_cls):
        if g.dim() == 1:
            g = g.unsqueeze(0)
        if t_cls.dim() == 1:
            t_cls = t_cls.unsqueeze(0)
        z = torch.cat([g, t_cls], dim=-1)
        return {
            "z": z,
            "tag_logits": self.tag_head(z),
            "genre_logits": self.genre_head(z),
        }


class GNNBert(nn.Module):
    def __init__(self, in_dim: int, hidden: int, n_tags: int, n_genre: int, mode: str = "attn"):
        super().__init__()
        self.gnn = GraphSAGE(in_dim, hidden, layers=2, n_out=n_genre)
        self.mode = mode
        if mode == "attn":
            self.fuse = CrossAttentionFusion(hidden, hidden, n_tags, n_genre)
        else:
            self.fuse = ConcatFusion(hidden, hidden, n_tags, n_genre)

    def forward(self, x, edge_index, h_text):
        g = self.gnn.encode(x, edge_index)
        if self.mode == "attn":
            return self.fuse(g, h_text)
        t_cls = h_text.mean(dim=-2) if h_text.dim() >= 2 else h_text
        return self.fuse(g, t_cls)
