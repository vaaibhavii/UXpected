"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

export const FOCUS =
  "focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#245D91]";

/** One shared two-column frame so every scene has the same margins, gutter and column ratio. */
const GRID =
  "mx-auto grid w-full max-w-7xl gap-10 px-6 pb-20 pt-28 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:px-12";
export const GRID_TALL = `${GRID} lg:items-start`;
export const GRID_CENTER = `${GRID} lg:min-h-full lg:items-center`;
/** Aarav's column: same height everywhere. The sticky one stays in view beside long content. */
export const ART = "relative mx-auto h-[32vh] w-full max-w-md lg:sticky lg:top-28 lg:h-[64vh] lg:max-w-none";
export const ART_STATIC = "relative mx-auto h-[32vh] w-full max-w-md lg:h-[64vh] lg:max-w-none";

/** Standard arrow icons (lucide), sized to sit on the text baseline. */
export function Arrow({ dir = "up-right", className = "" }: { dir?: "up-right" | "left" | "right"; className?: string }) {
  const Icon = dir === "left" ? ArrowLeft : dir === "right" ? ArrowRight : ArrowUpRight;
  return (
    <Icon
      aria-hidden="true"
      strokeWidth={3}
      className={`inline-block h-[1.15em] w-[1.15em] shrink-0 align-[-0.2em] ${dir === "left" ? "mr-1.5" : "ml-1.5"} ${className}`}
    />
  );
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute left-6 top-6 z-20 flex min-h-12 cursor-pointer items-center gap-2 rounded-full border-[3px] border-[#1f2a33] bg-[#F8F0DE] px-5 text-sm font-bold text-[#1f2a33] shadow-[3px_3px_0_#1f2a33] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none md:left-12 md:top-10 ${FOCUS}`}
    >
      <ArrowLeft aria-hidden="true" strokeWidth={3} className="h-5 w-5" /> Back
    </button>
  );
}

/** Small hand-drawn doodles that float gently (still when reduced motion is on). */
export function Coin({ className = "", size = 28, delay = 0 }: { className?: string; size?: number; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={`pointer-events-none absolute ${className}`}
      animate={reduce ? undefined : { y: [0, -6, 0], rotate: [-6, 6, -6] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <circle cx="20" cy="20" r="17" fill="#E7BD52" stroke="#1f2a33" strokeWidth="3" />
      <circle cx="20" cy="20" r="10" fill="none" stroke="#1f2a33" strokeWidth="2" strokeDasharray="3 3" />
    </motion.svg>
  );
}

export function Squiggle({ className = "", color = "#C04C37" }: { className?: string; color?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 14" className={className} preserveAspectRatio="none">
      <path d="M2 8 Q 14 0 26 8 T 50 8 T 74 8 T 98 8 T 122 8 T 146 8 T 170 8 T 198 8" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Star({ className = "", color = "#39795A" }: { className?: string; color?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`pointer-events-none absolute ${className}`} width="26" height="26">
      <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill={color} stroke="#1f2a33" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/** Rupee count-up. */
export function AnimatedAmount({ value, format, from }: { value: number; format: (n: number) => string; from?: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : (from ?? value));

  useEffect(() => {
    if (reduce) {
      setShown(value);
      return;
    }
    const from = shown;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / 600, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(from + (value - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce]);

  return <span>{format(Math.round(shown))}</span>;
}
