import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Page } from "@/components/app-shell";
import { TrackPicker } from "@/components/track-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TAG_VOCAB, TRACKS, multiHot } from "@/lib/music/tracks";
import { predictTags, tokenize } from "@/lib/music/bert";
import { tagF1 } from "@/lib/music/fusion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lab/bert")({ component: BertPage });

function BertPage() {
  const [track, setTrack] = useState(TRACKS[0]!);
  const [custom, setCustom] = useState("");
  const text = custom.trim() || `${track.caption} ${track.lyrics} ${track.tags.join(" ")}`;
  const result = useMemo(() => predictTags(text, 0.46), [text]);
  const y = multiHot(track.tags);
  const f1 = tagF1(y, result.probs, 0.46);
  const tokens = tokenize(text);

  return (
    <AppShell>
      <Page
        kicker="Task 1 · Easy"
        title="BERT for music tag understanding"
        lede="A contextual encoder maps lyrics, tags, or captions to a CLS vector. A linear head with sigmoid predicts each tag independently. Loss is binary cross-entropy."
      >
        <div className="mb-6 rounded-[24px] border border-border bg-surface p-5">
          <p className="eq text-muted">
            t = BERT<sub>CLS</sub>(X<sub>text</sub>)&nbsp;&nbsp; ŷ<sub>k</sub> = σ(w<sub>k</sub>⊤ t + b<sub>k</sub>)
            <br />
            L<sub>BERT</sub> = −1/K Σ [ y<sub>k</sub> log ŷ<sub>k</sub> + (1−y<sub>k</sub>) log(1−ŷ<sub>k</sub>) ]
          </p>
        </div>

        <TrackPicker value={track} onChange={setTrack} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] border border-border bg-surface p-5">
            <h2 className="font-serif text-2xl">Input text</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">{track.caption}</p>
            {track.lyrics ? (
              <p className="mt-3 font-serif text-[15px] italic text-fg/90">{track.lyrics}</p>
            ) : null}
            <label className="mt-4 block text-[12px] uppercase tracking-[0.14em] text-muted">
              Try your own caption
            </label>
            <textarea
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              rows={3}
              placeholder="A quiet piano ballad with brushed drums…"
              className="mt-2 w-full rounded-2xl border border-border bg-bg px-3 py-2 text-sm outline-none ring-ring/60 focus:ring-2"
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tokens.slice(0, 24).map((tok, i) => {
                const w = result.encoding.attn[i] ?? 0;
                return (
                  <span
                    key={tok + i}
                    className="rounded-md px-1.5 py-0.5 font-mono text-[11px]"
                    style={{
                      backgroundColor: `rgba(212,216,224,${(0.08 + w * 1.6).toFixed(3)})`,
                    }}
                  >
                    {tok}
                  </span>
                );
              })}
            </div>
            <p className="mt-2 text-[12px] text-muted">
              Highlight weight is CLS attention over tokens — the same readout BERT uses.
            </p>
          </div>

          <div className="rounded-[24px] border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl">Predicted tags</h2>
              <Badge variant="signal">F1 {f1.f1.toFixed(2)}</Badge>
            </div>
            <p className="mt-1 text-[12px] text-muted">
              Gold tags for this track vs. the live head. Threshold 0.46.
            </p>
            <ul className="mt-4 max-h-[360px] space-y-1 overflow-auto pr-1">
              {TAG_VOCAB.map((tag, i) => {
                const p = result.probs[i]!;
                const gold = track.tags.includes(tag);
                return (
                  <li key={tag} className="flex items-center gap-2 text-[12px]">
                    <span className={cn("w-28 truncate", gold ? "text-fg" : "text-muted")}>
                      {tag}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${Math.round(p * 100)}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono tabular-nums text-muted">
                      {p.toFixed(2)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => setCustom("")}
            >
              Reset to track caption
            </Button>
          </div>
        </div>
      </Page>
    </AppShell>
  );
}
