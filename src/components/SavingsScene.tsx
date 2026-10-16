"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import CharacterVideo from "@/components/CharacterVideo";
import { AnimatedAmount, Arrow, ART_STATIC, BackButton, Coin, FOCUS, GRID_CENTER, Squiggle, Star } from "@/components/SceneParts";
import { formatINR, useJourney, type SavingsChoice, type SavingsState } from "@/lib/journey";

const INK = "#1f2a33";

interface Tile {
  id: SavingsChoice;
  label: string;
  sub?: string;
  value?: number;
  bg: string;
  fg: string;
}

const TILES: Tile[] = [
  { id: "p0", label: "₹0", sub: "Starting fresh", value: 0, bg: "#245D91", fg: "#F8F0DE" },
  { id: "p500", label: "₹500", value: 500, bg: "#C04C37", fg: "#F8F0DE" },
  { id: "p1000", label: "₹1,000", value: 1000, bg: "#E7BD52", fg: INK },
  { id: "p2500", label: "₹2,500", value: 2500, bg: "#39795A", fg: "#F8F0DE" },
  { id: "p5000", label: "₹5,000", value: 5000, bg: "#245D91", fg: "#F8F0DE" },
  { id: "p10000", label: "₹10,000+", value: 10000, bg: "#C04C37", fg: "#F8F0DE" },
];

const MAX_AMOUNT = 999_999_999;

export function parseCustom(raw: string): { value: number | null; error: string | null } {
  const cleaned = raw.replace(/[₹,\s]/g, "");
  if (cleaned === "") return { value: null, error: null };
  if (cleaned.startsWith("-")) return { value: null, error: "Savings can't be negative. Try 0 if you're starting fresh." };
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return { value: null, error: "Numbers only, please." };
  const value = parseFloat(cleaned);
  if (!Number.isFinite(value) || value > MAX_AMOUNT) return { value: null, error: "That's a big number! Try something smaller." };
  return { value, error: null };
}

export function messageFor(s: SavingsState): string | null {
  if (s.unknown) return "That's okay. We'll work it out together.";
  if (s.amount === null) return null;
  if (s.amount === 0) return "No worries. Every money journey starts somewhere.";
  if (s.amount < 2500) return "Hey, that's a start. Let's build from here.";
  if (s.amount < 10000) return "Nice! You've already got a little cushion.";
  return "Look at you, building a little safety net.";
}

