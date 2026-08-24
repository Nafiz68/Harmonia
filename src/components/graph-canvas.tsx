import { useEffect, useRef, useState } from "react";
import type { MusicGraph } from "@/lib/music/graphs";
import { encodeGraph } from "@/lib/music/graphsage";
import { cn } from "@/lib/utils";

interface SimNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function layout(n: number): SimNode[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.cos(a) * 0.28, y: Math.sin(a) * 0.28, vx: 0, vy: 0 };
  });
}

export function GraphCanvas({
  graph,
  highlight,
  pulseLayer = -1,
  onSelect,
  className,
}: {
  graph: MusicGraph;
  highlight?: number | null;
  pulseLayer?: number;
  onSelect?: (id: number) => void;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 640, h: 320 });
  const [pos, setPos] = useState<SimNode[]>(() => layout(graph.nodes.length));
  const graphRef = useRef(graph);
  graphRef.current = graph;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.max(1, r.width), h: Math.max(1, r.height) });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setSize({ w: Math.max(1, r.width), h: Math.max(1, r.height) });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const g = graph;
    let nodes: SimNode[] = layout(g.nodes.length);
    let raf = 0;
    let running = true;
    let tick = 0;
    const step = () => {
      if (!running) return;
      const gg = graphRef.current;
      if (nodes.length !== gg.nodes.length) {
        nodes = layout(gg.nodes.length);
      }
      const k = 0.18;
      const m = nodes.length;
      for (let i = 0; i < m; i++) {
        for (let j = i + 1; j < m; j++) {
          const a = nodes[i]!;
          const b = nodes[j]!;
          let dx = a.x - b.x;
          let dy = a.y - b.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          const force = (k * k) / dist;
          dx /= dist;
          dy /= dist;
          a.vx += dx * force;
          a.vy += dy * force;
          b.vx -= dx * force;
          b.vy -= dy * force;
        }
      }
      for (const e of gg.edges) {
        const a = nodes[e.source];
        const b = nodes[e.target];
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const force = (dist - k * 1.6) * 0.02 * (0.4 + e.weight);
        a.vx += dx * force;
        a.vy += dy * force;
        b.vx -= dx * force;
        b.vy -= dy * force;
      }
      for (const p of nodes) {
        p.vx += -p.x * 0.01;
        p.vy += -p.y * 0.01;
        p.vx *= 0.82;
        p.vy *= 0.82;
        p.x += p.vx;
        p.y += p.vy;
      }
      tick++;
      if (tick % 2 === 0) setPos(nodes.map((p) => ({ ...p })));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, [graph]);

  const cx = size.w / 2;
  const cy = size.h / 2;
  const scale = Math.min(size.w, size.h) * 0.92;
  const sage = encodeGraph(graph);
  const layerIdx = Math.min(sage.nodeStates.length - 1, Math.max(0, pulseLayer));
  const states = sage.nodeStates[layerIdx] ?? sage.nodeStates[0]!;

  const xy = (p: SimNode) => [cx + p.x * scale, cy + p.y * scale] as const;

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <svg
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        role="img"
        aria-label="Music structure graph"
        className="h-full w-full"
      >
        {graph.edges.map((e, i) => {
          const a = pos[e.source];
          const b = pos[e.target];
          if (!a || !b) return null;
          const [x1, y1] = xy(a);
          const [x2, y2] = xy(b);
          const dashed = e.kind === "similarity";
          const stroke =
            e.kind === "temporal"
              ? "rgba(200,204,212,0.28)"
              : e.kind === "similarity"
                ? "rgba(138,160,174,0.35)"
                : "rgba(242,240,235,0.22)";
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={stroke}
              strokeWidth={0.8 + e.weight * 1.8}
              strokeDasharray={dashed ? "4 4" : undefined}
              strokeLinecap="round"
            />
          );
        })}
        {graph.nodes.map((node, i) => {
          const p = pos[i];
          if (!p) return null;
          const [x, y] = xy(p);
          const feat = states[i] ?? node.features;
          const mag = Math.min(1, Math.sqrt(feat.reduce((s, v) => s + v * v, 0)) / 3);
          const r = 10 + mag * 6;
          const active = highlight === i;
          const label = node.label.length > 8 ? node.label.slice(0, 8) : node.label;
          return (
            <g
              key={node.id}
              onPointerDown={() => onSelect?.(i)}
              className="cursor-pointer"
            >
              <circle
                cx={x}
                cy={y}
                r={r}
                fill={active ? "#f2f0eb" : "#1c1c20"}
                stroke={active ? "#f2f0eb" : "rgba(212,216,224,0.7)"}
                strokeWidth={active ? 2.2 : 1.1}
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={active ? "#0a0a0b" : "#d8d6d0"}
                fontSize={11}
                fontFamily="IBM Plex Mono, ui-monospace, monospace"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
