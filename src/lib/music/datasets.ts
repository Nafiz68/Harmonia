export interface DatasetInfo {
  id: string;
  name: string;
  size: string;
  clips: string;
  labels: string;
  tasks: string;
  pairing: string;
  download: string;
  notes: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Advanced";
}

export const DATASETS: DatasetInfo[] = [
  {
    id: "gtzan",
    name: "GTZAN",
    size: "~1.2 GB",
    clips: "1,000 × 30 s",
    labels: "10 genres",
    tasks: "1–2  ·  easy baseline",
    pairing: "Start here for Task 2 (GNN vs CNN)",
    download: "https://www.kaggle.com/datasets/andradaolteanu/gtzan-dataset-music-genre-classification",
    notes: "Classic 10-genre set. Artist leakage is a known issue — still the fastest way to stand up a GNN vs CNN comparison.",
    difficulty: "Easy",
  },
  {
    id: "fma-small",
    name: "FMA-small",
    size: "7.2 GB audio + metadata",
    clips: "8,000 × 30 s",
    labels: "8 balanced genres, tags, artist/album",
    tasks: "1–3",
    pairing: "Recommended medium path: FMA-small + chord/segment graphs",
    download: "https://github.com/mdeff/fma",
    notes: "curl https://os.unil.cloud.switch.ch/fma/fma_small.zip and fma_metadata.zip. Official splits in the repo. Avoid artist leakage.",
    difficulty: "Medium",
  },
  {
    id: "fma-medium",
    name: "FMA-medium",
    size: "~22 GB",
    clips: "25,000 tracks",
    labels: "16 genres + tags",
    tasks: "1–3  ·  assignment hard track",
    pairing: "Task 3 fusion: FMA-medium audio graphs + tag text",
    download: "https://os.unil.cloud.switch.ch/fma/fma_medium.zip",
    notes: "Use if you have disk and a GPU. Metadata is shared with fma_metadata.zip.",
    difficulty: "Hard",
  },
  {
    id: "mtat",
    name: "MagnaTagATune",
    size: "~8 GB (mp3 clips)",
    clips: "25,877",
    labels: "188 multi-label tags (genre, mood, instrument)",
    tasks: "1, 3",
    pairing: "Task 1 BERT top-50 tags; Task 3 fusion",
    download: "https://mirg.city.ac.uk/codeapps/the-magnatagatune-dataset",
    notes: "The assignment's primary multi-label tag set. Use the official top-50 subset for comparable F1.",
    difficulty: "Medium",
  },
  {
    id: "musiccaps",
    name: "MusicCaps",
    size: "Captions small; audio via AudioSet / YouTube",
    clips: "5,521 expert captions",
    labels: "Natural-language descriptions",
    tasks: "1, 4",
    pairing: "Advanced: captions (BERT) aligned with 10 s audio graphs",
    download: "https://www.kaggle.com/datasets/googleai/musiccaps",
    notes: "Google research captions. Audio is YouTube-sourced — some clips go missing. Cache what you can.",
    difficulty: "Advanced",
  },
  {
    id: "deam",
    name: "DEAM",
    size: "~3 GB",
    clips: "1,802 excerpts",
    labels: "Continuous valence & arousal (1–9) every 0.5 s",
    tasks: "3–4  ·  auxiliary L_aux",
    pairing: "Emotion extension on top of Task 3",
    download: "https://cvml.unige.ch/databases/DEAM/",
    notes: "Use the standard train/val partition. Average 0.5 s annotations to a clip-level (v, a) for the regression head.",
    difficulty: "Hard",
  },
  {
    id: "emomusic",
    name: "EmoMusic",
    size: "Small",
    clips: "1,000",
    labels: "Quadrant emotion (happy/sad × calm/energetic)",
    tasks: "3",
    pairing: "Lighter emotion labels if DEAM is too heavy",
    download: "https://cvml.unige.ch/databases/emoMusic/",
    notes: "Good for a classification-style emotion head instead of regression.",
    difficulty: "Medium",
  },
  {
    id: "lmd",
    name: "Lakh MIDI Clean",
    size: "MIDI (not audio)",
    clips: "Tens of thousands of MIDI files",
    labels: "Symbolic chords / melody",
    tasks: "2–3  ·  graph construction",
    pairing: "Build chord-transition graphs without audio chord estimation",
    download: "https://colinraffel.com/projects/lmd/",
    notes: "Use pretty_midi to extract chords and melody graphs. Align to audio datasets by title when possible.",
    difficulty: "Medium",
  },
];

export const PAIRINGS = [
  {
    title: "Easy path",
    body: "GTZAN audio + genre labels. Task 1 on tag-like genre words, Task 2 GNN vs a small CNN. Finish a clean report.",
  },
  {
    title: "Recommended (medium / hard)",
    body: "FMA-small or FMA-medium + MagnaTagATune-style tags. Chord/segment graphs from chroma. This is the pairing the brief asks for.",
  },
  {
    title: "Advanced",
    body: "MusicCaps captions aligned to 10 s audio graphs, plus DEAM valence/arousal as L_aux. Task 4 contrastive retrieval on top.",
  },
];
