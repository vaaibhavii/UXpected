"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { YearPoint } from "@/lib/projection";

const INK = "#1f2a33";
const W = 600;
const H = 230;
const PAD_X = 8;
const PAD_TOP = 10;
const PAD_BOTTOM = 26;

/**
 * Stacked bars per year. Blue = what you put in. Green = hypothetical growth on top.
 * If the assumption is negative, the shortfall is drawn in coral so a loss never looks like a gain.
 */
export default function ProjectionChart({ points }: { points: YearPoint[] }) {
  const reduce = useReducedMotion();
  const n = points.length;
  const max = Math.max(1, ...points.map((p) => Math.max(p.value, p.contributed)));
  const plotH = H - PAD_BOTTOM - PAD_TOP;
  const slot = (W - PAD_X * 2) / Math.max(n, 1);
  const bw = Math.min(slot * 0.72, 30);
  const h = (v: number) => (plotH * v) / max;
  const tickEvery = n <= 10 ? 1 : 5;
  const t = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 140, damping: 20 };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Bar chart over ${n} years showing total contributions and hypothetical growth or shortfall`}
      className="h-auto w-full"
    >
      <line x1={PAD_X} x2={W - PAD_X} y1={H - PAD_BOTTOM} y2={H - PAD_BOTTOM} stroke={INK} strokeWidth="3" strokeLinecap="round" />
      {points.map((p, i) => {
        const base = Math.min(p.value, p.contributed);
        const top = Math.abs(p.value - p.contributed);
        const gain = p.value >= p.contributed;
        const x = PAD_X + i * slot + (slot - bw) / 2;
        const yBase = H - PAD_BOTTOM - h(base);
        const yTop = yBase - h(top);
        return (
          <g key={p.year}>
            <motion.rect
              x={x}
              width={bw}
              rx={3}
              fill="#245D91"
              stroke={INK}
              strokeWidth="2"
              initial={false}
              animate={{ y: yBase, height: h(base) }}
              transition={t}
            />
            <motion.rect
              x={x}
              width={bw}
              rx={3}
              fill={gain ? "#39795A" : "#C04C37"}
              stroke={INK}
              strokeWidth="2"
              initial={false}
              animate={{ y: yTop, height: h(top), opacity: top > 0.5 ? 1 : 0 }}
              transition={t}
            />
            {(p.year === 1 || p.year % tickEvery === 0 || p.year === n) && (
              <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize="12" fontWeight="800" fill={INK}>
                {p.year}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
