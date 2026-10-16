"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import CharacterVideo from "@/components/CharacterVideo";
import { Calculator, MoneyInput, Notebook, Wallet } from "@/components/MoneyParts";
import { AnimatedAmount, Arrow, ART_STATIC, BackButton, Coin, FOCUS, GRID_CENTER, Squiggle, Star } from "@/components/SceneParts";
import {
  formatINR,
  incomeTotal,
  incomeValid,
  useJourney,
  type IncomeKind,
} from "@/lib/journey";

const KINDS: IncomeKind[] = ["Pocket money", "Internship", "Part-time work", "Freelancing", "Other"];
const CHIP_COLORS = ["#245D91", "#C04C37", "#39795A", "#E7BD52", "#245D91"];

export default function IncomeScene() {
  const { income, setIncome, savings, goBack, goNext } = useJourney();
  const reduce = useReducedMotion();
  const [flying, setFlying] = useState(false);
  const [reactKey, setReactKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const total = incomeTotal(income);
  const valid = incomeValid(income);
  const hasSources = income.sources.length > 0;

  const addSource = (kind: IncomeKind) => {
    setIncome((p) => ({
      ...p,
      sources: [
        ...p.sources,
        { id: Math.random().toString(36).slice(2), kind, amount: p.sources.length === 0 ? (p.manualTotal ?? 0) : 0 },
      ],
    }));
    setReactKey((k) => k + 1);
  };

  const removeSource = (id: string) =>
    setIncome((p) => {
      const removed = p.sources.find((s) => s.id === id);
      const sources = p.sources.filter((s) => s.id !== id);
      return { manualTotal: sources.length === 0 ? (removed?.amount ?? p.manualTotal) : p.manualTotal, sources };
    });

  const proceed = () => {
    if (!valid || flying) return;
    if (reduce) return goNext();
    setFlying(true);
    timer.current = setTimeout(goNext, 750);
  };

  const savedLine = savings.unknown
    ? "You weren't sure about your savings yet. That's fine."
    : savings.amount !== null
      ? `Starting point: ${formatINR(savings.amount)} already saved.`
      : null;

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-[#F8F0DE] text-[#1f2a33]">
      <BackButton onClick={goBack} />

      {flying && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute block h-9 w-9 rounded-full border-[3px] border-[#1f2a33] bg-[#E7BD52]"
              style={{ left: "55%", top: `${34 + (i % 4) * 6}%` }}
              initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
              animate={{ x: "70vw", y: [0, -50 - i * 4, 20], opacity: [0, 1, 1, 0], rotate: 360 }}
              transition={{ duration: 0.65, delay: i * 0.04, ease: "easeIn" }}
            />
          ))}
        </div>
      )}

      <div className={GRID_CENTER}>
        {/* Aarav + desk props */}
        <div className={ART_STATIC}>
          <div aria-hidden="true" className="absolute inset-x-[4%] bottom-[4%] top-[8%] rounded-[54%_46%_58%_42%/45%_55%_45%_55%] bg-[#39795A]" />
          <div className="absolute inset-0">
            <CharacterVideo reactKey={reactKey} />
          </div>
          <Wallet className="right-[2%] top-[6%] z-10 w-[18%] max-w-[90px] -rotate-6" />
          <Calculator className="bottom-[2%] left-[2%] z-10 w-[15%] max-w-[70px] rotate-3" />
          <Notebook className="bottom-[2%] right-[4%] z-10 w-[17%] max-w-[80px] rotate-6" />
          <Coin className="left-[6%] top-[8%]" delay={0.4} />
          <Coin className="right-[26%] top-[2%]" size={22} delay={1.3} />
          <Star className="left-[22%] bottom-[10%]" color="#E7BD52" />
        </div>

        {/* Income */}
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C04C37]">Step 2 · Your income</p>
          <h1 className="mt-2 text-[clamp(2.1rem,5.4vw,4.4rem)] font-black leading-[0.97] tracking-tight">
            Alright Aarav,{" "}
            <span className="relative inline-block text-[#245D91]">
              how much money comes in
              <Squiggle className="absolute -bottom-2 left-0 h-2.5 w-full" />
            </span>{" "}
            every month?
          </h1>
          <p className="mt-5 max-w-xl text-base font-medium text-[#1f2a33]/80 md:text-lg">
            Pocket money, internship stipend, side hustles… let&apos;s see what we&apos;re working with.
          </p>

          {/* Big amount */}
          <div className="mt-6 -rotate-1 rounded-[2rem] border-[3px] border-[#1f2a33] bg-[#fffaf0] px-5 py-3 shadow-[6px_6px_0_#1f2a33]">
            <label htmlFor="income-total" className="text-xs font-bold uppercase tracking-widest text-[#C04C37]">
              {hasSources ? `Total from ${income.sources.length} source${income.sources.length > 1 ? "s" : ""}` : "Monthly income (edit me)"}
            </label>
            <div className="flex flex-wrap items-baseline gap-x-3">
              {hasSources ? (
                <p id="income-total" aria-live="polite" className="text-[clamp(2.6rem,7vw,4.6rem)] font-black leading-tight">
                  <AnimatedAmount value={total} format={formatINR} />
                </p>
              ) : (
                <MoneyInput
                  id="income-total"
                  value={income.manualTotal}
                  onChange={(v) => setIncome((p) => ({ ...p, manualTotal: v }))}
                  placeholder="8000"
                  className="min-w-0 flex-1"
                  boxClassName="focus-within:outline-[3px] focus-within:outline-offset-4 focus-within:outline-[#245D91] rounded-xl"
                  prefixClassName="text-[clamp(2.2rem,6vw,3.8rem)] font-black text-[#C04C37]"
                  inputClassName="text-[clamp(2.6rem,7vw,4.6rem)] font-black leading-tight px-1 placeholder:text-[#1f2a33]/25"
                />
              )}
              <span className="text-xl font-black text-[#1f2a33]/60">/ month</span>
            </div>
          </div>
          <p className="mt-2 text-sm font-semibold text-[#1f2a33]/70">Use an average month if your income changes.</p>
          {total === 0 && valid && (
            <p className="mt-1 text-sm font-semibold text-[#245D91]">
              ₹0 works too. You can still plan; we&apos;ll just have nothing to split yet.
            </p>
          )}

          {/* Sources */}
          <p className="mt-6 text-sm font-bold">Where does it come from? (optional)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {KINDS.map((k, i) => (
              <motion.button
                key={k}
                type="button"
                onClick={() => addSource(k)}
                whileHover={reduce ? undefined : { y: -3, rotate: i % 2 ? 2 : -2 }}
                whileTap={reduce ? undefined : { scale: 0.95 }}
                transition={{ type: "spring", stiffness: 420, damping: 12 }}
                style={{ backgroundColor: CHIP_COLORS[i], color: CHIP_COLORS[i] === "#E7BD52" ? "#1f2a33" : "#F8F0DE" }}
                className={`min-h-11 cursor-pointer rounded-full border-[3px] border-[#1f2a33] px-4 text-sm font-black shadow-[3px_3px_0_#1f2a33] ${FOCUS}`}
              >
                + {k}
              </motion.button>
            ))}
          </div>

          <ul className="mt-3 space-y-2">
            <AnimatePresence initial={false}>
              {income.sources.map((s) => (
                <motion.li
                  key={s.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: 16 }}
                  className="flex items-start gap-2 rounded-2xl border-[3px] border-[#1f2a33] bg-[#fffaf0] pl-4 pr-2 pt-2"
                >
                  <span className="mt-2 w-28 shrink-0 text-sm font-black sm:w-36">{s.kind}</span>
                  <MoneyInput
                    id={`src-${s.id}`}
                    ariaLabel={`${s.kind} amount per month`}
                    value={s.amount}
                    onChange={(v) =>
                      setIncome((p) => ({ ...p, sources: p.sources.map((x) => (x.id === s.id ? { ...x, amount: v } : x)) }))
                    }
                    placeholder="0"
                    className="min-w-0 flex-1"
                    boxClassName="min-h-11 focus-within:outline-[3px] focus-within:outline-[#245D91] rounded-lg"
                    prefixClassName="text-xl font-black text-[#C04C37]"
                    inputClassName="text-xl font-black px-1"
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${s.kind}`}
                    onClick={() => removeSource(s.id)}
                    className={`min-h-11 min-w-11 cursor-pointer rounded-full text-lg font-black hover:bg-[#C04C37]/15 ${FOCUS}`}
                  >
                    ✕
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          {!hasSources && (
            <p className="mt-2 text-sm text-[#1f2a33]/60">Only know the total? Just leave the sources out.</p>
          )}
          {savedLine && <p className="mt-3 text-sm font-semibold text-[#39795A]">{savedLine}</p>}

          <button
            type="button"
            disabled={!valid || flying}
            onClick={proceed}
            className={`mt-6 min-h-14 rounded-full border-[3px] border-[#1f2a33] px-7 text-sm font-black tracking-wider transition-all sm:text-base ${
              valid
                ? "cursor-pointer bg-[#C04C37] text-[#F8F0DE] shadow-[5px_5px_0_#1f2a33] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                : "cursor-not-allowed border-[#1f2a33]/25 bg-[#1f2a33]/10 text-[#1f2a33]/40"
            } ${FOCUS}`}
          >
            LET&apos;S GIVE EVERY RUPEE A JOB <Arrow />
          </button>
          {!valid && <p className="mt-2 text-sm font-semibold text-[#C04C37]">Fill in every amount (or remove the empty source) to continue.</p>}
        </div>
      </div>
    </div>
  );
}
