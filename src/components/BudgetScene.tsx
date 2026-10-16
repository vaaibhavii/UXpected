"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import CharacterVideo from "@/components/CharacterVideo";
import { Calculator, MoneyInput, Motif, Wallet } from "@/components/MoneyParts";
import { AnimatedAmount, Arrow, ART, BackButton, Coin, FOCUS, GRID_TALL, Squiggle, Star } from "@/components/SceneParts";
import {
  BUDGET_KEYS,
  formatINR,
  incomeTotal,
  suggestSplit,
  useJourney,
  type BudgetKey,
} from "@/lib/journey";

const INK = "#1f2a33";

const CATS: Record<BudgetKey, { name: string; blurb: string; bg: string; fg: string; phrase: string }> = {
  essentials: { name: "Essentials", blurb: "Travel, food, college expenses and necessities.", bg: "#245D91", fg: "#F8F0DE", phrase: "for essentials" },
  fun: { name: "Fun money", blurb: "Shopping, outings, entertainment and hobbies.", bg: "#E7BD52", fg: INK, phrase: "for fun" },
  emergency: { name: "Emergency savings", blurb: "Set aside for unexpected expenses.", bg: "#39795A", fg: "#F8F0DE", phrase: "for your safety net" },
  invest: { name: "Investments", blurb: "Money you may choose to invest for longer-term goals. Totally up to you.", bg: "#C04C37", fg: "#F8F0DE", phrase: "for future-you" },
};

const pctOf = (a: number, inc: number) => (inc > 0 ? Math.round((a / inc) * 1000) / 10 : 0);
const fmtPct = (p: number) => `${Number.isInteger(p) ? p : p.toFixed(1)}%`;
const stepFor = (inc: number) => (inc >= 200000 ? 5000 : inc >= 50000 ? 1000 : inc >= 10000 ? 500 : inc >= 2000 ? 100 : 10);

/** Builds the reveal sentence from the user's real numbers. */
export function summaryFor(a: Record<BudgetKey, number>) {
  return BUDGET_KEYS.map((k) => `${formatINR(a[k])} ${CATS[k].phrase}.`).join(" ");
}

