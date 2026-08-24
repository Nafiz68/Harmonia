import {
  chromaFromChord,
  hash01,
  meanVec,
} from "./theory";

export const GENRES = [
  "Jazz",
  "Rock",
  "Hip-Hop",
  "Classical",
  "Electronic",
  "Folk",
  "Metal",
  "Pop",
  "Blues",
  "Reggae",
] as const;
export type Genre = (typeof GENRES)[number];

export const TAG_VOCAB = [
  "guitar",
  "piano",
  "drums",
  "bass",
  "synth",
  "violin",
  "vocals",
  "female vocal",
  "male vocal",
  "sad",
  "happy",
  "dark",
  "energetic",
  "calm",
  "melancholic",
  "aggressive",
  "fast",
  "slow",
  "acoustic",
  "electronic",
  "distorted",
  "ambient",
  "jazz",
  "rock",
  "classical",
  "hip hop",
  "metal",
  "folk",
  "pop",
  "blues",
  "reggae",
  "choir",
  "strings",
  "brass",
  "beat",
  "harmony",
  "melody",
  "swing",
  "groove",
  "reverb",
] as const;

export type Tag = (typeof TAG_VOCAB)[number];

export type SegmentLabel =
  | "intro"
  | "verse"
  | "chorus"
  | "bridge"
  | "solo"
  | "outro"
  | "theme"
  | "drop"
  | "head";

export interface ChordEvent {
  symbol: string;
  beats: number;
}

export interface Segment {
  id: number;
  label: SegmentLabel;
  start: number;
  end: number;
  chroma: number[];
  mfcc: number[];
  chords: string[];
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  year: number;
  genre: Genre;
  tags: Tag[];
  caption: string;
  lyrics: string;
  valence: number;
  arousal: number;
  bpm: number;
  key: string;
  chords: ChordEvent[];
  segments: Segment[];
}

interface Spec {
  id: string;
  title: string;
  artist: string;
  year: number;
  genre: Genre;
  tags: Tag[];
  caption: string;
  lyrics: string;
  valence: number;
  arousal: number;
  bpm: number;
  key: string;
  progression: { symbol: string; beats: number }[];
  form: { label: SegmentLabel; bars: number }[];
}

function mfccFrom(chroma: number[], spec: Spec, segIdx: number): number[] {
  const energy = spec.arousal / 9;
  const bright = chroma.slice(6).reduce((a, b) => a + b, 0);
  const out: number[] = [];
  for (let i = 0; i < 13; i++) {
    const n = hash01(spec.id, segIdx * 13 + i) * 0.35 - 0.17;
    if (i === 0) out.push(energy * 2 - 1 + n);
    else if (i === 1) out.push(bright * 1.4 - 0.4 + n);
    else out.push((chroma[i % 12] ?? 0) * 0.8 + n);
  }
  return out;
}

function buildSegments(spec: Spec): Segment[] {
  const beatsPerBar = 4;
  let beat = 0;
  let chordIdx = 0;
  const prog = spec.progression;
  const segs: Segment[] = [];
  spec.form.forEach((f, i) => {
    const start = beat;
    const span = f.bars * beatsPerBar;
    const chords: string[] = [];
    let covered = 0;
    while (covered < span && prog.length) {
      const ev = prog[chordIdx % prog.length]!;
      chords.push(ev.symbol);
      covered += ev.beats;
      chordIdx++;
    }
    const chromas = chords.map(chromaFromChord);
    const chroma = meanVec(chromas);
    const end = start + span;
    segs.push({
      id: i,
      label: f.label,
      start,
      end,
      chroma,
      mfcc: mfccFrom(chroma, spec, i),
      chords: [...new Set(chords)],
    });
    beat = end;
  });
  return segs;
}

function make(spec: Spec): Track {
  return {
    ...spec,
    chords: spec.progression,
    segments: buildSegments(spec),
  };
}

