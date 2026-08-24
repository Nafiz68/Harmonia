import { TRACKS, type Track } from "@/lib/music/tracks";
import { cn } from "@/lib/utils";

export function TrackPicker({
  value,
  onChange,
}: {
  value: Track;
  onChange: (t: Track) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TRACKS.map((t) => {
        const active = t.id === value.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t)}
            className={cn(
              "shrink-0 rounded-2xl border px-3 py-2 text-left transition-colors duration-150",
              active
                ? "border-accent/40 bg-elevated"
                : "border-border bg-surface hover:bg-elevated",
            )}
          >
            <div className="text-[13px] font-medium">{t.title}</div>
            <div className="text-[11px] text-muted">
              {t.genre} · {t.year}
            </div>
          </button>
        );
      })}
    </div>
  );
}
