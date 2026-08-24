import { adjacency, type MusicGraph } from "./graphs";
import { concat, matVec, meanPool, pad, relu, seededMatrix } from "./nn";
import { l2normalize } from "./theory";

const HIDDEN = 32;
const FEATURE_DIM = 25; // 12 chroma + 13 mfcc (chords pad mfcc with zeros)

export interface SageState {
  layers: number[][][];
}

export function initSage(seed = "harmonia-sage"): SageState {
  // Two GraphSAGE layers: concat(self, mean-neigh) → hidden
  return {
    layers: [
      seededMatrix(HIDDEN, FEATURE_DIM * 2, seed + "-l0"),
      seededMatrix(HIDDEN, HIDDEN * 2, seed + "-l1"),
    ],
  };
}

function layer(
  X: number[][],
  adj: number[][],
  W: number[][],
): number[][] {
  return X.map((xi, i) => {
    const neigh = adj[i] ?? [];
    const msgs = neigh.length ? neigh.map((j) => X[j]!) : [xi];
    const mean = meanPool(msgs);
    const h = relu(matVec(W, concat(xi, mean)));
    return h;
  });
}

export function encodeGraph(
  graph: MusicGraph,
  sage: SageState = initSage(),
): { nodeStates: number[][][]; readout: number[] } {
  const adj = adjacency(graph);
  let X = graph.nodes.map((n) => pad(n.features, FEATURE_DIM));
  const nodeStates: number[][][] = [X];
  for (const W of sage.layers) {
    X = layer(X, adj, W);
    nodeStates.push(X);
  }
  const readout = l2normalize(meanPool(X));
  return { nodeStates, readout };
}

export function graphEmbedding(graph: MusicGraph): number[] {
  return encodeGraph(graph).readout;
}
