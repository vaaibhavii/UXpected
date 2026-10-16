"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import CharacterVideo from "@/components/CharacterVideo";
import { Arrow, BackButton, Coin, FOCUS, Squiggle, Star } from "@/components/SceneParts";
import { formatINR, useJourney, type RouteChoice } from "@/lib/journey";

const INK = "#1f2a33";

/* ---------- Environments inside each box ---------- */

function SteadyArt({ reduce }: { reduce: boolean | null }) {
  return (
    <svg viewBox="0 0 420 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="h-full w-full">
      <rect width="420" height="170" fill="#E7BD52" />
      <motion.g variants={{ rest: { rotate: 0 }, hover: { rotate: 25 } }} style={{ originX: "340px", originY: "42px" }}>
        <circle cx="340" cy="42" r="22" fill="#F8F0DE" stroke={INK} strokeWidth="3" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line key={a} x1="340" y1="42" x2="340" y2="8" stroke={INK} strokeWidth="3" strokeLinecap="round" transform={`rotate(${a} 340 42)`} opacity="0.35" />
        ))}
        <circle cx="340" cy="42" r="22" fill="#F8F0DE" stroke={INK} strokeWidth="3" />
      </motion.g>
      <path d="M0 130 Q 110 70 220 118 T 420 96 V170 H0 Z" fill="#39795A" stroke={INK} strokeWidth="3" />
      <motion.g variants={{ rest: { opacity: 0.9 }, hover: { opacity: 1 } }}>
        <motion.path
          d="M24 170 C 120 142, 150 108, 224 108 S 330 84, 392 52"
          fill="none"
          stroke="#F8F0DE"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray="1 14"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, delay: 0.3, ease: "easeOut" }}
        />
      </motion.g>
      <motion.g variants={{ rest: { scale: 1, rotate: 0 }, hover: { scale: 1.18, rotate: 4 } }} style={{ originX: "392px", originY: "56px" }}>
        <path d="M392 56 V28" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        <path d="M392 40 Q 374 40 372 22 Q 392 22 392 40 Z" fill="#F8F0DE" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M392 34 Q 410 34 412 16 Q 392 16 392 34 Z" fill="#E7BD52" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      </motion.g>
      {[
        { x: 60, y: 60, d: 0 },
        { x: 150, y: 40, d: 1.4 },
        { x: 250, y: 70, d: 2.6 },
      ].map((l) => (
        <motion.g
          key={l.x}
          animate={reduce ? undefined : { x: [0, 14, 0], y: [0, -8, 0], rotate: [0, 20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: l.d }}
        >
          <path d={`M${l.x} ${l.y} Q ${l.x + 12} ${l.y - 14} ${l.x + 24} ${l.y} Q ${l.x + 12} ${l.y + 10} ${l.x} ${l.y} Z`} fill="#39795A" stroke={INK} strokeWidth="2.5" />
        </motion.g>
      ))}
    </svg>
  );
}

function AdventureArt({ reduce }: { reduce: boolean | null }) {
  return (
    <svg viewBox="0 0 420 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="h-full w-full">
      <rect width="420" height="170" fill="#C04C37" />
      {[
        { x: 40, y: 30, d: 0 },
        { x: 190, y: 18, d: 0.8 },
        { x: 300, y: 50, d: 1.6 },
        { x: 110, y: 62, d: 2.2 },
      ].map((s) => (
        <motion.g
          key={s.x}
          animate={reduce ? undefined : { opacity: [0.4, 1, 0.4], scale: [0.85, 1.1, 0.85] }}
          transition={{ duration: 3, repeat: Infinity, delay: s.d }}
          style={{ originX: `${s.x}px`, originY: `${s.y}px` }}
        >
          <path d={`M${s.x} ${s.y - 9} L${s.x + 2.5} ${s.y - 2.5} L${s.x + 9} ${s.y} L${s.x + 2.5} ${s.y + 2.5} L${s.x} ${s.y + 9} L${s.x - 2.5} ${s.y + 2.5} L${s.x - 9} ${s.y} L${s.x - 2.5} ${s.y - 2.5} Z`} fill="#F8F0DE" />
        </motion.g>
      ))}
      <path d="M-10 170 L90 70 L150 130 L230 40 L300 120 L350 80 L430 170 Z" fill="#245D91" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M230 40 L212 62 L226 58 L234 66 L246 58 L258 64 Z" fill="#F8F0DE" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <motion.path
        d="M14 164 L92 112 L140 140 L226 84 L276 118 L388 34"
        fill="none"
        stroke="#E7BD52"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, delay: 0.3, ease: "easeOut" }}
      />
      <motion.g variants={{ rest: { x: 0, y: 0, rotate: 0 }, hover: { x: 12, y: -14, rotate: 8 } }} transition={{ type: "spring", stiffness: 220, damping: 10 }}>
        <g transform="translate(388 34) rotate(40)">
          <ellipse cx="0" cy="0" rx="9" ry="20" fill="#F8F0DE" stroke={INK} strokeWidth="3" />
          <path d="M-9 -4 Q 0 -30 9 -4 Z" fill="#E7BD52" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="0" cy="2" r="4" fill="#245D91" stroke={INK} strokeWidth="2" />
          <path d="M-5 20 L0 32 L5 20 Z" fill="#E7BD52" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        </g>
      </motion.g>
    </svg>
  );
}

