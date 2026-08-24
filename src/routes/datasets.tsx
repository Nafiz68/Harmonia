import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Page } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { DATASETS, PAIRINGS } from "@/lib/music/datasets";

export const Route = createFileRoute("/datasets")({ component: DatasetsPage });

function DatasetsPage() {
  return (
    <AppShell>
      <Page
        kicker="Table 1"
        title="Datasets and how to pair them"
        lede="The brief requires at least one primary audio set and one text/tag source. Start small, then scale. Every link below is the official or standard public dump."
      >
        <div className="mb-10 grid gap-3 md:grid-cols-3">
          {PAIRINGS.map((p) => (
            <div key={p.title} className="rounded-[24px] border border-border bg-surface p-5">
              <h2 className="font-serif text-xl">{p.title}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-[24px] border border-border">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="bg-surface text-[11px] uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Dataset</th>
                <th className="px-4 py-3 font-medium">Scale</th>
                <th className="px-4 py-3 font-medium">Labels</th>
                <th className="px-4 py-3 font-medium">Tasks</th>
                <th className="px-4 py-3 font-medium">Get it</th>
              </tr>
            </thead>
            <tbody>
              {DATASETS.map((d) => (
                <tr key={d.id} className="border-t border-border align-top">
                  <td className="px-4 py-4">
                    <div className="font-medium">{d.name}</div>
                    <Badge className="mt-1">{d.difficulty}</Badge>
                  </td>
                  <td className="px-4 py-4 text-muted">
                    {d.clips}
                    <div className="text-[12px]">{d.size}</div>
                  </td>
                  <td className="px-4 py-4 text-muted">{d.labels}</td>
                  <td className="px-4 py-4 text-muted">{d.tasks}</td>
                  <td className="px-4 py-4">
                    <a
                      href={d.download}
                      target="_blank"
                      rel="noreferrer"
                      className="text-fg underline-offset-4 hover:underline"
                    >
                      Official source
                    </a>
                    <p className="mt-1 max-w-xs text-[12px] text-muted">{d.notes}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 rounded-[24px] border border-border bg-surface p-6">
          <h2 className="font-serif text-2xl">FMA download (copy into a terminal)</h2>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-bg p-4 font-mono text-[12px] leading-relaxed text-muted">
{`mkdir -p data/raw && cd data/raw
curl -O https://os.unil.cloud.switch.ch/fma/fma_metadata.zip
curl -O https://os.unil.cloud.switch.ch/fma/fma_small.zip
# later, if you have disk:
# curl -O https://os.unil.cloud.switch.ch/fma/fma_medium.zip
unzip fma_metadata.zip
unzip fma_small.zip`}
          </pre>
          <p className="mt-3 text-[13px] text-muted">
            Metadata is required even for the small audio dump. Verify checksums from{" "}
            <a
              className="text-fg underline-offset-4 hover:underline"
              href="https://github.com/mdeff/fma"
              target="_blank"
              rel="noreferrer"
            >
              github.com/mdeff/fma
            </a>
            . Use the official splits in the FMA repo — do not reshuffle by track id.
          </p>
        </div>
      </Page>
    </AppShell>
  );
}