export default function BudgetScene() {
  const { income: inc, budget, setBudget, goBack, goNext, goTo, returnTo, setReturnTo } = useJourney();
  const reduce = useReducedMotion();
  const income = incomeTotal(inc);

  const [phase, setPhase] = useState<"split" | "reveal">("split");
  const [open, setOpen] = useState<BudgetKey | null>(null);
  const [reactKey, setReactKey] = useState(0);
  const cooling = useRef(false);

  // A changed income re-seeds the suggested split; an unchanged one keeps the user's edits.
  const stale = budget.basis !== income;
  const amounts = stale ? suggestSplit(income) : budget.amounts;
  useEffect(() => {
    if (stale) setBudget({ amounts: suggestSplit(income), basis: income });
  }, [stale, income, setBudget]);

  const allocated = BUDGET_KEYS.reduce((s, k) => s + amounts[k], 0);
  const remaining = income - allocated;
  const status = remaining === 0 ? "balanced" : remaining > 0 ? "unassigned" : "over";
  const step = stepFor(income);

  const nudge = () => {
    if (cooling.current) return;
    cooling.current = true;
    setReactKey((k) => k + 1);
    setTimeout(() => {
      cooling.current = false;
    }, 1200);
  };

  const setAmount = (k: BudgetKey, v: number) => {
    setBudget({ amounts: { ...amounts, [k]: Math.max(0, Math.round(v)) }, basis: income });
    nudge();
  };

  const reset = () => {
    setBudget({ amounts: suggestSplit(income), basis: income });
    nudge();
  };

  const distribute = () => {
    if (remaining <= 0) return;
    const base = Math.floor(remaining / 4);
    const extra = remaining % 4;
    const next = { ...amounts };
    BUDGET_KEYS.forEach((k, i) => {
      next[k] += base + (i < extra ? 1 : 0);
    });
    setBudget({ amounts: next, basis: income });
    nudge();
  };

  const scale = Math.max(income, allocated, 1);
  const spring = { type: "spring" as const, stiffness: 420, damping: 12 };

  const Bar = (
    <div
      role="img"
      aria-label={`Budget bar: ${BUDGET_KEYS.map((k) => `${CATS[k].name} ${formatINR(amounts[k])}`).join(", ")}`}
      className={`flex h-12 w-full overflow-hidden rounded-full border-[3px] bg-[#fffaf0] ${
        status === "over" ? "border-[#C04C37] shadow-[0_0_0_3px_#C04C37]" : "border-[#1f2a33]"
      }`}
    >
      {BUDGET_KEYS.map((k) => (
        <motion.div
          key={k}
          initial={false}
          animate={{ width: `${(amounts[k] / scale) * 100}%` }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 160, damping: 20 }}
          style={{ backgroundColor: CATS[k].bg }}
          className="h-full border-r-[3px] border-[#1f2a33] last:border-r-0"
        />
      ))}
      <motion.div
        initial={false}
        animate={{ width: `${(Math.max(remaining, 0) / scale) * 100}%` }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 160, damping: 20 }}
        className="h-full bg-[repeating-linear-gradient(45deg,#E7BD52_0_6px,#fffaf0_6px_12px)]"
      />
    </div>
  );

  const finish = () => {
    if (returnTo) {
      const to = returnTo;
      setReturnTo(null);
      goTo(to);
    } else {
      goNext();
    }
  };
  const goBackSmart = () => (phase === "reveal" ? setPhase("split") : returnTo ? finish() : goBack());

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-[#F8F0DE] text-[#1f2a33]">
      <BackButton onClick={goBackSmart} />

      <div className={GRID_TALL}>
        {/* Aarav */}
        <div className={ART}>
          <div aria-hidden="true" className="absolute inset-x-[4%] bottom-[4%] top-[8%] rounded-[46%_54%_42%_58%/55%_45%_55%_45%] bg-[#245D91]" />
          <div className="absolute inset-0">
            <CharacterVideo reactKey={reactKey} />
          </div>
          <Wallet className="right-[2%] top-[4%] z-10 w-[18%] max-w-[90px] -rotate-6" />
          <Calculator className="bottom-[2%] left-[2%] z-10 w-[14%] max-w-[64px] rotate-3" />
          <Coin className="left-[6%] top-[6%]" delay={0.6} />
          <Star className="right-[30%] top-[2%]" color="#E7BD52" />
        </div>

        <div className="min-w-0">
          {/* Income pill, animates in from the previous scene */}
          <p className="inline-block -rotate-2 rounded-full border-[3px] border-[#1f2a33] bg-[#E7BD52] px-4 py-1 text-sm font-black shadow-[3px_3px_0_#1f2a33]">
            Monthly income: <AnimatedAmount value={income} from={0} format={formatINR} />
          </p>

          <AnimatePresence mode="wait" initial={false}>
            {phase === "split" ? (
              <motion.div key="split" exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                <h1 className="mt-3 text-[clamp(2.1rem,5vw,4rem)] font-black leading-[0.97] tracking-tight">
                  Now,{" "}
                  <span className="relative inline-block text-[#C04C37]">
                    where should all that money go?
                    <Squiggle className="absolute -bottom-2 left-0 h-2.5 w-full" color="#245D91" />
                  </span>
                </h1>
                <p className="mt-5 max-w-xl text-base font-medium text-[#1f2a33]/80 md:text-lg">
                  Let&apos;s make room for the essentials, a little fun, future-you, and your first investments.
                </p>

                {income === 0 ? (
                  <div className="mt-8 -rotate-1 rounded-3xl border-[3px] border-dashed border-[#1f2a33] bg-[#fffaf0] p-6">
                    <p className="text-xl font-black">Nothing to split yet, and that&apos;s okay.</p>
                    <p className="mt-2 text-[#1f2a33]/75">
                      A plan can start from ₹0. Add an income on the previous screen whenever money starts coming in.
                    </p>
                    <button
                      type="button"
                      onClick={goBack}
                      className={`mt-4 min-h-12 cursor-pointer rounded-full border-[3px] border-[#1f2a33] bg-[#245D91] px-6 font-black text-[#F8F0DE] shadow-[4px_4px_0_#1f2a33] ${FOCUS}`}
                    >
                      <Arrow dir="left" />Edit my income
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mt-6">{Bar}</div>

                    {/* Totals */}
                    <dl className="mt-4 grid grid-cols-3 gap-2 text-center sm:gap-3">
                      <Stat label="Monthly income" value={income} />
                      <Stat label="Total allocated" value={allocated} />
                      <Stat
                        label={status === "over" ? "Over budget" : status === "unassigned" ? "Still to assign" : "Remaining"}
                        value={Math.abs(remaining)}
                        tone={status === "over" ? "bad" : status === "unassigned" ? "warn" : "good"}
                      />
                    </dl>

                    <div aria-live="polite" className="mt-3 min-h-12">
                      {status === "over" && (
                        <p className="rounded-2xl bg-[#C04C37] px-4 py-2 font-bold text-[#F8F0DE]">
                          You&apos;re {formatINR(-remaining)} over your income. Trim a category to continue.
                        </p>
                      )}
                      {status === "unassigned" && (
                        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#E7BD52] px-4 py-2 font-bold">
                          <span>{formatINR(remaining)} still to assign.</span>
                          <button
                            type="button"
                            onClick={distribute}
                            className={`min-h-10 cursor-pointer rounded-full border-[3px] border-[#1f2a33] bg-[#F8F0DE] px-4 text-sm font-black ${FOCUS}`}
                          >
                            Share it across categories
                          </button>
                        </div>
                      )}
                      {status === "balanced" && (
                        <p className="rounded-2xl bg-[#39795A] px-4 py-2 font-bold text-[#F8F0DE]">
                          Every rupee has a job. Nicely balanced.
                        </p>
                      )}
                    </div>

                    {/* Category cards */}
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {BUDGET_KEYS.map((k, i) => {
                        const c = CATS[k];
                        const isOpen = open === k;
                        const idle = reduce ? undefined : { y: [0, -2, 0] };
                        return (
                          <motion.div
                            key={k}
                            whileHover={reduce ? undefined : { y: -5, rotate: i % 2 ? 1 : -1 }}
                            transition={spring}
                            style={{ backgroundColor: c.bg, color: c.fg }}
                            className={`rounded-[1.6rem] border-[3px] border-[#1f2a33] ${isOpen ? "shadow-[7px_7px_0_#1f2a33]" : "shadow-[4px_4px_0_#1f2a33]"}`}
                          >
                            <button
                              type="button"
                              aria-expanded={isOpen}
                              aria-controls={`panel-${k}`}
                              onClick={() => setOpen(isOpen ? null : k)}
                              className={`flex min-h-24 w-full cursor-pointer items-center gap-3 rounded-[1.4rem] p-4 text-left ${FOCUS}`}
                            >
                              <motion.span animate={idle} transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }} className="shrink-0">
                                <Motif kind={k} className="h-12 w-12" />
                              </motion.span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs font-bold uppercase tracking-widest opacity-90">{c.name}</span>
                                <span className="block text-2xl font-black leading-tight sm:text-3xl">
                                  <AnimatedAmount value={amounts[k]} format={formatINR} />
                                </span>
                                <span className="block text-xs font-bold opacity-90">{fmtPct(pctOf(amounts[k], income))} of income</span>
                              </span>
                              <span aria-hidden="true" className="text-xl font-black">{isOpen ? "−" : "✎"}</span>
                            </button>

                            <AnimatePresence initial={false}>
                              {isOpen && (
                                <motion.div
                                  id={`panel-${k}`}
                                  initial={reduce ? false : { height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4">
                                    <p className="text-sm font-medium opacity-90">{c.blurb}</p>
                                    <div className="mt-3 flex items-start gap-2">
                                      <StepBtn label={`Decrease ${c.name} by ${formatINR(step)}`} onClick={() => setAmount(k, amounts[k] - step)} disabled={amounts[k] === 0}>
                                        −
                                      </StepBtn>
                                      <MoneyInput
                                        id={`amt-${k}`}
                                        ariaLabel={`${c.name} amount`}
                                        value={amounts[k]}
                                        emptyIsZero
                                        onChange={(v) => setAmount(k, v ?? 0)}
                                        className="min-w-0 flex-1"
                                        boxClassName="min-h-12 rounded-xl border-[3px] border-[#1f2a33] bg-[#F8F0DE] px-3 text-[#1f2a33] focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[#F8F0DE]"
                                        prefixClassName="text-xl font-black"
                                        inputClassName="text-xl font-black px-1"
                                        errorClassName="text-[#F8F0DE] [text-shadow:0_1px_0_#1f2a33]"
                                      />
                                      <StepBtn label={`Increase ${c.name} by ${formatINR(step)}`} onClick={() => setAmount(k, amounts[k] + step)}>
                                        +
                                      </StepBtn>
                                    </div>
                                    <input
                                      type="range"
                                      aria-label={`${c.name} slider`}
                                      min={0}
                                      max={Math.max(income, amounts[k])}
                                      step={step}
                                      value={amounts[k]}
                                      onChange={(e) => setAmount(k, Number(e.target.value))}
                                      className={`mt-1 h-8 w-full cursor-pointer accent-[#F8F0DE] ${FOCUS}`}
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        disabled={status !== "balanced"}
                        onClick={() => setPhase("reveal")}
                        className={`min-h-14 rounded-full border-[3px] border-[#1f2a33] px-7 text-sm font-black tracking-wider transition-all sm:text-base ${
                          status === "balanced"
                            ? "cursor-pointer bg-[#C04C37] text-[#F8F0DE] shadow-[5px_5px_0_#1f2a33] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                            : "cursor-not-allowed border-[#1f2a33]/25 bg-[#1f2a33]/10 text-[#1f2a33]/40"
                        } ${FOCUS}`}
                      >
                        SHOW ME THE PLAN <Arrow />
                      </button>
                      <button
                        type="button"
                        onClick={reset}
                        className={`min-h-12 cursor-pointer rounded-full px-4 font-bold underline decoration-[#245D91] decoration-wavy underline-offset-4 ${FOCUS}`}
                      >
                        Reset to suggested split
                      </button>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-[#1f2a33]/60">
                      The suggested split is just a starting point to play with, not financial advice. You decide.
                    </p>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div key="reveal" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="mt-3 text-[clamp(2.1rem,5vw,4rem)] font-black leading-[0.97] tracking-tight">
                  Look at that.{" "}
                  <span className="relative inline-block text-[#39795A]">
                    Your money has a plan.
                    <Squiggle className="absolute -bottom-2 left-0 h-2.5 w-full" color="#E7BD52" />
                  </span>
                </h1>

                <div className="mt-6">{Bar}</div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
                  {BUDGET_KEYS.map((k, i) => {
                    const c = CATS[k];
                    return (
                      <motion.div
                        key={k}
                        initial={reduce ? false : { opacity: 0, y: 40, scale: 0.8, rotate: i % 2 ? 6 : -6 }}
                        animate={{ opacity: 1, y: 0, scale: 1, rotate: i % 2 ? 1 : -1 }}
                        transition={reduce ? { duration: 0 } : { ...spring, delay: 0.15 + i * 0.12 }}
                        style={{ backgroundColor: c.bg, color: c.fg }}
                        className="relative rounded-[1.6rem] border-[3px] border-[#1f2a33] p-4 shadow-[5px_5px_0_#1f2a33]"
                      >
                        {k === "invest" && (
                          <span className="absolute -right-2 -top-3 rotate-6 rounded-full border-[3px] border-[#1f2a33] bg-[#E7BD52] px-2 py-0.5 text-[0.65rem] font-black text-[#1f2a33]">
                            ✦ future-you
                          </span>
                        )}
                        <Motif kind={k} className="h-10 w-10" />
                        <p className="mt-2 text-xs font-bold uppercase tracking-widest opacity-90">{c.name}</p>
                        <p className="text-2xl font-black sm:text-3xl">{formatINR(amounts[k])}</p>
                        <p className="text-xs font-bold opacity-90">{fmtPct(pctOf(amounts[k], income))}</p>
                      </motion.div>
                    );
                  })}
                </div>

                <p className="mt-6 max-w-2xl text-lg font-bold leading-snug md:text-xl">{summaryFor(amounts)}</p>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={finish}
                    className={`min-h-14 cursor-pointer rounded-full border-[3px] border-[#1f2a33] bg-[#C04C37] px-7 text-sm font-black tracking-wider text-[#F8F0DE] shadow-[5px_5px_0_#1f2a33] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none sm:text-base ${FOCUS}`}
                  >
                    {returnTo ? "BACK TO MY PLAN" : "LET'S EXPLORE MY MONEY"} <Arrow />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhase("split")}
                    className={`min-h-12 cursor-pointer rounded-full px-4 font-bold underline decoration-[#245D91] decoration-wavy underline-offset-4 ${FOCUS}`}
                  >
                    Tweak my split
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "good" | "warn" | "bad" }) {
  const bg = tone === "bad" ? "#C04C37" : tone === "warn" ? "#E7BD52" : "#fffaf0";
  const fg = tone === "bad" ? "#F8F0DE" : INK;
  return (
    <div style={{ backgroundColor: bg, color: fg }} className="rounded-2xl border-[3px] border-[#1f2a33] px-2 py-2">
      <dt className="text-[0.62rem] font-bold uppercase tracking-wider opacity-80 sm:text-xs">{label}</dt>
      <dd className="text-lg font-black sm:text-2xl">
        <AnimatedAmount value={value} format={formatINR} />
      </dd>
    </div>
  );
}

function StepBtn({ children, label, onClick, disabled }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="min-h-12 min-w-12 cursor-pointer rounded-xl border-[3px] border-[#1f2a33] bg-[#F8F0DE] text-2xl font-black text-[#1f2a33] transition-transform active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#F8F0DE]"
    >
      {children}
    </button>
  );
}
