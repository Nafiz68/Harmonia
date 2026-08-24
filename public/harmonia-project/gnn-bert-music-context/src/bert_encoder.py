"""Task 1: DistilBERT (or BERT) multi-label tag classifier."""
from __future__ import annotations

import torch
import torch.nn as nn

try:
    from transformers import AutoModel, AutoTokenizer
except ImportError:  # synthetic path can use a bag-of-words stand-in
    AutoModel = AutoTokenizer = None


class BertTagger(nn.Module):
    def __init__(self, n_tags: int, name: str = "distilbert-base-uncased", freeze: bool = True):
        super().__init__()
        if AutoModel is None:
            raise RuntimeError("pip install transformers")
        self.encoder = AutoModel.from_pretrained(name)
        hidden = self.encoder.config.hidden_size
        self.head = nn.Linear(hidden, n_tags)
        if freeze:
            for p in self.encoder.parameters():
                p.requires_grad = False

    def forward(self, input_ids, attention_mask):
        out = self.encoder(input_ids=input_ids, attention_mask=attention_mask)
        cls = out.last_hidden_state[:, 0]
        return self.head(cls), out.last_hidden_state


def make_tokenizer(name: str = "distilbert-base-uncased"):
    if AutoTokenizer is None:
        raise RuntimeError("pip install transformers")
    return AutoTokenizer.from_pretrained(name)


class TinyTextEncoder(nn.Module):
    """CPU-friendly stand-in used by --data synthetic so Task 1 runs without transformers."""

    def __init__(self, vocab: dict[str, int], dim: int = 64, n_tags: int = 40):
        super().__init__()
        self.vocab = vocab
        self.emb = nn.Embedding(len(vocab) + 1, dim, padding_idx=0)
        self.head = nn.Linear(dim, n_tags)

    def tokenize(self, text: str, max_len: int = 48) -> torch.Tensor:
        ids = [self.vocab.get(t, 0) for t in text.lower().split()[:max_len]]
        ids += [0] * (max_len - len(ids))
        return torch.tensor(ids, dtype=torch.long)

    def forward(self, input_ids, attention_mask=None):
        h = self.emb(input_ids)
        cls = h.mean(dim=1)
        return self.head(cls), h
