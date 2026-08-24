import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Page } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/guide")({ component: GuidePage });

function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-border bg-surface p-6 sm:p-8">
      <p className="font-mono text-[12px] text-muted">{n}</p>
      <h2 className="mt-1 font-serif text-2xl sm:text-3xl">{title}</h2>
      <div className="mt-4 space-y-3 text-[14.5px] leading-relaxed text-muted [&_a]:text-fg [&_a]:underline-offset-4 hover:[&_a]:underline [&_code]:rounded-md [&_code]:bg-bg [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12.5px] [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-bg [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[12px] [&_pre]:leading-relaxed [&_strong]:text-fg">
        {children}
      </div>
    </section>
  );
}

function GuidePage() {
  return (
    <AppShell>
      <Page
        kicker="VS Code walkthrough"
        title="Build the full project, in order"
        lede="This is the assignment, sequenced so you never stall on data or PyG installs. The lab pages already run the same math on a toy corpus — use them to check your intuition while you train."
      >
        <div className="mb-8 flex flex-wrap gap-2">
          <Badge>Python 3.10+</Badge>
          <Badge>PyTorch</Badge>
          <Badge>CPU OK for toy / GTZAN</Badge>
          <Badge>GPU for FMA-medium</Badge>
        </div>

        <div className="space-y-4">
          <Step n="01" title="Create the repo in VS Code">
            <p>
              Open VS Code → New Folder named <code>gnn-bert-music-context</code>.
              Copy the tree from the <Link to="/code">Code</Link> page (or download the zip). You want:
            </p>
            <pre>{`gnn-bert-music-context/
  README.md
  requirements.txt
  config.yaml
  src/
    audio_features.py
    graph_builder.py
    bert_encoder.py
    gnn_model.py
    fusion_model.py
    contrastive.py
    dataset.py
    train.py
    evaluate.py
  notebooks/demo_context.py
  data/raw  data/processed  data/splits
  results/`}</pre>
            <p>
              Recommended extensions: Python, Pylance, Jupyter. Create a venv:
            </p>
            <pre>{`python -m venv .venv
# Windows: .venv\\Scripts\\activate
source .venv/bin/activate
pip install -U pip
pip install -r requirements.txt`}</pre>
            <p>
              PyTorch Geometric is optional. The starter GNN is pure PyTorch
              (<code>index_add_</code> scatter) so Windows/CPU installs do not die on
              <code>torch-scatter</code>. Add PyG later if you want the official GraphSAGE.
            </p>
          </Step>

          <Step n="02" title="Pick a dataset pairing and download it">
            <p>
              You must use ≥1 audio set and ≥1 text/tag source. Full catalogue:{" "}
              <Link to="/datasets">Datasets</Link>.
            </p>
            <p>
              <strong>If you have one evening:</strong> GTZAN (genre) + the captions already
              in this lab as a tag/text proxy. Train Task 1 and Task 2 end-to-end.
            </p>
            <p>
              <strong>If you have a weekend and ~8 GB:</strong> FMA-small + metadata tags.
              This is the intended medium path.
            </p>
            <pre>{`# FMA-small
mkdir -p data/raw && cd data/raw
curl -O https://os.unil.cloud.switch.ch/fma/fma_metadata.zip
curl -O https://os.unil.cloud.switch.ch/fma/fma_small.zip
unzip fma_metadata.zip && unzip fma_small.zip`}</pre>
            <p>
              <strong>MagnaTagATune</strong> (Task 1 top-50 tags):{" "}
              <a href="https://mirg.city.ac.uk/codeapps/the-magnatagatune-dataset" target="_blank" rel="noreferrer">
                mirg.city.ac.uk — MagnaTagATune
              </a>
              .
            </p>
            <p>
              <strong>MusicCaps</strong> (Task 4):{" "}
              <a href="https://www.kaggle.com/datasets/googleai/musiccaps" target="_blank" rel="noreferrer">
                Kaggle googleai/musiccaps
              </a>
              . Audio is YouTube — some IDs 404. Cache aggressively.
            </p>
            <p>
              <strong>DEAM</strong> (emotion L_aux):{" "}
              <a href="https://cvml.unige.ch/databases/DEAM/" target="_blank" rel="noreferrer">
                cvml.unige.ch/databases/DEAM
              </a>
              .
            </p>
            <p>
              No artist leakage: if a split file exists, use it. Otherwise split by
              <code>artist_id</code>, not by track.
            </p>
          </Step>

          <Step n="03" title="Run the synthetic path the same day">
            <p>
              Do not wait on a 7 GB download to write code. The starter
              <code>src/dataset.py</code> can emit a toy corpus (the same 20 tracks this lab
              uses) with chroma, graphs, captions, and tags:
            </p>
            <pre>{`python -m src.train --task 1 --data synthetic --epochs 8
python -m src.train --task 2 --data synthetic --epochs 12
python -m src.train --task 3 --data synthetic --epochs 12
python -m src.train --task 4 --data synthetic --epochs 20`}</pre>
            <p>
              You should see Macro-F1 curves and a <code>results/metrics.json</code>.
              That proves the plumbing before real audio ever touches disk.
            </p>
          </Step>

          <Step n="04" title="Task 1 — BERT tags">
            <p>
              HuggingFace <code>distilbert-base-uncased</code> (faster than bert-base, same
              recipe). Freeze the encoder for the first epoch, then unfreeze the last 2
              layers. Max length 128. BCE with logits. Report Macro-F1 and Micro-F1 vs epoch.
            </p>
            <pre>{`# MagnaTagATune top-50, or MusicCaps caption → tag proxy
python -m src.train --task 1 --data mtat --model distilbert --epochs 4 --lr 2e-5`}</pre>
            <p>
              Deliverables: training script, F1 curves, five example predictions.
              Optional: attention on the caption (the Task 1 lab page shows the pattern).
            </p>
          </Step>

          <Step n="05" title="Task 2 — graphs + GNN vs CNN">
            <p>For each track:</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Resample to 22,050 Hz. Extract chroma (12) and log-mel (128) with librosa.</li>
              <li>Segment: 5 s hops or beat-synchronous frames.</li>
              <li>
                Chord graph: unique chords as nodes, observed transitions as weighted edges.
              </li>
              <li>
                {"Segment graph: temporal edges + cosine(MFCC/chroma) > τ (start with τ = 0.7)."}
              </li>
              <li>GraphSAGE, 2 layers, hidden 64, mean pool, BCE or CE.</li>
            </ol>
            <p>
              CNN baseline: 3-layer conv on log-mel, same splits, same seed. If GNN does not
              beat CNN, check graph connectivity (isolated nodes) and feature normalization.
            </p>
            <p>
              Play with the live graph on <Link to="/lab/gnn">Task 2</Link> — if a progression
              is a single self-loop, your builder is wrong.
            </p>
          </Step>

          <Step n="06" title="Task 3 — fusion and ablations">
            <p>Four models, one table:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>BERT-only (Task 1)</li>
              <li>GNN-only (Task 2)</li>
              <li>Early concat [g ; t_CLS]</li>
              <li>Cross-attention (Q from g, K/V from token hidden states)</li>
            </ul>
            <p>
              If you have DEAM, add α‖v−v̂‖² + β‖a−â‖². Start with α = β = 0.2.
              Plot t-SNE of z colored by genre and by a mood tag. Write three case studies:
              a graph path (e.g. ii–V–I) aligned with a caption span the attention head
              actually used.
            </p>
          </Step>

          <Step n="07" title="Task 4 — contrastive (bonus / advanced)">
            <p>
              Dual encoder, L2-normalized g and t, temperature τ ≈ 0.07, batch 32–64.
              Metrics: caption→audio and audio→caption R@1/5/10 on a held-out MusicCaps
              split. Ten qualitative examples: query caption, top-3 clips.
            </p>
            <p>
              The <Link to="/lab/retrieval">retrieval lab</Link> is the same protocol on the
              toy corpus — use it to debug ranking before you wait on YouTube downloads.
            </p>
          </Step>

          <Step n="08" title="Baselines, metrics, report">
            <p>You must beat at least two of: random/majority tags, CNN mel-spec, BERT-only.</p>
            <p>
              Report Macro-F1, Micro-F1, mean AUC-PR. Emotion: MAE and R². Retrieval: R@K.
              Keep an identical train/val/test split across every model.
            </p>
            <p>
              Report: 6–10 pages, NeurIPS / IEEE / ICML template. Structure: motivation,
              data, graphs, models, experiments, ablations, failure cases, conclusion.
              Deadline on the brief: 2 October 2026.
            </p>
            <p>
              Also ship: ≥20 example graphs (<code>.pt</code> or JSON),{" "}
              <code>results/metrics.json</code>, and <code>notebooks/demo_context.py</code>{" "}
              with one end-to-end inference.
            </p>
          </Step>

          <Step n="09" title="What usually breaks">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>PyG install.</strong> Skip it until the pure-PyTorch GNN trains.
              </li>
              <li>
                <strong>librosa + numba on Windows.</strong> Pin <code>numba</code> and
                <code>llvmlite</code> to versions in <code>requirements.txt</code>.
              </li>
              <li>
                <strong>Empty graphs.</strong> If chord estimation fails, fall back to
                beat-synchronous chroma k-means (k = 8) as “pseudo-chords”.
              </li>
              <li>
                <strong>BERT OOM.</strong> DistilBERT, max length 128, batch 8, gradient
                checkpointing. Freeze most layers.
              </li>
              <li>
                <strong>Artist leakage on GTZAN.</strong> Mention it in the report; still
                fine as the easy baseline.
              </li>
              <li>
                <strong>MusicCaps missing audio.</strong> Drop those IDs; do not leak test
                captions into train by “filling in” from tags.
              </li>
            </ul>
          </Step>
        </div>
      </Page>
    </AppShell>
  );
}
