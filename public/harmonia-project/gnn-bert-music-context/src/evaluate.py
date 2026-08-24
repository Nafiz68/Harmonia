"""Compute Macro-F1 / accuracy / R@K from a saved metrics.json or a live split."""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--metrics", default="results/metrics.json")
    args = p.parse_args()
    path = Path(args.metrics)
    if not path.exists():
        raise SystemExit(f"missing {path} — train first")
    hist = json.loads(path.read_text())
    last = hist[-1]
    print("last epoch")
    for k, v in last.items():
        if isinstance(v, float):
            print(f"  {k:12s} {v:.4f}")
        else:
            print(f"  {k:12s} {v}")


if __name__ == "__main__":
    main()