const SPECS: Spec[] = [
  {
    id: "midnight-blue",
    title: "Midnight Blue",
    artist: "Ellis Ward Quartet",
    year: 1962,
    genre: "Jazz",
    tags: ["jazz", "piano", "bass", "drums", "swing", "calm", "harmony", "male vocal"],
    caption:
      "A late-night jazz quartet in a small club. Walking bass and brushed drums support a piano melody with warm seventh chords, then a muted trumpet takes a lyrical solo. The mood is intimate, slightly melancholic, and unhurried.",
    lyrics:
      "Streetlights pool on wet stone / a saxophone leans into the dark / tell me the hour, tell me we still have time",
    valence: 4.2,
    arousal: 3.4,
    bpm: 92,
    key: "Bb",
    progression: [
      { symbol: "Cm7", beats: 4 },
      { symbol: "F7", beats: 4 },
      { symbol: "Bbmaj7", beats: 4 },
      { symbol: "Ebmaj7", beats: 4 },
      { symbol: "Am7", beats: 2 },
      { symbol: "D7", beats: 2 },
      { symbol: "Gm7", beats: 4 },
      { symbol: "C7", beats: 4 },
      { symbol: "F7", beats: 4 },
    ],
    form: [
      { label: "intro", bars: 4 },
      { label: "head", bars: 8 },
      { label: "solo", bars: 8 },
      { label: "head", bars: 8 },
      { label: "outro", bars: 4 },
    ],
  },
  {
    id: "iron-circuit",
    title: "Iron Circuit",
    artist: "Ash Voltage",
    year: 2008,
    genre: "Metal",
    tags: ["metal", "guitar", "drums", "distorted", "aggressive", "fast", "energetic", "dark"],
    caption:
      "Palm-muted power-chord riffs in drop tuning, double-kick drums, and a screamed vocal hook. A brief harmonic intro gives way to a relentless verse-chorus engine. Production is dense, mid-scooped, and loud.",
    lyrics:
      "Wires in the marrow / we run the iron circuit / no light, no quarter, only the grid",
    valence: 3.1,
    arousal: 8.4,
    bpm: 168,
    key: "E",
    progression: [
      { symbol: "E5", beats: 4 },
      { symbol: "E5", beats: 4 },
      { symbol: "G5", beats: 2 },
      { symbol: "A5", beats: 2 },
      { symbol: "E5", beats: 4 },
      { symbol: "C5", beats: 2 },
      { symbol: "D5", beats: 2 },
      { symbol: "E5", beats: 4 },
    ],
    form: [
      { label: "intro", bars: 4 },
      { label: "verse", bars: 8 },
      { label: "chorus", bars: 8 },
      { label: "verse", bars: 8 },
      { label: "chorus", bars: 8 },
      { label: "solo", bars: 8 },
      { label: "outro", bars: 4 },
    ],
  },
  {
    id: "harbor-folk",
    title: "Harbor Folk",
    artist: "Mara Quinn",
    year: 1974,
    genre: "Folk",
    tags: ["folk", "acoustic", "guitar", "female vocal", "calm", "melody", "sad", "slow"],
    caption:
      "Fingerpicked acoustic guitar in an open tuning, a close-mic female vocal, and a faint fiddle in the second verse. The lyric is about leaving a coastal town. Dynamics stay quiet; the chorus lifts with a simple three-part harmony.",
    lyrics:
      "Tide takes the names we wrote in sand / I packed the letters, left the key / harbor lights recede",
    valence: 3.6,
    arousal: 2.8,
    bpm: 78,
    key: "G",
    progression: [
      { symbol: "G", beats: 4 },
      { symbol: "Em", beats: 4 },
      { symbol: "C", beats: 4 },
      { symbol: "D", beats: 4 },
      { symbol: "G", beats: 4 },
      { symbol: "C", beats: 2 },
      { symbol: "D", beats: 2 },
    ],
    form: [
      { label: "intro", bars: 4 },
      { label: "verse", bars: 8 },
      { label: "chorus", bars: 8 },
      { label: "verse", bars: 8 },
      { label: "chorus", bars: 8 },
      { label: "outro", bars: 4 },
    ],
  },
  {
    id: "neon-pulse",
    title: "Neon Pulse",
    artist: "Kite District",
    year: 2019,
    genre: "Electronic",
    tags: ["electronic", "synth", "beat", "energetic", "fast", "reverb", "dark", "drums"],
    caption:
      "Four-on-the-floor kick, a detuned analog bass, and staccato synth stabs. A filtered pad blooms into the drop. Vocals are chopped and pitched, more texture than lyric. Club energy with a cold, nocturnal color.",
    lyrics:
      "Pulse on the glass / we count the neon / stay in the loop until morning",
    valence: 5.8,
    arousal: 7.6,
    bpm: 124,
    key: "Am",
    progression: [
      { symbol: "Am", beats: 4 },
      { symbol: "F", beats: 4 },
      { symbol: "C", beats: 4 },
      { symbol: "G", beats: 4 },
    ],
    form: [
      { label: "intro", bars: 8 },
      { label: "verse", bars: 8 },
      { label: "drop", bars: 8 },
      { label: "verse", bars: 8 },
      { label: "drop", bars: 8 },
      { label: "outro", bars: 8 },
    ],
  },
  {
    id: "dust-road",
    title: "Dust Road Blues",
    artist: "Calvin Reed",
    year: 1958,
    genre: "Blues",
    tags: ["blues", "guitar", "male vocal", "slow", "sad", "groove", "harmony"],
    caption:
      "A slow twelve-bar blues in A. Slide guitar answers a weathered male vocal. Upright bass walks; a brushed snare keeps time. The turnaround is classic, the solo is economical, and the room tone is dry and close.",
    lyrics:
      "Dust on the road and a suitcase of rain / I asked the night for a ride / it passed me by",
    valence: 3.2,
    arousal: 3.9,
    bpm: 68,
    key: "A",
    progression: [
      { symbol: "A7", beats: 16 },
      { symbol: "D7", beats: 8 },
      { symbol: "A7", beats: 8 },
      { symbol: "E7", beats: 4 },
      { symbol: "D7", beats: 4 },
      { symbol: "A7", beats: 4 },
      { symbol: "E7", beats: 4 },
    ],
    form: [
      { label: "intro", bars: 4 },
      { label: "verse", bars: 12 },
      { label: "solo", bars: 12 },
      { label: "verse", bars: 12 },
      { label: "outro", bars: 4 },
    ],
  },
  {
    id: "cathedral-air",
    title: "Cathedral Air",
    artist: "Linden Chamber",
    year: 1810,
    genre: "Classical",
    tags: ["classical", "strings", "violin", "choir", "calm", "slow", "harmony", "melody"],
    caption:
      "A string quartet in a resonant hall. The first violin states a long, arching theme over a descending bass. Inner voices weave suspensions. A brief chorale-like middle section, then the theme returns in a higher register.",
    lyrics: "",
    valence: 5.4,
    arousal: 2.6,
    bpm: 62,
    key: "D",
    progression: [
      { symbol: "D", beats: 4 },
      { symbol: "A", beats: 4 },
      { symbol: "Bm", beats: 4 },
      { symbol: "F#m", beats: 4 },
      { symbol: "G", beats: 4 },
      { symbol: "D", beats: 4 },
      { symbol: "G", beats: 4 },
      { symbol: "A", beats: 4 },
    ],
    form: [
      { label: "theme", bars: 8 },
      { label: "bridge", bars: 8 },
      { label: "theme", bars: 8 },
      { label: "outro", bars: 4 },
    ],
  },
  {
    id: "cipher-flow",
    title: "Cipher Flow",
    artist: "N. Kade",
    year: 2016,
    genre: "Hip-Hop",
    tags: ["hip hop", "beat", "bass", "drums", "male vocal", "dark", "groove", "synth"],
    caption:
      "Boom-bap drums over a minor-key sample loop, sub bass, and sparse piano stabs. A dry, close rap vocal with internal rhyme. The hook is chanted, then the beat opens with a vinyl crackle and a chopped vocal chop.",
    lyrics:
      "Cipher in the basement, numbers on the wall / I stack the bars like brick, never let them fall",
    valence: 4.8,
    arousal: 6.2,
    bpm: 90,
    key: "F#m",
    progression: [
      { symbol: "F#m", beats: 4 },
      { symbol: "D", beats: 4 },
      { symbol: "A", beats: 4 },
      { symbol: "E", beats: 4 },
    ],
    form: [
      { label: "intro", bars: 4 },
      { label: "verse", bars: 16 },
      { label: "chorus", bars: 8 },
      { label: "verse", bars: 16 },
      { label: "chorus", bars: 8 },
      { label: "outro", bars: 4 },
    ],
  },
  {
    id: "glass-pop",
    title: "Glass Pop",
    artist: "Lila North",
    year: 2021,
    genre: "Pop",
    tags: ["pop", "female vocal", "synth", "drums", "happy", "energetic", "melody", "guitar"],
    caption:
      "Bright I–V–vi–IV progression, stacked vocal harmonies, and a four-bar pre-chorus lift. Acoustic guitar in the verse, synths and claps in the chorus. Radio-ready, major-key, and hook-forward.",
    lyrics:
      "We drew a map on the window glass / every light a maybe / say you'll stay till the chorus hits",
    valence: 7.8,
    arousal: 6.9,
    bpm: 118,
    key: "C",
    progression: [
      { symbol: "C", beats: 4 },
      { symbol: "G", beats: 4 },
      { symbol: "Am", beats: 4 },
      { symbol: "F", beats: 4 },
    ],
    form: [
      { label: "intro", bars: 4 },
      { label: "verse", bars: 8 },
      { label: "chorus", bars: 8 },
      { label: "verse", bars: 8 },
      { label: "chorus", bars: 8 },
      { label: "bridge", bars: 8 },
      { label: "chorus", bars: 8 },
    ],
  },
  {
    id: "kingston-heat",
    title: "Kingston Heat",
    artist: "Ridge & the Dubs",
    year: 1977,
    genre: "Reggae",
    tags: ["reggae", "guitar", "bass", "drums", "groove", "happy", "male vocal", "brass"],
    caption:
      "Offbeat ska guitar, a round bassline, and a one-drop drum pattern. A small horn section answers the vocal. The lyric is about a Saturday market. Warm tape saturation, spacious dub delay on the snare.",
    lyrics:
      "Sun on the zinc, mango on the stall / we take it slow, we take it all",
    valence: 7.4,
    arousal: 5.5,
    bpm: 76,
    key: "A",
    progression: [
      { symbol: "A", beats: 4 },
      { symbol: "D", beats: 4 },
      { symbol: "A", beats: 4 },
      { symbol: "E", beats: 4 },
    ],
    form: [
      { label: "intro", bars: 4 },
      { label: "verse", bars: 8 },
      { label: "chorus", bars: 8 },
      { label: "verse", bars: 8 },
      { label: "chorus", bars: 8 },
      { label: "outro", bars: 4 },
    ],
  },
  {
    id: "velvet-hour",
    title: "Velvet Hour",
    artist: "Sable Trio",
    year: 1959,
    genre: "Jazz",
    tags: ["jazz", "piano", "bass", "slow", "melancholic", "calm", "harmony", "sad"],
    caption:
      "A ballad trio: piano, bass, brushes. Rubato intro, then a slow 4/4. Extended tertian harmony, lots of 9ths and 13ths. The melody is spare; space is the arrangement. Late-evening, low light.",
    lyrics:
      "Keep the lamp low / the hour is velvet / we speak in sevenths",
    valence: 3.8,
    arousal: 2.1,
    bpm: 58,
    key: "Db",
    progression: [
      { symbol: "Dbmaj7", beats: 4 },
      { symbol: "Bbm7", beats: 4 },
      { symbol: "Eb7", beats: 4 },
      { symbol: "Abmaj7", beats: 4 },
      { symbol: "Fm7", beats: 4 },
      { symbol: "Bb7", beats: 4 },
      { symbol: "Ebm7", beats: 4 },
      { symbol: "Ab7", beats: 4 },
    ],
    form: [
      { label: "intro", bars: 4 },
      { label: "head", bars: 8 },
      { label: "solo", bars: 8 },
      { label: "head", bars: 8 },
      { label: "outro", bars: 4 },
    ],
  },
  {
    id: "static-garden",
    title: "Static Garden",
    artist: "Aera",
    year: 2020,
    genre: "Electronic",
    tags: ["electronic", "ambient", "synth", "reverb", "calm", "slow", "dark", "melancholic"],
    caption:
      "Long evolving pads, granular noise, and a slow pulse more felt than heard. No drums until the last third, and then only a soft heartbeat kick. Field recordings of rain under a distant piano figure.",
    lyrics: "",
    valence: 4.1,
    arousal: 1.8,
    bpm: 52,
    key: "Em",
    progression: [
      { symbol: "Em", beats: 8 },
      { symbol: "C", beats: 8 },
      { symbol: "G", beats: 8 },
      { symbol: "D", beats: 8 },
    ],
    form: [
      { label: "intro", bars: 8 },
      { label: "theme", bars: 8 },
      { label: "bridge", bars: 8 },
      { label: "theme", bars: 8 },
      { label: "outro", bars: 8 },
    ],
  },
  {
    id: "redline",
    title: "Redline",
    artist: "The Quarry",
    year: 1994,
    genre: "Rock",
    tags: ["rock", "guitar", "drums", "male vocal", "energetic", "distorted", "fast", "aggressive"],
    caption:
      "Two overdriven guitars, a driving snare, and a shouted chorus. Verse is dry and tight; chorus opens with crash cymbals and a higher vocal. A short pentatonic solo, then a hard stop.",
    lyrics:
      "Redline the night / we don't coast, we don't wait / burn the map and go",
    valence: 6.2,
    arousal: 8.1,
    bpm: 142,
    key: "A",
    progression: [
      { symbol: "A5", beats: 4 },
      { symbol: "D5", beats: 4 },
      { symbol: "E5", beats: 4 },
      { symbol: "A5", beats: 4 },
      { symbol: "G5", beats: 2 },
      { symbol: "D5", beats: 2 },
    ],
    form: [
      { label: "intro", bars: 4 },
      { label: "verse", bars: 8 },
      { label: "chorus", bars: 8 },
      { label: "verse", bars: 8 },
      { label: "chorus", bars: 8 },
      { label: "solo", bars: 8 },
      { label: "chorus", bars: 8 },
    ],
  },
  {
    id: "paper-lanterns",
    title: "Paper Lanterns",
    artist: "Jonah Hale",
    year: 2011,
    genre: "Folk",
    tags: ["folk", "acoustic", "male vocal", "sad", "melancholic", "slow", "melody", "guitar"],
    caption:
      "A single nylon-string guitar and a hushed male vocal. Minimal production. The lyric is a letter never sent. Harmonics at the end of each phrase, like lanterns going out.",
    lyrics:
      "I folded the year into paper / lit it, watched it lift / you were already gone",
    valence: 2.9,
    arousal: 2.2,
    bpm: 70,
    key: "D",
    progression: [
      { symbol: "D", beats: 4 },
      { symbol: "Bm", beats: 4 },
      { symbol: "G", beats: 4 },
      { symbol: "A", beats: 4 },
    ],
    form: [
      { label: "intro", bars: 4 },
      { label: "verse", bars: 8 },
      { label: "chorus", bars: 8 },
      { label: "verse", bars: 8 },
      { label: "chorus", bars: 8 },
      { label: "outro", bars: 4 },
    ],
  },
  {
    id: "voltage-ii",
    title: "Voltage II",
    artist: "Ash Voltage",
    year: 2010,
    genre: "Metal",
    tags: ["metal", "guitar", "drums", "distorted", "aggressive", "dark", "fast", "energetic"],
    caption:
      "Odd-meter riffs (7/8 verse) collapsing into a 4/4 chorus. Harmonic minor lead lines, blast-beat bridge, then a half-time breakdown. Guitars are tightly gated; the mix is surgical.",
    lyrics:
      "Count the seven, break the four / voltage in the floor",
    valence: 2.8,
    arousal: 8.7,
    bpm: 176,
    key: "B",
    progression: [
      { symbol: "B5", beats: 4 },
      { symbol: "B5", beats: 3 },
      { symbol: "G5", beats: 4 },
      { symbol: "F#5", beats: 4 },
      { symbol: "E5", beats: 4 },
    ],
    form: [
      { label: "intro", bars: 4 },
      { label: "verse", bars: 8 },
      { label: "chorus", bars: 8 },
      { label: "bridge", bars: 8 },
      { label: "chorus", bars: 8 },
      { label: "outro", bars: 4 },
    ],
  },
  {
    id: "soft-grid",
    title: "Soft Grid",
    artist: "room 408",
    year: 2022,
    genre: "Hip-Hop",
    tags: ["hip hop", "beat", "piano", "calm", "slow", "melancholic", "reverb", "bass"],
    caption:
      "Lo-fi hip-hop: dusty piano loop in F minor, vinyl noise, a lazy snare, and a warm sub. No rap — just the instrumental bed. Study-music energy, slightly sad, endlessly loopable.",
    lyrics: "",
    valence: 4.4,
    arousal: 2.9,
    bpm: 82,
    key: "Fm",
    progression: [
      { symbol: "Fm", beats: 4 },
      { symbol: "Dbmaj7", beats: 4 },
      { symbol: "Eb", beats: 4 },
      { symbol: "Cm7", beats: 4 },
    ],
    form: [
      { label: "intro", bars: 4 },
      { label: "theme", bars: 8 },
      { label: "theme", bars: 8 },
      { label: "bridge", bars: 8 },
      { label: "theme", bars: 8 },
    ],
  },
  {
    id: "dawn-string",
    title: "Dawn String",
    artist: "Linden Chamber",
    year: 1802,
    genre: "Classical",
    tags: ["classical", "strings", "violin", "happy", "melody", "harmony", "calm"],
    caption:
      "A bright allegro for string orchestra. Repeated eighth-note accompaniment, a rising first-violin theme, and a playful call-and-response with the violas. Cadences are clean; the mood is morning, not courtly.",
    lyrics: "",
    valence: 7.6,
    arousal: 5.8,
    bpm: 126,
    key: "G",
    progression: [
      { symbol: "G", beats: 4 },
      { symbol: "D", beats: 4 },
      { symbol: "Em", beats: 4 },
      { symbol: "C", beats: 4 },
      { symbol: "G", beats: 4 },
      { symbol: "D", beats: 4 },
    ],
    form: [
      { label: "theme", bars: 8 },
      { label: "bridge", bars: 8 },
      { label: "theme", bars: 8 },
      { label: "outro", bars: 4 },
    ],
  },
  {
    id: "wire-and-rain",
    title: "Wire and Rain",
    artist: "The Quarry",
    year: 1996,
    genre: "Rock",
    tags: ["rock", "guitar", "male vocal", "sad", "melancholic", "drums", "reverb"],
    caption:
      "Mid-tempo rock ballad. Clean arpeggios in the verse, overdrive in the chorus, and a long held vocal on the last line. Rain sample under the intro. Not quiet, but inward.",
    lyrics:
      "Wire and rain on the same roof / I keep the light on for no one",
    valence: 3.4,
    arousal: 4.6,
    bpm: 96,
    key: "Em",
    progression: [
      { symbol: "Em", beats: 4 },
      { symbol: "C", beats: 4 },
      { symbol: "G", beats: 4 },
      { symbol: "D", beats: 4 },
    ],
    form: [
      { label: "intro", bars: 4 },
      { label: "verse", bars: 8 },
      { label: "chorus", bars: 8 },
      { label: "verse", bars: 8 },
      { label: "chorus", bars: 8 },
      { label: "outro", bars: 4 },
    ],
  },
  {
    id: "market-day",
    title: "Market Day",
    artist: "Ridge & the Dubs",
    year: 1979,
    genre: "Reggae",
    tags: ["reggae", "bass", "groove", "happy", "brass", "drums", "guitar"],
    caption:
      "Upbeat reggae with a bubbling bass and a horn riff that never quite resolves. Call-and-response vocals. The mix leaves space on the backbeat. Sunshine, not protest.",
    lyrics:
      "Market day, pockets light / still we dance till the evening writes us down",
    valence: 8.1,
    arousal: 6.0,
    bpm: 88,
    key: "C",
    progression: [
      { symbol: "C", beats: 4 },
      { symbol: "F", beats: 4 },
      { symbol: "C", beats: 4 },
      { symbol: "G", beats: 4 },
    ],
    form: [
      { label: "intro", bars: 4 },
      { label: "verse", bars: 8 },
      { label: "chorus", bars: 8 },
      { label: "verse", bars: 8 },
      { label: "chorus", bars: 8 },
    ],
  },
  {
    id: "crossroads-9",
    title: "Crossroads 9",
    artist: "Calvin Reed",
    year: 1961,
    genre: "Blues",
    tags: ["blues", "guitar", "male vocal", "energetic", "groove", "fast"],
    caption:
      "A faster shuffle blues. Electric guitar with a small amp, harmonica fills, and a shouted vocal. The turnaround is snappy. Bar-room, Saturday night.",
    lyrics:
      "Nine roads out and I took the loud one / harmonica laughing in the back",
    valence: 6.4,
    arousal: 6.8,
    bpm: 118,
    key: "E",
    progression: [
      { symbol: "E7", beats: 16 },
      { symbol: "A7", beats: 8 },
      { symbol: "E7", beats: 8 },
      { symbol: "B7", beats: 4 },
      { symbol: "A7", beats: 4 },
      { symbol: "E7", beats: 4 },
      { symbol: "B7", beats: 4 },
    ],
    form: [
      { label: "intro", bars: 4 },
      { label: "verse", bars: 12 },
      { label: "solo", bars: 12 },
      { label: "verse", bars: 12 },
    ],
  },
  {
    id: "silver-hook",
    title: "Silver Hook",
    artist: "Lila North",
    year: 2023,
    genre: "Pop",
    tags: ["pop", "female vocal", "synth", "happy", "energetic", "beat", "melody"],
    caption:
      "A maximalist pop chorus with sidechained pads and a whistled countermelody. Verse is spoken-sung; pre-chorus climbs. The hook is two words, repeated. Designed to stick.",
    lyrics:
      "Silver hook, I know you / catch me in the daylight too",
    valence: 8.2,
    arousal: 7.4,
    bpm: 110,
    key: "F",
    progression: [
      { symbol: "F", beats: 4 },
      { symbol: "C", beats: 4 },
      { symbol: "Dm", beats: 4 },
      { symbol: "Bb", beats: 4 },
    ],
    form: [
      { label: "intro", bars: 4 },
      { label: "verse", bars: 8 },
      { label: "chorus", bars: 8 },
      { label: "verse", bars: 8 },
      { label: "chorus", bars: 8 },
      { label: "bridge", bars: 8 },
      { label: "chorus", bars: 8 },
    ],
  },
];

export const TRACKS: Track[] = SPECS.map(make);

export const TRACK_BY_ID: Record<string, Track> = Object.fromEntries(
  TRACKS.map((t) => [t.id, t]),
);

export function allTags(): string[] {
  return [...TAG_VOCAB];
}

export function tagIndex(): Record<string, number> {
  const m: Record<string, number> = {};
  TAG_VOCAB.forEach((t, i) => {
    m[t] = i;
  });
  return m;
}

export function multiHot(tags: string[]): number[] {
  const idx = tagIndex();
  const y = new Array(TAG_VOCAB.length).fill(0);
  for (const t of tags) {
    const i = idx[t];
    if (i !== undefined) y[i] = 1;
  }
  return y;
}

export function genreOneHot(g: Genre): number[] {
  return GENRES.map((x) => (x === g ? 1 : 0));
}
