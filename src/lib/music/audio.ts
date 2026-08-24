import { chordFrequencies } from "./theory";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  return ctx;
}

export async function resumeAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") await c.resume();
}

export function playChord(symbol: string, duration = 0.9) {
  const c = getCtx();
  if (!c) return;
  void resumeAudio();
  const now = c.currentTime;
  const freqs = chordFrequencies(symbol, 3);
  const master = c.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.18, now + 0.03);
  master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  master.connect(c.destination);
  freqs.forEach((f, i) => {
    const osc = c.createOscillator();
    osc.type = i === 0 ? "sine" : "triangle";
    osc.frequency.value = f;
    const g = c.createGain();
    g.gain.value = i === 0 ? 0.7 : 0.35;
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  });
}

export function playProgression(
  chords: { symbol: string; beats: number }[],
  bpm: number,
  onStep?: (i: number) => void,
): () => void {
  const c = getCtx();
  if (!c) return () => {};
  void resumeAudio();
  let stopped = false;
  const beat = 60 / bpm;
  let t = 0;
  const timers: number[] = [];
  chords.forEach((ch, i) => {
    const delay = t * 1000;
    const dur = ch.beats * beat;
    timers.push(
      window.setTimeout(() => {
        if (stopped) return;
        onStep?.(i);
        playChord(ch.symbol, Math.min(dur * 0.92, 1.4));
      }, delay),
    );
    t += dur;
  });
  return () => {
    stopped = true;
    timers.forEach(clearTimeout);
  };
}