/* ---------- One big, wholly clickable box ---------- */

interface BoxProps {
  title: string;
  subtitle: string;
  description: string;
  preview: string[];
  know: string[];
  label: string;
  cta: string;
  bg: string;
  fg: string;
  ctaBg: string;
  ctaFg: string;
  art: ReactNode;
  selected: boolean;
  dimmed: boolean;
  className?: string;
  onPick: () => void;
  onHover: (on: boolean) => void;
}

function RouteBox(p: BoxProps) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      initial="rest"
      animate="rest"
      whileHover="hover"
      onHoverStart={() => p.onHover(true)}
      onHoverEnd={() => p.onHover(false)}
      onFocus={() => p.onHover(true)}
      onBlur={() => p.onHover(false)}
      variants={reduce ? undefined : { rest: { y: 0, scale: 1 }, hover: { y: -8, scale: 1.015 } }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      style={{ backgroundColor: p.bg, color: p.fg }}
      className={`group relative cursor-pointer overflow-hidden rounded-[2rem] border-[3px] border-[#1f2a33] has-[:focus-visible]:outline-[4px] has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-[#E7BD52] ${
        p.selected ? "shadow-[10px_10px_0_#1f2a33] outline-[4px] outline-offset-4 outline-[#1f2a33]" : "shadow-[6px_6px_0_#1f2a33]"
      } ${p.dimmed ? "opacity-50" : ""} transition-opacity duration-300 ${p.className ?? ""}`}
    >
      <div className="h-36 border-b-[3px] border-[#1f2a33] md:h-44">{p.art}</div>
      {p.selected && (
        <span className="absolute right-4 top-4 rounded-full border-[3px] border-[#1f2a33] bg-[#F8F0DE] px-3 py-1 text-xs font-black text-[#1f2a33]">
          ✓ Picked
        </span>
      )}
      <div className="p-5 md:p-7">
        <span className="inline-block -rotate-1 rounded-full border-[3px] border-[#1f2a33] bg-[#E7BD52] px-3 py-1 text-[0.7rem] font-black uppercase tracking-wider text-[#1f2a33]">
          {p.label}
        </span>
        <h2 className="mt-3 text-[clamp(1.7rem,3.4vw,2.6rem)] font-black leading-none tracking-tight">{p.title}</h2>
        <p className="mt-1 text-lg font-bold opacity-95">{p.subtitle}</p>
        <p className="mt-3 text-sm font-medium leading-relaxed opacity-95 md:text-base">{p.description}</p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest opacity-90">What this route could involve</h3>
            <ul className="mt-2 space-y-2 text-sm leading-snug">
              {p.preview.map((t) => (
                <li key={t} className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest opacity-90">What to know</h3>
            <ul className="mt-2 space-y-2 text-sm leading-snug">
              {p.know.map((t) => (
                <li key={t} className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* The stretched pseudo-element makes the whole box the click target. */}
        <button
          type="button"
          onClick={p.onPick}
          style={{ backgroundColor: p.ctaBg, color: p.ctaFg }}
          className="mt-6 min-h-14 cursor-pointer rounded-full border-[3px] border-[#1f2a33] px-6 text-sm font-black tracking-wider shadow-[4px_4px_0_#1f2a33] transition-transform after:absolute after:inset-0 after:content-[''] group-hover:-translate-y-0.5 group-hover:shadow-[6px_6px_0_#1f2a33] focus-visible:outline-none sm:text-base"
        >
          {p.cta}
          <Arrow />
        </button>
      </div>
    </motion.article>
  );
}

/* ---------- Scene ---------- */

export default function RouteScene() {
  const { budget, route, setRoute, goBack, goTo } = useJourney();
  const reduce = useReducedMotion();
  const [reactKey, setReactKey] = useState(0);
  const [hovered, setHovered] = useState<RouteChoice | null>(null);
  const [picked, setPicked] = useState<RouteChoice | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const invest = budget.amounts.invest;

  const choose = (c: RouteChoice) => {
    if (picked) return;
    setRoute(c);
    setPicked(c);
    setReactKey((k) => k + 1);
    const to = c === "steady" ? "steady" : c === "adventure" ? "adventure" : "profile";
    if (reduce) return goTo(to);
    timer.current = setTimeout(() => goTo(to), 650);
  };

  const steadyOn = hovered === "steady" || picked === "steady";
  const advOn = hovered === "adventure" || picked === "adventure";

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-[#F8F0DE] text-[#1f2a33]">
      <BackButton onClick={goBack} />

      <div className="mx-auto w-full max-w-7xl px-6 pb-20 pt-28 lg:px-12">
        {/* Intro: Aarav with two paths branching from his desk */}
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="relative mx-auto h-[30vh] w-full max-w-md lg:h-[36vh] lg:max-w-none">
            <div aria-hidden="true" className="absolute inset-x-[2%] bottom-[2%] top-[6%] rounded-[46%_54%_42%_58%/55%_45%_55%_45%] bg-[#E7BD52]" />
            <div className="absolute inset-0 w-[62%]">
              <CharacterVideo reactKey={reactKey} />
            </div>
            <svg aria-hidden="true" viewBox="0 0 200 130" className="absolute bottom-[4%] right-0 h-[80%] w-[48%] overflow-visible">
              <motion.path
                d="M0 112 C 60 112, 90 96, 196 104"
                fill="none"
                stroke="#39795A"
                strokeWidth="7"
                strokeLinecap="round"
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: 1, strokeWidth: steadyOn ? 12 : 7 }}
                transition={{ pathLength: { duration: 1.2, delay: 0.4 }, strokeWidth: { duration: 0.25 } }}
              />
              <motion.path
                d="M0 112 L40 76 L66 92 L108 40 L134 62 L192 8"
                fill="none"
                stroke="#245D91"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="1 12"
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: 1, strokeWidth: advOn ? 12 : 7 }}
                transition={{ pathLength: { duration: 1.2, delay: 0.7 }, strokeWidth: { duration: 0.25 } }}
              />
              <circle cx="0" cy="112" r="8" fill="#C04C37" stroke={INK} strokeWidth="3" />
            </svg>
            <Coin className="left-[4%] top-[4%]" delay={0.5} />
            <Star className="right-[6%] top-[2%]" color="#C04C37" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C04C37]">Step 4 · Your money journey</p>
            <h1 className="mt-2 text-[clamp(2.1rem,5vw,4.2rem)] font-black leading-[0.97] tracking-tight">
              So, Aarav…{" "}
              <span className="relative inline-block text-[#245D91]">
                how do you want to grow your money?
                <Squiggle className="absolute -bottom-2 left-0 h-2.5 w-full" />
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base font-medium text-[#1f2a33]/80 md:text-lg">
              You&apos;ve got a budget. Now let&apos;s figure out what kind of money journey feels right for you.
            </p>
            <p className="mt-4 inline-block -rotate-1 rounded-2xl border-[3px] border-[#1f2a33] bg-[#fffaf0] px-4 py-2 text-sm font-bold shadow-[3px_3px_0_#1f2a33]">
              {invest > 0 ? (
                <>
                  Your planned investment budget: <span className="font-black text-[#C04C37]">{formatINR(invest)}/month</span>
                </>
              ) : (
                <>You haven&apos;t planned to invest anything yet, and that&apos;s a perfectly valid choice. Keep exploring, no commitment.</>
              )}
            </p>
            <p className="mt-2 text-xs font-semibold text-[#1f2a33]/60">Picking a route doesn&apos;t invest anything or set up a SIP.</p>
          </div>
        </div>

        {/* Two worlds, deliberately off-balance */}
        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-16">
          <RouteBox
            title="THE STEADIER ROUTE 🌱"
            subtitle="Slow, steady, and more predictable."
            description="If your priority is keeping money accessible and avoiding big swings, let's explore options that generally involve lower volatility."
            preview={[
              "Savings accounts for readily accessible money.",
              "Fixed deposits for money that can be set aside for a defined period.",
              "Other suitable lower-volatility options, depending on the goal and the product's terms.",
            ]}
            know={[
              "Generally more predictable than equity investments, depending on the product.",
              "Returns may be modest and can be affected by inflation, taxes, and product terms.",
              "Early withdrawal may have restrictions or penalties.",
              "Lower volatility does not mean every product is risk-free.",
            ]}
            label="Prioritise stability and accessibility"
            cta="EXPLORE THE STEADIER ROUTE"
            bg="#39795A"
            fg="#F8F0DE"
            ctaBg="#E7BD52"
            ctaFg={INK}
            art={<SteadyArt reduce={reduce} />}
            selected={picked === "steady" || (!picked && route === "steady")}
            dimmed={picked !== null && picked !== "steady"}
            className="lg:-rotate-[0.6deg]"
            onPick={() => choose("steady")}
            onHover={(on) => setHovered(on ? "steady" : null)}
          />
          <RouteBox
            title="THE ADVENTUROUS ROUTE 🚀"
            subtitle="More ups and downs. More uncertainty."
            description="If you're investing for a longer-term goal and can tolerate losses, let's explore investments with greater growth potential — and greater risk."
            preview={[
              "Diversified equity index mutual funds.",
              "Flexi-cap mutual funds.",
              "Small-cap mutual funds, which can carry particularly high volatility.",
            ]}
            know={[
              "Values can rise and fall significantly.",
              "Losses are possible, including when you need to withdraw.",
              "A longer investment horizon can provide more time to ride out volatility, but does not guarantee a profit.",
              "Different equity funds have different risks; they should not all be treated as interchangeable.",
            ]}
            label="Explore long-term growth potential"
            cta="EXPLORE THE ADVENTUROUS ROUTE"
            bg="#245D91"
            fg="#F8F0DE"
            ctaBg="#C04C37"
            ctaFg="#F8F0DE"
            art={<AdventureArt reduce={reduce} />}
            selected={picked === "adventure" || (!picked && route === "adventure")}
            dimmed={picked !== null && picked !== "adventure"}
            className="lg:mt-14 lg:rotate-[0.6deg]"
            onPick={() => choose("adventure")}
            onHover={(on) => setHovered(on ? "adventure" : null)}
          />
        </div>

        {/* Quiet third option */}
        <div
          className={`mx-auto mt-12 max-w-3xl -rotate-1 rounded-3xl border-[3px] border-dashed border-[#1f2a33] p-6 text-center transition-opacity ${
            picked && picked !== "unsure" ? "opacity-50" : ""
          }`}
        >
          <h2 className="text-2xl font-black">Not sure which route fits me?</h2>
          <p className="mt-2 text-[#1f2a33]/75">
            That&apos;s completely fine. Answer a few quick questions and we&apos;ll explain the trade-offs.
          </p>
          <button
            type="button"
            onClick={() => choose("unsure")}
            className={`mt-4 min-h-14 cursor-pointer rounded-full border-[3px] border-[#1f2a33] bg-[#E7BD52] px-6 text-sm font-black tracking-wider shadow-[4px_4px_0_#1f2a33] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none sm:text-base ${FOCUS}`}
          >
            HELP ME FIGURE IT OUT <Arrow />
          </button>
        </div>
      </div>
    </div>
  );
}
