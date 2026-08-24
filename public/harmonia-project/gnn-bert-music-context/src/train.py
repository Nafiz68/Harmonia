"""Train Task 1–4 on the synthetic corpus (or a real loader you plug in).

  python -m src.train --task 2 --data synthetic --epochs 12
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import torch
import torch.nn.functional as F

from .bert_encoder import TinyTextEncoder
from .contrastive import DualEncoder, recall_at_k
from .dataset import GENRES, TAGS, load_split
from .fusion_model import GNNBert
from .gnn_model import GraphSAGE


def device_of(name: str) -> torch.device:
    if name == "auto":
        return torch.device("cuda" if torch.cuda.is_available() else "cpu")
    return torch.device(name)


def build_vocab(ds) -> dict[str, int]:
    vocab = {"<unk>": 0}
    for item in ds:
        for tok in item["caption"].lower().split():
            vocab.setdefault(tok, len(vocab))
    return vocab


def run_task1(args, train, val, dev):
    vocab = build_vocab(train)
    model = TinyTextEncoder(vocab, dim=64, n_tags=len(TAGS)).to(dev)
    opt = torch.optim.Adam(model.parameters(), lr=args.lr)
    hist = []
    for epoch in range(1, args.epochs + 1):
        model.train()
        total = 0.0
        for item in train:
            ids = model.tokenize(item["caption"]).unsqueeze(0).to(dev)
            logits, _ = model(ids)
            loss = F.binary_cross_entropy_with_logits(logits.squeeze(0), item["tags"].to(dev))
            opt.zero_grad()
            loss.backward()
            opt.step()
            total += loss.item()
        f1 = _tag_f1(model, val, dev)
        hist.append({"epoch": epoch, "loss": total / max(1, len(train)), "macro_f1": f1})
        print(f"epoch {epoch:02d}  loss {hist[-1]['loss']:.3f}  val F1 {f1:.3f}")
    return hist, model


def _tag_f1(model, ds, dev, thr=0.5) -> float:
    model.eval()
    f1s = []
    with torch.no_grad():
        for item in ds:
            ids = model.tokenize(item["caption"]).unsqueeze(0).to(dev)
            logits, _ = model(ids)
            pred = (logits.squeeze(0).sigmoid() > thr).float().cpu()
            y = item["tags"]
            tp = (pred * y).sum()
            prec = tp / pred.sum().clamp(min=1)
            rec = tp / y.sum().clamp(min=1)
            f1s.append(float((2 * prec * rec / (prec + rec).clamp(min=1e-8))))
    return sum(f1s) / max(1, len(f1s))


def run_task2(args, train, val, dev):
    in_dim = train[0]["graph"]["x"].size(-1)
    model = GraphSAGE(in_dim, hidden=64, layers=2, n_out=len(GENRES)).to(dev)
    opt = torch.optim.Adam(model.parameters(), lr=args.lr)
    hist = []
    for epoch in range(1, args.epochs + 1):
        model.train()
        total = 0.0
        for item in train:
            g = item["graph"]
            logits = model(g["x"].to(dev), g["edge_index"].to(dev))
            loss = F.cross_entropy(logits.unsqueeze(0), item["genre"].unsqueeze(0).to(dev))
            opt.zero_grad()
            loss.backward()
            opt.step()
            total += loss.item()
        acc = _genre_acc(model, val, dev)
        hist.append({"epoch": epoch, "loss": total / max(1, len(train)), "acc": acc})
        print(f"epoch {epoch:02d}  loss {hist[-1]['loss']:.3f}  val acc {acc:.3f}")
    return hist, model


def _genre_acc(model, ds, dev) -> float:
    model.eval()
    ok = 0
    with torch.no_grad():
        for item in ds:
            g = item["graph"]
            pred = model(g["x"].to(dev), g["edge_index"].to(dev)).argmax()
            ok += int(pred.cpu() == item["genre"])
    return ok / max(1, len(ds))


def run_task3(args, train, val, dev):
    vocab = build_vocab(train)
    text = TinyTextEncoder(vocab, dim=64, n_tags=len(TAGS)).to(dev)
    in_dim = train[0]["graph"]["x"].size(-1)
    model = GNNBert(in_dim, hidden=64, n_tags=len(TAGS), n_genre=len(GENRES), mode="attn").to(dev)
    opt = torch.optim.Adam(list(model.parameters()) + list(text.parameters()), lr=args.lr)
    hist = []
    for epoch in range(1, args.epochs + 1):
        model.train()
        text.train()
        total = 0.0
        for item in train:
            g = item["graph"]
            ids = text.tokenize(item["caption"]).unsqueeze(0).to(dev)
            _, h = text(ids)
            out = model(g["x"].to(dev), g["edge_index"].to(dev), h)
            loss = F.binary_cross_entropy_with_logits(
                out["tag_logits"].squeeze(0), item["tags"].to(dev)
            )
            loss = loss + 0.5 * F.cross_entropy(
                out["genre_logits"], item["genre"].unsqueeze(0).to(dev)
            )
            opt.zero_grad()
            loss.backward()
            opt.step()
            total += loss.item()
        hist.append({"epoch": epoch, "loss": total / max(1, len(train))})
        print(f"epoch {epoch:02d}  loss {hist[-1]['loss']:.3f}")
    return hist, (model, text)


def run_task4(args, train, val, dev):
    vocab = build_vocab(train)
    text = TinyTextEncoder(vocab, dim=64, n_tags=len(TAGS)).to(dev)
    in_dim = train[0]["graph"]["x"].size(-1)
    model = DualEncoder(in_dim, hidden=64, text_dim=64).to(dev)
    opt = torch.optim.Adam(list(model.parameters()) + list(text.parameters()), lr=args.lr)
    hist = []
    for epoch in range(1, args.epochs + 1):
        model.train()
        # mini-batch of graphs is awkward with variable N — accumulate embeddings
        gs, ts = [], []
        for item in train:
            g = item["graph"]
            ids = text.tokenize(item["caption"]).unsqueeze(0).to(dev)
            t_logits, h = text(ids)
            t_cls = h.mean(dim=1)
            ge = model.encode_graph(g["x"].to(dev), g["edge_index"].to(dev))
            te = model.encode_text(t_cls.squeeze(0))
            gs.append(ge)
            ts.append(te)
        G = torch.stack(gs)
        T = torch.stack(ts)
        from .contrastive import info_nce

        loss = info_nce(G, T, tau=0.07)
        opt.zero_grad()
        loss.backward()
        opt.step()
        with torch.no_grad():
            rec = recall_at_k(G.detach(), T.detach())
        hist.append({"epoch": epoch, "loss": float(loss), **rec})
        print(f"epoch {epoch:02d}  loss {loss:.3f}  R@1 {rec['R@1']:.2f}  R@5 {rec['R@5']:.2f}")
    return hist, (model, text)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--task", type=int, default=2, choices=[1, 2, 3, 4])
    p.add_argument("--data", default="synthetic")
    p.add_argument("--epochs", type=int, default=8)
    p.add_argument("--lr", type=float, default=2e-4)
    p.add_argument("--device", default="auto")
    args = p.parse_args()
    dev = device_of(args.device)
    train = load_split(args.data, "train")
    val = load_split(args.data, "val")
    print(f"task {args.task}  data {args.data}  n_train {len(train)}  device {dev}")
    runners = {1: run_task1, 2: run_task2, 3: run_task3, 4: run_task4}
    hist, _ = runners[args.task](args, train, val, dev)
    out = Path("results")
    out.mkdir(exist_ok=True)
    (out / "metrics.json").write_text(json.dumps(hist, indent=2))
    print(f"wrote {out / 'metrics.json'}")


if __name__ == "__main__":
    main()