function Jar({ level, unknown, dropKey }: { level: number; unknown: boolean; dropKey: number }) {
  const reduce = useReducedMotion();
  const fillH = level * 170;
  const coins = 7;

  return (
    <div className="relative aspect-[200/260] w-full">
      <svg viewBox="0 0 200 260" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <clipPath id="jar-clip">
            <rect x="32" y="52" width="136" height="188" rx="36" />
          </clipPath>
          <pattern id="coin-pat" width="30" height="26" patternUnits="userSpaceOnUse">
            <rect width="30" height="26" fill="#E7BD52" />
            <circle cx="10" cy="10" r="8" fill="#F3D27C" stroke={INK} strokeWidth="2" />
            <circle cx="25" cy="20" r="8" fill="#F3D27C" stroke={INK} strokeWidth="2" />
          </pattern>
        </defs>
        <ellipse cx="100" cy="248" rx="70" ry="8" fill={INK} opacity="0.12" />
        <rect x="32" y="52" width="136" height="188" rx="36" fill="#fffaf0" />
        <g clipPath="url(#jar-clip)">
          <motion.rect
            x="32"
            width="136"
            fill="url(#coin-pat)"
            initial={false}
            animate={{ y: 240 - fillH, height: fillH + 2 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 90, damping: 14 }}
          />
          <path d="M44 70 Q 40 120 46 170" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.55" />
        </g>
        <rect x="32" y="52" width="136" height="188" rx="36" fill="none" stroke={INK} strokeWidth="4" />
        <rect x="44" y="24" width="112" height="30" rx="12" fill="#C04C37" stroke={INK} strokeWidth="4" />
        <path d="M70 39 H130" stroke="#F8F0DE" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        {unknown && (
          <text x="100" y="168" textAnchor="middle" fontSize="80" fontWeight="900" fill={INK} opacity="0.35">
            ?
          </text>
        )}
      </svg>

      {!reduce && dropKey > 0 && (
        <div key={dropKey} className="pointer-events-none absolute inset-0">
          {Array.from({ length: coins }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute top-0 block h-[13%] w-[13%] rounded-full border-[3px] border-[#1f2a33] bg-[#E7BD52]"
              style={{ left: `${36 + ((i * 17) % 28)}%` }}
              initial={{ y: -90, opacity: 0, rotate: 0 }}
              animate={{ y: [-90, 70 + (i % 3) * 20], opacity: [0, 1, 1, 0], rotate: 180 + i * 40 }}
              transition={{ duration: 0.9, delay: i * 0.08, ease: "easeIn" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SavingsScene() {
  const { savings, setSavings, goNext, goBack } = useJourney();
  const reduce = useReducedMotion();
  const [raw, setRaw] = useState(() =>
    savings.choice === "custom" && savings.amount !== null ? String(savings.amount) : "",
  );
  const [dropKey, setDropKey] = useState(0);
  const [reactKey, setReactKey] = useState(0);

  const parsed = parseCustom(raw);
  const customActive = savings.choice === "custom";
  const message = messageFor(savings);
  const canContinue = savings.unknown || savings.amount !== null;
  const level =
    savings.amount === null ? 0 : savings.amount === 0 ? 0 : Math.max(0.1, Math.min(savings.amount / 10000, 1));

  const celebrate = () => {
    setDropKey((k) => k + 1);
    setReactKey((k) => k + 1);
  };

  const pick = (t: Tile) => {
    setSavings({ amount: t.value ?? 0, unknown: false, choice: t.id });
    celebrate();
  };

  const pickCustom = () => {
    setSavings({ amount: parsed.value, unknown: false, choice: "custom" });
    if (parsed.value !== null) celebrate();
  };

  const onCustomChange = (v: string) => {
    setRaw(v);
    setSavings({ amount: parseCustom(v).value, unknown: false, choice: "custom" });
  };

  const pickUnknown = () => {
    setSavings({ amount: null, unknown: true, choice: "unknown" });
    setReactKey((k) => k + 1);
  };

  const hover = reduce ? undefined : { y: -5, rotate: 0, scale: 1.04 };
  const spring = { type: "spring" as const, stiffness: 420, damping: 11 };

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-[#F8F0DE] text-[#1f2a33]">
      <BackButton onClick={goBack} />

      <div className={GRID_CENTER}>
        {/* Aarav + jar */}
        <div className={ART_STATIC}>
          <div
            aria-hidden="true"
            className="absolute inset-x-[4%] bottom-[4%] top-[8%] rounded-[46%_54%_42%_58%/55%_45%_55%_45%] bg-[#245D91]"
          />
          <div className="absolute inset-0">
            <CharacterVideo reactKey={reactKey} />
          </div>
          <div className="absolute bottom-0 right-0 z-10 w-[36%] max-w-[230px]">
            <Jar level={level} unknown={savings.unknown} dropKey={dropKey} />
            <div
              aria-live="polite"
              className="mx-auto -mt-1 w-max max-w-full -rotate-2 rounded-xl border-[3px] border-[#1f2a33] bg-[#F8F0DE] px-3 py-1 text-center shadow-[3px_3px_0_#1f2a33]"
            >
              <p className="text-[0.6rem] font-bold uppercase tracking-widest text-[#C04C37]">Saved so far</p>
              <p className="text-lg font-black leading-tight md:text-2xl">
                {savings.unknown ? "Not sure yet" : savings.amount === null ? "—" : <AnimatedAmount value={savings.amount} format={formatINR} />}
              </p>
            </div>
          </div>
          <Coin className="left-[2%] top-[4%]" delay={0.3} />
          <Coin className="right-[8%] top-[12%]" size={22} delay={1.2} />
          <Star className="left-[6%] bottom-[14%]" color="#E7BD52" />
          <Star className="right-[34%] top-[2%]" />
        </div>

        {/* Question */}
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C04C37]">Step 1 · Your savings</p>
          <h1 className="mt-2 text-[clamp(2.4rem,6.2vw,5rem)] font-black leading-[0.95] tracking-tight">
            Okay Aarav, <span className="relative inline-block text-[#245D91]">
              let&apos;s talk money.
              <Squiggle className="absolute -bottom-2 left-0 h-2.5 w-full" />
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base font-medium text-[#1f2a33]/80 md:text-lg">
            First things first… how much have you managed to save up so far?
          </p>

          <div role="group" aria-label="Savings amount" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TILES.map((t, i) => {
              const selected = savings.choice === t.id;
              return (
                <motion.button
                  key={t.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => pick(t)}
                  whileHover={hover}
                  whileTap={reduce ? undefined : { scale: 0.96 }}
                  animate={{ rotate: selected ? 0 : i % 2 ? 1.2 : -1.2, scale: selected ? 1.05 : 1 }}
                  transition={spring}
                  style={selected ? { backgroundColor: t.bg, color: t.fg } : undefined}
                  className={`min-h-[5.25rem] cursor-pointer rounded-[1.6rem] border-[3px] border-[#1f2a33] px-4 py-3 text-left ${
                    selected ? "shadow-[6px_6px_0_#1f2a33]" : "bg-[#fffaf0] shadow-[4px_4px_0_#1f2a33]"
                  } ${FOCUS}`}
                >
                  <span className="block text-2xl font-black leading-none md:text-3xl">{t.label}</span>
                  {t.sub && <span className="mt-1 block text-xs font-semibold opacity-80">{t.sub}</span>}
                  {selected && <span aria-hidden="true" className="float-right -mt-6 text-lg">✓</span>}
                </motion.button>
              );
            })}

            <motion.button
              type="button"
              aria-pressed={customActive}
              onClick={pickCustom}
              whileHover={hover}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              animate={{ scale: customActive ? 1.02 : 1 }}
              transition={spring}
              style={customActive ? { backgroundColor: "#39795A", color: "#F8F0DE" } : undefined}
              className={`col-span-full min-h-16 cursor-pointer rounded-[1.6rem] border-[3px] border-dashed border-[#1f2a33] px-5 py-3 text-left text-lg font-black ${
                customActive ? "shadow-[6px_6px_0_#1f2a33]" : "bg-transparent shadow-[4px_4px_0_#1f2a33]"
              } ${FOCUS}`}
            >
              ✎ Enter my own amount
            </motion.button>
          </div>

          <AnimatePresence initial={false}>
            {customActive && (
              <motion.div
                initial={reduce ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4">
                  <label htmlFor="custom-amount" className="text-sm font-bold">
                    How much exactly?
                  </label>
                  <div className="mt-1 flex items-center rounded-2xl border-[3px] border-[#1f2a33] bg-[#fffaf0] px-4 focus-within:outline-[3px] focus-within:outline-offset-4 focus-within:outline-[#245D91]">
                    <span aria-hidden="true" className="text-2xl font-black text-[#C04C37]">₹</span>
                    <input
                      id="custom-amount"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="e.g. 3,200"
                      value={raw}
                      aria-invalid={parsed.error !== null}
                      aria-describedby="custom-error"
                      onChange={(e) => onCustomChange(e.target.value)}
                      onBlur={() => parsed.value !== null && celebrate()}
                      onKeyDown={(e) => e.key === "Enter" && parsed.value !== null && celebrate()}
                      className="min-h-14 w-full bg-transparent px-2 text-2xl font-black outline-none placeholder:font-medium placeholder:text-[#1f2a33]/30"
                    />
                  </div>
                  <p id="custom-error" role="alert" className="mt-1 min-h-5 text-sm font-semibold text-[#C04C37]">
                    {parsed.error}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            aria-pressed={savings.unknown}
            onClick={pickUnknown}
            className={`mt-3 min-h-12 cursor-pointer rounded-full px-5 text-base font-bold underline decoration-[#C04C37] decoration-wavy underline-offset-4 ${
              savings.unknown ? "bg-[#E7BD52]" : ""
            } ${FOCUS}`}
          >
            I&apos;m not sure yet.
          </button>

          <div aria-live="polite" className="mt-3 min-h-14">
            <AnimatePresence mode="wait">
              {message && (
                <motion.p
                  key={message}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="inline-block -rotate-1 rounded-2xl bg-[#39795A] px-4 py-2 text-base font-bold text-[#F8F0DE]"
                >
                  {message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            disabled={!canContinue}
            onClick={goNext}
            className={`mt-4 min-h-14 rounded-full border-[3px] border-[#1f2a33] px-8 text-base font-black tracking-wider transition-all ${
              canContinue
                ? "cursor-pointer bg-[#C04C37] text-[#F8F0DE] shadow-[5px_5px_0_#1f2a33] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                : "cursor-not-allowed border-[#1f2a33]/25 bg-[#1f2a33]/10 text-[#1f2a33]/40"
            } ${FOCUS}`}
          >
            LET&apos;S KEEP GOING <Arrow />
          </button>
        </div>
      </div>
    </div>
  );
}
