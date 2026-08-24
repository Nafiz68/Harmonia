"""Task 4: InfoNCE dual encoder (graph ↔ caption)."""
from __future__ import annotations

import torch
import torch.nn as nn
import torch.nn.functional as F

from .gnn_model import GraphSAGE


def info_nce(g: torch.Tensor, t: torch.Tensor, tau: float = 0.07) -> torch.Tensor:
    g = F.normalize(g, dim=-1)
    t = F.normalize(t, dim=-1)
    logits = g @ t.T / tau
    labels = torch.arange(g.size(0), device=g.device)
    return F.cross_entropy(logits, labels)


class DualEncoder(nn.Module):
    def __init__(self, in_dim: int, hidden: int = 64, text_dim: int = 64):
        super().__init__()
        self.gnn = GraphSAGE(in_dim, hidden, layers=2, n_out=hidden)
        self.proj_g = nn.Linear(hidden, hidden)
        self.proj_t = nn.Linear(text_dim, hidden)

    def encode_graph(self, x, edge_index):
        g = self.gnn.encode(x, edge_index)
        return F.normalize(self.proj_g(g), dim=-1)

    def encode_text(self, t_cls):
        return F.normalize(self.proj_t(t_cls), dim=-1)

    def forward(self, x, edge_index, t_cls, tau: float = 0.07):
        g = self.encode_graph(x, edge_index)
        if g.dim() == 1:
            g = g.unsqueeze(0)
        t = self.encode_text(t_cls)
        if t.dim() == 1:
            t = t.unsqueeze(0)
        return info_nce(g, t, tau)


@torch.no_grad()
def recall_at_k(g: torch.Tensor, t: torch.Tensor, ks=(1, 5, 10)) -> dict:
    g = F.normalize(g, dim=-1)
    t = F.normalize(t, dim=-1)
    sim = t @ g.T  # caption → audio
    n = sim.size(0)
    ranks = sim.argsort(dim=-1, descending=True)
    target = torch.arange(n, device=sim.device).unsqueeze(1)
    match = ranks == target
    out = {}
    for k in ks:
        out[f"R@{k}"] = match[:, :k].any(dim=1).float().mean().item()
    return out
