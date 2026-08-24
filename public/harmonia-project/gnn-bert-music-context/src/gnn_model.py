"""GraphSAGE in pure PyTorch (no PyG required).

h_i^{l+1} = ReLU( W^l · CONCAT(h_i^l, MEAN_{j in N(i)} h_j^l) )
g = mean_i h_i^L
"""
from __future__ import annotations

import torch
import torch.nn as nn
import torch.nn.functional as F


def scatter_mean(src: torch.Tensor, index: torch.Tensor, n: int) -> torch.Tensor:
    out = src.new_zeros(n, src.size(-1))
    out.index_add_(0, index, src)
    deg = src.new_zeros(n, 1)
    deg.index_add_(0, index, torch.ones(src.size(0), 1, device=src.device))
    return out / deg.clamp(min=1.0)


class SAGELayer(nn.Module):
    def __init__(self, in_dim: int, out_dim: int):
        super().__init__()
        self.lin = nn.Linear(in_dim * 2, out_dim)

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        src, dst = edge_index
        agg = scatter_mean(x[src], dst, x.size(0))
        return F.relu(self.lin(torch.cat([x, agg], dim=-1)))


class GraphSAGE(nn.Module):
    def __init__(self, in_dim: int, hidden: int = 64, layers: int = 2, n_out: int = 10):
        super().__init__()
        dims = [in_dim] + [hidden] * layers
        self.sages = nn.ModuleList(
            SAGELayer(dims[i], dims[i + 1]) for i in range(layers)
        )
        self.head = nn.Linear(hidden, n_out)

    def encode(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        h = x
        for layer in self.sages:
            h = layer(h, edge_index)
        return h.mean(dim=0)

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        g = self.encode(x, edge_index)
        return self.head(g)


class MelCNN(nn.Module):
    """B2 baseline: small CNN on a log-mel image (1, n_mels, T)."""

    def __init__(self, n_out: int = 10):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(1, 16, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(16, 32, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((1, 1)),
        )
        self.head = nn.Linear(64, n_out)

    def forward(self, spec: torch.Tensor) -> torch.Tensor:
        h = self.net(spec).flatten(1)
        return self.head(h)
