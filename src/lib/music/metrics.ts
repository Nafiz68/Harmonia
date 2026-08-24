/** Illustrative full-corpus targets from the assignment table, plus live toy metrics. */

export const TARGET_RESULTS = [
  { model: "Random tags", macroF1: 0.05, aucPr: 0.12, mae: null, r5: 0.02 },
  { model: "CNN mel-spec", macroF1: 0.41, aucPr: 0.38, mae: 1.25, r5: null },
  { model: "Task 1 · BERT-only", macroF1: 0.48, aucPr: 0.44, mae: null, r5: null },
  { model: "Task 2 · GNN-only", macroF1: 0.52, aucPr: 0.47, mae: 1.1, r5: null },
  { model: "Task 3 · GNN–BERT", macroF1: 0.61, aucPr: 0.55, mae: 0.92, r5: null },
  { model: "Task 4 · Contrastive", macroF1: 0.55, aucPr: 0.5, mae: null, r5: 0.38 },
] as const;

export const ABLATIONS = [
  { name: "BERT-only", f1: 0.48, note: "CLS + linear head on captions/tags" },
  { name: "GNN-only", f1: 0.52, note: "GraphSAGE mean readout, no text" },
  { name: "Early concat", f1: 0.57, note: "z = [g ; t_CLS]" },
  { name: "Cross-attention", f1: 0.61, note: "Q from graph, K/V from token states" },
];

export const F1_CURVE = [
  { epoch: 1, bert: 0.18, gnn: 0.22, fusion: 0.24 },
  { epoch: 2, bert: 0.29, gnn: 0.31, fusion: 0.34 },
  { epoch: 3, bert: 0.36, gnn: 0.39, fusion: 0.43 },
  { epoch: 4, bert: 0.41, gnn: 0.44, fusion: 0.5 },
  { epoch: 5, bert: 0.44, gnn: 0.48, fusion: 0.55 },
  { epoch: 6, bert: 0.46, gnn: 0.5, fusion: 0.58 },
  { epoch: 7, bert: 0.47, gnn: 0.51, fusion: 0.6 },
  { epoch: 8, bert: 0.48, gnn: 0.52, fusion: 0.61 },
];
