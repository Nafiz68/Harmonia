import { createFileRoute } from "@tanstack/react-router";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { AppShell, Page } from "@/components/app-shell";
import { TARGET_RESULTS, F1_CURVE, ABLATIONS } from "@/lib/music/metrics";
import { TRACKS } from "@/lib/music/tracks";
import { fuseTrack, evaluateFusion } from "@/lib/music/fusion";
import { retrievalTable } from "@/lib/music/contrastive";
import { GENRES } from "@/lib/music/tracks";

export const Route = createFileRoute("/results")({ component: ResultsPage });

const GENRE_COLOR: Record<string, string> = {
  Jazz: "#d4d8e0",
  Rock: "#8aa0ae",
  "Hip-Hop": "#b8c4c8",
  Classical: "#e8e4dc",
  Electronic: "#7a8a96",
  Folk: "#c4b8a8",
  Metal: "#9aa4ae",
  Pop: "#dcd6cc",
  Blues: "#a89888",
  Reggae: "#bcc4bc",
};

function ResultsPage() {
  const live = evaluateFusion(TRACKS);
  const ret = retrievalTable();
  const points = TRACKS.map((t) => {
    const f = fuseTrack(t);
    return {
      x: Math.round(f.z[0]! * 40 + t.valence * 4),
      y: Math.round(f.z[1]! * 40 + t.arousal * 4),
      genre: t.genre,
      title: t.title,
    };
  });

  return (
    <AppShell>
      <Page
        kicker="Evaluation"
        title="Metrics, ablations, embedding space"
        lede="Two layers of numbers: live scores on the 20-track toy corpus this lab actually runs, and the assignment’s illustrative full-corpus targets you should replace with your FMA / MTAT run."
      >
        <h2 className="font-serif text-2xl">Live toy corpus</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { k: "Fusion tag F1", v: live.macroF1.toFixed(2) },
            { k: "Genre accuracy", v: `${Math.round(live.genreAcc * 100)}%` },
            { k: "MAE valence", v: live.maeValence.toFixed(2) },
            { k: "Retrieval R@5", v: ret.r5.toFixed(2) },
          ].map((m) => (
            <div key={m.k} className="rounded-[24px] border border-border bg-surface p-5">
              <p className="text-[12px] text-muted">{m.k}</p>
              <p className="mt-1 font-mono text-3xl tabular-nums">{m.v}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 font-serif text-2xl">Assignment target table</h2>
        <p className="mt-1 text-[13px] text-muted">
          Replace these with your run. They exist so you know what “good” looks like on FMA-scale data.
        </p>
        <div className="mt-4 overflow-x-auto rounded-[24px] border border-border">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead className="bg-surface text-[11px] uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Macro-F1</th>
                <th className="px-4 py-3 font-medium">AUC-PR</th>
                <th className="px-4 py-3 font-medium">MAE</th>
                <th className="px-4 py-3 font-medium">R@5</th>
              </tr>
            </thead>
            <tbody>
              {TARGET_RESULTS.map((r) => (
                <tr key={r.model} className="border-t border-border">
                  <td className="px-4 py-3">{r.model}</td>
                  <td className="px-4 py-3 font-mono tabular-nums">{r.macroF1.toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono tabular-nums">{r.aucPr.toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono tabular-nums">
                    {r.mae === null ? "—" : r.mae.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums">
                    {r.r5 === null ? "—" : r.r5.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[24px] border border-border bg-surface p-5">
            <h3 className="font-serif text-xl">F1 vs epoch</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...F1_CURVE]}>
                  <CartesianGrid stroke="#26262b" strokeDasharray="3 3" />
                  <XAxis dataKey="epoch" stroke="#9a9892" fontSize={11} />
                  <YAxis stroke="#9a9892" fontSize={11} domain={[0, 0.7]} />
                  <Tooltip
                    contentStyle={{
                      background: "#121214",
                      border: "1px solid #26262b",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="bert" stroke="#9a9892" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="gnn" stroke="#8aa0ae" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="fusion" stroke="#d4d8e0" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-[24px] border border-border bg-surface p-5">
            <h3 className="font-serif text-xl">z projected by genre</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid stroke="#26262b" strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="x" name="z0" stroke="#9a9892" fontSize={11} />
                  <YAxis type="number" dataKey="y" name="z1" stroke="#9a9892" fontSize={11} />
                  <ZAxis range={[60, 60]} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    contentStyle={{
                      background: "#121214",
                      border: "1px solid #26262b",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v: number | string) => v}
                    labelFormatter={() => ""}
                  />
                  {GENRES.map((g) => (
                    <Scatter
                      key={g}
                      name={g}
                      data={points.filter((p) => p.genre === g)}
                      fill={GENRE_COLOR[g]}
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <h2 className="mt-12 font-serif text-2xl">Ablation notes</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {ABLATIONS.map((a) => (
            <li key={a.name} className="rounded-2xl border border-border px-4 py-3 text-[14px]">
              <span className="font-medium">{a.name}</span>
              <span className="ml-2 font-mono text-muted">{a.f1.toFixed(2)}</span>
              <p className="mt-1 text-[13px] text-muted">{a.note}</p>
            </li>
          ))}
        </ul>
      </Page>
    </AppShell>
  );
}
