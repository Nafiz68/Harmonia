import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { AppShell, Page } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { PROJECT_FILES, PROJECT_ROOT, PROJECT_ZIP } from "@/lib/project-manifest";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/code")({ component: CodePage });

function CodePage() {
  const [file, setFile] = useState<(typeof PROJECT_FILES)[number]>("README.md");
  const [text, setText] = useState("Loading…");

  useEffect(() => {
    let live = true;
    fetch(`${PROJECT_ROOT}/${file}`)
      .then((r) => r.text())
      .then((t) => {
        if (live) setText(t);
      })
      .catch(() => {
        if (live) setText("Could not load this file.");
      });
    return () => {
      live = false;
    };
  }, [file]);

  return (
    <AppShell>
      <Page
        kicker="PyTorch repo"
        title="Download and read the starter"
        lede="A complete VS Code project: GraphSAGE in pure PyTorch, DistilBERT hook, fusion, InfoNCE, and a synthetic corpus so you can train tonight without FMA."
      >
        <div className="mb-6 flex flex-wrap gap-3">
          <Button asChild>
            <a href={PROJECT_ZIP} download>
              <Download />
              Download zip
            </a>
          </Button>
          <p className="self-center text-[13px] text-muted">
            Unzip → create a venv → <span className="font-mono">python -m src.train --task 2 --data synthetic</span>
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <nav className="flex gap-2 overflow-x-auto lg:block lg:overflow-visible">
            {PROJECT_FILES.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFile(f)}
                className={cn(
                  "block w-full shrink-0 rounded-xl px-3 py-2 text-left font-mono text-[12px] transition-colors",
                  f === file ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                )}
              >
                {f}
              </button>
            ))}
          </nav>
          <pre className="max-h-[70vh] overflow-auto rounded-[24px] border border-border bg-surface p-4 font-mono text-[12px] leading-relaxed text-muted">
            {text}
          </pre>
        </div>
      </Page>
    </AppShell>
  );
}
