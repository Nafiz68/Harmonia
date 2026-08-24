# GNN–BERT for Understanding Context from Music

CSE425 / EEE474 / CSE715 · supervised neural network project.

This repo implements the four-task roadmap:

1. **BERT** multi-label tag classifier
2. **GraphSAGE** on chord / segment graphs (+ CNN mel baseline)
3. **GNN–BERT fusion** (concat and cross-attention)
4. **InfoNCE** dual encoder for caption ↔ audio retrieval

The GNN is **pure PyTorch** (`index_add_` scatter). You do not need PyTorch Geometric to get a working graph model.

## Quick start (no 8 GB download)

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -U pip
pip install torch numpy scikit-learn pyyaml tqdm pandas
# optional, for real audio later:
# pip install librosa soundfile transformers

python -m src.train --task 2 --data synthetic --epochs 12
python -m src.evaluate
python notebooks/demo_context.py
```

Synthetic data is a 20-track toy corpus with real chord progressions, MagnaTagATune-style tags, MusicCaps-style captions, and valence/arousal. Use it to debug the pipeline, then swap `--data` once FMA / GTZAN is on disk.

## Datasets

| Pairing | Audio | Text | Tasks |
|---|---|---|---|
| Easy | [GTZAN](https://www.kaggle.com/datasets/andradaolteanu/gtzan-dataset-music-genre-classification) | genre words as tags | 1–2 |
| Medium | [FMA-small](https://github.com/mdeff/fma) (7.2 GB) | FMA tags | 1–3 |
| Hard | FMA-medium + [MagnaTagATune](https://mirg.city.ac.uk/codeapps/the-magnatagatune-dataset) | 188 tags | 3 |
| Advanced | 10 s clips + [MusicCaps](https://www.kaggle.com/datasets/googleai/musiccaps) | captions | 4 |
| Emotion | [DEAM](https://cvml.unige.ch/databases/DEAM/) | valence / arousal | 3 aux |

FMA:

```bash
mkdir -p data/raw && cd data/raw
curl -O https://os.unil.cloud.switch.ch/fma/fma_metadata.zip
curl -O https://os.unil.cloud.switch.ch/fma/fma_small.zip
unzip fma_metadata.zip && unzip fma_small.zip
```

Use official splits. Do not leak artists across train/test.

## Project layout

```
src/audio_features.py   # mel, chroma, windows
src/graph_builder.py    # chord + segment graphs
src/bert_encoder.py     # DistilBERT + tiny stand-in
src/gnn_model.py        # GraphSAGE + MelCNN
src/fusion_model.py     # concat / cross-attention
src/contrastive.py      # InfoNCE, R@K
src/dataset.py          # synthetic + loader hook
src/train.py
src/evaluate.py
```

## Wiring a real dataset

Implement `load_split(name, split)` in `src/dataset.py` so each item has:

- `graph`: `{x, edge_index, n}` from `segment_graph`
- `caption` / tags / genre tensors
- optional `valence`, `arousal`

Keep the rest of `train.py` unchanged.

## Report

6–10 pages, NeurIPS / IEEE / ICML template. Include Macro-F1, AUC-PR, ablations (BERT / GNN / concat / attention), t-SNE of `z`, and three case studies. Ship ≥20 example graphs and this demo script.

Deadline: 2 October 2026.
