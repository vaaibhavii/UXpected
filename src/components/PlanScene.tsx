"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import CharacterVideo from "@/components/CharacterVideo";
import { MoneyInput, Notebook } from "@/components/MoneyParts";
import ProjectionChart from "@/components/ProjectionChart";
import { labelOf } from "@/components/ProfileScene";
import { AnimatedAmount, Arrow, ART, BackButton, Coin, FOCUS, GRID_TALL, Squiggle, Star } from "@/components/SceneParts";
import { BUDGET_KEYS, formatINR, incomeTotal, useJourney, type ScenarioId } from "@/lib/journey";
import {
  DATA_NOTE,
  derivePlan,
  fvRange,
  needsCushion,
  optionsFor,
  type RouteKind,
} from "@/lib/planning";
import { outcome, parseRate, SCENARIO_RATES, yearlySeries } from "@/lib/projection";

const INK = "#1f2a33";
const DURATIONS = [3, 5, 10, 15, 20];

const SCENARIOS: { id: ScenarioId; label: string; bg: string; fg: string }[] = [
  { id: "low", label: "Lower-return illustration", bg: "#245D91", fg: "#F8F0DE" },
  { id: "mid", label: "Middle-return illustration", bg: "#E7BD52", fg: INK },
  { id: "high", label: "Higher-return illustration", bg: "#C04C37", fg: "#F8F0DE" },
  { id: "custom", label: "Your own assumption", bg: "#39795A", fg: "#F8F0DE" },
];

const pct = (n: number) => `${Math.round(n * 10) / 10}%`;
const signed = (n: number) => (n < 0 ? "−" : "") + formatINR(Math.abs(n));

export default function PlanScene() {
  const { income: inc, savings, budget, route: routeState, profile, plan, setPlan, setReturnTo, goTo } = useJourney();
  const reduce = useReducedMotion();
  const [moreOpen, setMoreOpen] = useState(false);
  const [capped, setCapped] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [reactKey, setReactKey] = useState(0);
  const [rateRaw, setRateRaw] = useState(String(plan.customRate));

  const route: RouteKind = routeState === "adventure" ? "adventure" : "steady";
  const income = incomeTotal(inc);
  const a = budget.amounts;
  const allocated = BUDGET_KEYS.reduce((s, k) => s + a[k], 0);
  const remaining = income - allocated;
  const balanced = remaining === 0;
  const invest = a.invest;

  const { sug, monthly } = derivePlan({ invest, route, profile, plan });
  const options = optionsFor(route);
  const chosen = options.find((o) => o.id === plan.category) ?? null;
  const cushionLacking = route === "steady" && needsCushion(profile, a.emergency);

  const rateOf = (id: ScenarioId) => (id === "custom" ? plan.customRate : SCENARIO_RATES[id]);
  const results = SCENARIOS.map((s) => ({ ...s, ...outcome(monthly, rateOf(s.id), plan.years) }));
  const selected = results.find((r) => r.id === plan.scenario) ?? results[1];
  const points = yearlySeries(monthly, selected.rate, plan.years);
  const range = fvRange(monthly, plan.years);

  const step = invest >= 50000 ? 100 : invest >= 10000 ? 50 : 10;
  const sliderMax = Math.max(step, Math.ceil(invest / step) * step);

  const setMonthly = (v: number) => {
    const over = v > invest;
    setCapped(over);
    if (over) setMoreOpen(true);
    setPlan((p) => ({ ...p, monthly: Math.max(0, Math.min(Math.round(v), invest)) }));
    setReactKey((k) => k + 1);
  };

  const reviseBudget = () => {
    setReturnTo("plan");
    goTo("budget");
  };

  const onRate = (v: string) => {
    setRateRaw(v);
    const r = parseRate(v);
    if (r.value !== null) setPlan((p) => ({ ...p, customRate: r.value as number }));
  };
  const rateErr = parseRate(rateRaw).error;

  const coinCount = invest > 0 ? Math.round((monthly / invest) * 8) : 0;
  const isSteady = route === "steady";
  const diffLabel = (d: number) =>
    Math.abs(d) < 0.5 ? "No difference from contributions" : d > 0 ? "Possible gain under this assumption" : "Possible shortfall under this assumption";

  const situation = [
    { label: "Monthly income", value: formatINR(income), bg: "#E7BD52", fg: INK },
    {
      label: "Current savings",
      value: savings.unknown ? "Not sure yet" : savings.amount === null ? "—" : formatINR(savings.amount),
      bg: "#fffaf0",
      fg: INK,
    },
    { label: "Emergency savings", value: `${formatINR(a.emergency)}/month`, bg: "#39795A", fg: "#F8F0DE" },
    { label: "Investment budget", value: `${formatINR(invest)}/month`, bg: "#C04C37", fg: "#F8F0DE" },
    { label: "Route", value: isSteady ? "Steadier 🌱" : "Adventurous 🚀", bg: "#245D91", fg: "#F8F0DE" },
  ];

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-[#F8F0DE] text-[#1f2a33]">
      <BackButton onClick={() => goTo(isSteady ? "steady" : "adventure")} />

      <div className={GRID_TALL}>
        {/* Aarav, notebook, coin stack */}
        <div className={ART}>
          <div
            aria-hidden="true"
            style={{ backgroundColor: isSteady ? "#39795A" : "#245D91" }}
            className="absolute inset-x-[4%] bottom-[4%] top-[8%] rounded-[46%_54%_42%_58%/55%_45%_55%_45%]"
          />
          <div className="absolute inset-0">
            <CharacterVideo reactKey={reactKey} />
          </div>
          <Notebook className="bottom-[2%] right-[2%] z-10 w-[24%] max-w-24 rotate-6" />
          <div aria-hidden="true" className="absolute bottom-[4%] left-[4%] z-10 flex flex-col-reverse gap-0.5">
            <AnimatePresence>
              {Array.from({ length: coinCount }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={reduce ? false : { scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 14 }}
                  className="block h-4 w-11 rounded-full border-[3px] border-[#1f2a33] bg-[#E7BD52]"
                />
              ))}
            </AnimatePresence>
          </div>
          <Coin className="left-[6%] top-[6%]" delay={0.4} />
          <Star className="right-[10%] top-[4%]" color={isSteady ? "#E7BD52" : "#C04C37"} />
        </div>

        <div className="min-w-0">
          {/* 1. Intro */}
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C04C37]">Your personal investment plan</p>
          <h1 className="mt-2 text-[clamp(2.1rem,5vw,4rem)] font-black leading-[0.97] tracking-tight">
            <span className={`relative inline-block ${isSteady ? "text-[#39795A]" : "text-[#245D91]"}`}>
              {isSteady ? "Let's make a plan that feels right." : "Ready to give future-you a head start?"}
              <Squiggle className="absolute -bottom-2 left-0 h-2.5 w-full" color={isSteady ? "#E7BD52" : "#C04C37"} />
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base font-medium text-[#1f2a33]/80 md:text-lg">
            Based on your budget and the route you chose, here&apos;s a starting point you can explore and adjust.
          </p>
          <p className="mt-2 text-xs font-semibold text-[#1f2a33]/60">
            Educational planning only. Not personalised regulated financial advice, and nothing here guarantees a return.
          </p>

          <dl className="mt-5 flex flex-wrap gap-3">
            {situation.map((s, i) => (
              <div
                key={s.label}
                style={{ backgroundColor: s.bg, color: s.fg, rotate: `${i % 2 ? 1.2 : -1.2}deg` }}
                className="rounded-2xl border-[3px] border-[#1f2a33] px-3 py-2 shadow-[3px_3px_0_#1f2a33]"
              >
                <dt className="text-[0.6rem] font-bold uppercase tracking-wider opacity-80">{s.label}</dt>
                <dd className="text-base font-black sm:text-lg">{s.value}</dd>
              </div>
            ))}
          </dl>

          {/* 2. Options */}
          <h2 className="mt-12 text-3xl font-black tracking-tight md:text-4xl">Here&apos;s what you could explore.</h2>
          {cushionLacking && (
            <p className="mt-3 rounded-2xl bg-[#E7BD52] px-4 py-3 text-sm font-bold">
              You don&apos;t seem to have an emergency cushion yet. Start with accessible savings before putting money into anything that restricts withdrawals.
            </p>
          )}
          {sug.conflicts.length > 0 && (
            <div role="note" className="mt-3 rounded-2xl border-[3px] border-[#C04C37] bg-[#fffaf0] px-4 py-3 text-sm">
              <p className="font-black text-[#C04C37]">Some of your answers don&apos;t line up with this route.</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 font-medium">
                {sug.conflicts.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <p className="mt-2 font-semibold">
                It&apos;s worth reviewing the plan or comparing the steadier route. You&apos;re still free to explore.
              </p>
            </div>
          )}
          {sug.notes.map((n) => (
            <p key={n} className="mt-3 rounded-2xl bg-[#fffaf0] px-4 py-3 text-sm font-semibold">
              {n}
            </p>
          ))}

          <div role="radiogroup" aria-label="Investment category for this plan" className="mt-5 space-y-4">
            {options.map((o, i) => {
              const on = plan.category === o.id;
              const open = detail === o.id;
              const bg = o.caution ? "#C04C37" : isSteady ? (i === 0 ? "#39795A" : i === 1 ? "#E7BD52" : "#fffaf0") : i === 0 ? "#245D91" : "#E7BD52";
              const fg = bg === "#E7BD52" || bg === "#fffaf0" ? INK : "#F8F0DE";
              return (
                <motion.article
                  key={o.id}
                  whileHover={reduce ? undefined : { y: -3 }}
                  style={{ backgroundColor: bg, color: fg }}
                  className={`rounded-[1.6rem] border-[3px] border-[#1f2a33] p-5 ${on ? "shadow-[8px_8px_0_#1f2a33]" : "shadow-[4px_4px_0_#1f2a33]"}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black md:text-2xl">{o.name}</h3>
                    <span className="rounded-full border-[2.5px] border-[#1f2a33] bg-[#F8F0DE] px-2.5 py-0.5 text-[0.65rem] font-black uppercase tracking-wider text-[#1f2a33]">
                      {o.tag}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-snug">{o.what}</p>
                  <p className="mt-2 text-sm leading-snug">
                    <span className="font-black">Its role in a plan: </span>
                    {o.role}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm leading-snug">
                    {o.limits.map((l) => (
                      <li key={l} className="flex gap-2">
                        <span aria-hidden="true">•</span>
                        <span>{l}</span>
                      </li>
                    ))}
                  </ul>
                  {o.caution && <p className="mt-2 text-sm font-black underline decoration-wavy underline-offset-4">{o.caution}</p>}

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        id={`opt-${o.id}`}
                        initial={reduce ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 space-y-2 border-t-[3px] border-dashed border-current/40 pt-3 text-sm leading-snug">
                          <p>
                            <span className="font-black">How it works: </span>
                            {o.how}
                          </p>
                          <p>
                            <span className="font-black">Relevant horizon: </span>
                            {o.horizon}
                          </p>
                          {!isSteady && <p className="font-semibold">{DATA_NOTE}</p>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={`opt-${o.id}`}
                      onClick={() => setDetail(open ? null : o.id)}
                      className="min-h-11 cursor-pointer rounded-full border-[3px] border-[#1f2a33] bg-[#F8F0DE] px-5 text-sm font-black tracking-wider text-[#1f2a33] shadow-[3px_3px_0_#1f2a33] focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#1f2a33]"
                    >
                      {open ? "HIDE DETAILS −" : "VIEW DETAILS +"}
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setPlan((p) => ({ ...p, category: on ? null : o.id }))}
                      className="min-h-11 cursor-pointer rounded-full border-[3px] border-[#1f2a33] bg-[#1f2a33] px-5 text-sm font-black tracking-wider text-[#F8F0DE] shadow-[3px_3px_0_#1f2a33] focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#1f2a33]"
                    >
                      {on ? "✓ IN MY PLAN" : "USE IN MY PLAN"}
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
          {!isSteady && <p className="mt-3 text-xs font-semibold text-[#1f2a33]/65">{DATA_NOTE}</p>}

          {/* 3. Suggested amount */}
          <h2 className="mt-14 text-3xl font-black tracking-tight md:text-4xl">Your monthly investment idea.</h2>
          <div className="mt-4 -rotate-[0.6deg] rounded-[1.8rem] border-[3px] border-[#1f2a33] bg-[#fffaf0] p-5 shadow-[6px_6px_0_#1f2a33]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#C04C37]">Suggested starting amount — editable</p>
            <p className="text-[clamp(2.4rem,6vw,4rem)] font-black leading-tight">
              {formatINR(sug.amount)}
              <span className="text-xl text-[#1f2a33]/60"> / month</span>
            </p>
            <ul className="mt-2 space-y-1.5 text-sm font-medium leading-snug">
              {sug.reasons.map((r) => (
                <li key={r} className="flex gap-2">
                  <span aria-hidden="true" className="text-[#C04C37]">
                    ✦
                  </span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs font-semibold text-[#1f2a33]/60">
              This is a starting point worked out from your own answers, not a guaranteed personalised recommendation. ₹0 is a perfectly fine answer too.
            </p>
          </div>

          {/* 4. Slider */}
          <h2 className="mt-12 text-2xl font-black tracking-tight md:text-3xl">How much would you like to invest each month?</h2>
          <div className="mt-4 rounded-[1.8rem] border-[3px] border-[#1f2a33] bg-[#E7BD52] p-5 shadow-[6px_6px_0_#1f2a33]">
            <p aria-live="polite" className="text-[clamp(2.6rem,7vw,4.6rem)] font-black leading-none">
              <AnimatedAmount value={monthly} format={formatINR} />
              <span className="text-xl font-black opacity-70"> / month</span>
            </p>

            <div className="relative mt-8">
              {invest > 0 && sug.amount > 0 && (
                <span
                  aria-hidden="true"
                  style={{ left: `calc(12px + (100% - 24px) * ${sug.amount / invest})` }}
                  className="pointer-events-none absolute -top-5 -translate-x-1/2 whitespace-nowrap text-[0.65rem] font-black uppercase tracking-wider"
                >
                  ▼ suggested
                </span>
              )}
              <input
                type="range"
                aria-label="Monthly investment amount"
                aria-valuetext={`${formatINR(monthly)} per month`}
                min={0}
                max={sliderMax}
                step={step}
                value={monthly}
                disabled={invest === 0}
                onChange={(e) => setMonthly(Number(e.target.value))}
                className={`h-10 w-full cursor-pointer accent-[#C04C37] disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
              />
              <div className="flex justify-between text-xs font-bold">
                <span>₹0</span>
                <span>Budget limit {formatINR(invest)}</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-start gap-3">
              <div className="w-48 max-w-full">
                <label htmlFor="monthly-input" className="text-xs font-bold uppercase tracking-widest">
                  Or type an amount
                </label>
                <MoneyInput
                  id="monthly-input"
                  value={monthly}
                  emptyIsZero
                  onChange={(v) => setMonthly(v ?? 0)}
                  boxClassName="min-h-12 rounded-xl border-[3px] border-[#1f2a33] bg-[#F8F0DE] px-3 focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[#245D91]"
                  prefixClassName="text-xl font-black text-[#C04C37]"
                  inputClassName="text-xl font-black px-1"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setCapped(false);
                  setPlan((p) => ({ ...p, monthly: null }));
                }}
                className={`mt-5 min-h-12 cursor-pointer rounded-full border-[3px] border-[#1f2a33] bg-[#F8F0DE] px-5 text-sm font-black shadow-[3px_3px_0_#1f2a33] ${FOCUS}`}
              >
                Reset to suggested
              </button>
            </div>

            <div aria-live="polite" className="mt-2 min-h-6 text-sm font-bold">
              {capped && <p>That&apos;s above your investment budget, so we&apos;ve stopped at {formatINR(invest)}. See the note below if you want to invest more.</p>}
              {!capped && monthly > sug.amount && monthly <= invest && sug.amount < invest && (
                <p>That&apos;s above our starting suggestion but within your budget. Make sure you&apos;re comfortable with it.</p>
              )}
              {invest === 0 && <p>You haven&apos;t allocated anything to investing. Revise your budget, or just keep exploring without investing.</p>}
            </div>

            <button
              type="button"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((o) => !o)}
              className={`mt-2 min-h-11 cursor-pointer rounded-full px-3 text-sm font-black underline decoration-wavy underline-offset-4 ${FOCUS}`}
            >
              Want to invest more than your current budget?
            </button>
            <AnimatePresence initial={false}>
              {moreOpen && (
                <motion.div
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 rounded-2xl border-[3px] border-dashed border-[#1f2a33] bg-[#F8F0DE] p-4 text-sm leading-snug">
                    <p className="font-bold">
                      Every extra rupee has to come from somewhere else: fun money, emergency savings or essentials. We won&apos;t move money for you.
                    </p>
                    <p className="mt-1">
                      You can revise your budget yourself so every rupee still has a job, then come back here. Your slider and assumptions will be waiting.
                    </p>
                    <button
                      type="button"
                      onClick={reviseBudget}
                      className={`mt-3 min-h-12 cursor-pointer rounded-full border-[3px] border-[#1f2a33] bg-[#245D91] px-5 text-sm font-black text-[#F8F0DE] shadow-[3px_3px_0_#1f2a33] ${FOCUS}`}
                    >
                      Revise my budget<Arrow dir="right" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 5. Projection */}
          <h2 className="mt-14 text-3xl font-black tracking-tight md:text-4xl">What could your money grow into?</h2>
          <p className="mt-2 text-sm font-semibold text-[#1f2a33]/75">
            Hypothetical illustrations, not forecasts. Investments can lose value, actual returns vary, and fees, taxes and inflation affect outcomes.
          </p>

          <div role="radiogroup" aria-label="Investment duration" className="mt-4 flex flex-wrap gap-2">
            {DURATIONS.map((y) => (
              <button
                key={y}
                type="button"
                role="radio"
                aria-checked={plan.years === y}
                onClick={() => setPlan((p) => ({ ...p, years: y }))}
                className={`min-h-11 min-w-16 cursor-pointer rounded-full border-[3px] border-[#1f2a33] px-4 text-sm font-black shadow-[3px_3px_0_#1f2a33] ${
                  plan.years === y ? "bg-[#1f2a33] text-[#F8F0DE]" : "bg-[#fffaf0]"
                } ${FOCUS}`}
              >
                {y} years
              </button>
            ))}
          </div>

          <div role="radiogroup" aria-label="Hypothetical return scenario" className="mt-4 grid gap-3 sm:grid-cols-2">
            {results.map((r) => {
              const on = plan.scenario === r.id;
              return (
                <motion.button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPlan((p) => ({ ...p, scenario: r.id }))}
                  whileHover={reduce ? undefined : { y: -4 }}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  style={{ backgroundColor: r.bg, color: r.fg }}
                  className={`cursor-pointer rounded-[1.6rem] border-[3px] border-[#1f2a33] p-4 text-left ${on ? "shadow-[8px_8px_0_#1f2a33]" : "shadow-[4px_4px_0_#1f2a33]"} ${FOCUS}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-widest">{r.label}</span>
                    {on && <span aria-hidden="true">✓</span>}
                  </span>
                  <span className="mt-1 block text-xs font-bold opacity-90">
                    Assumed annual return: {pct(r.rate)} (hypothetical)
                  </span>
                  <span className="mt-2 block text-[0.65rem] font-bold uppercase tracking-wider opacity-80">Illustrative future value</span>
                  <span className="block text-3xl font-black leading-tight">
                    <AnimatedAmount value={Math.round(r.value)} format={formatINR} />
                  </span>
                  <span className="mt-2 block space-y-0.5 text-xs font-semibold">
                    <span className="flex justify-between gap-2">
                      <span>Monthly contribution</span>
                      <span>{formatINR(monthly)}</span>
                    </span>
                    <span className="flex justify-between gap-2">
                      <span>Total contributed</span>
                      <span>{formatINR(r.contributed)}</span>
                    </span>
                    <span className="flex justify-between gap-2">
                      <span>Duration</span>
                      <span>{plan.years} years</span>
                    </span>
                    <span className="flex justify-between gap-2 font-black">
                      <span>{diffLabel(r.difference)}</span>
                      <span>{Math.abs(r.difference) < 0.5 ? formatINR(0) : signed(Math.round(r.difference))}</span>
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>

          {plan.scenario === "custom" && (
            <div className="mt-3 max-w-xs">
              <label htmlFor="rate-input" className="text-sm font-bold">
                Annual return assumption (%), can be 0 or negative
              </label>
              <input
                id="rate-input"
                inputMode="decimal"
                autoComplete="off"
                value={rateRaw}
                aria-invalid={rateErr !== null}
                aria-describedby="rate-err"
                onChange={(e) => onRate(e.target.value)}
                className="mt-1 min-h-12 w-full rounded-xl border-[3px] border-[#1f2a33] bg-[#fffaf0] px-3 text-xl font-black outline-none focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#245D91]"
              />
              <p id="rate-err" role="alert" className="min-h-5 text-xs font-semibold text-[#C04C37]">
                {rateErr}
              </p>
            </div>
          )}

          <div className="mt-5 rounded-[1.6rem] border-[3px] border-[#1f2a33] bg-[#fffaf0] p-4">
            <ProjectionChart points={points} />
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-3 w-3 rounded-sm border-2 border-[#1f2a33] bg-[#245D91]" /> Total contributions
              </span>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-3 w-3 rounded-sm border-2 border-[#1f2a33] bg-[#39795A]" /> Hypothetical growth
              </span>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-3 w-3 rounded-sm border-2 border-[#1f2a33] bg-[#C04C37]" /> Hypothetical shortfall
              </span>
              <span className="text-[#1f2a33]/60">Years along the bottom</span>
            </div>
            <p className="mt-2 text-xs font-medium text-[#1f2a33]/70">
              Method: contributions at the end of each month; the annual assumption is converted to an effective monthly rate. Fees, taxes, inflation, withdrawals and missed payments are ignored.
              {chosen && ` Choosing “${chosen.name}” doesn't set a return. The scenarios above stay hypothetical.`}
            </p>
          </div>

          {/* 7. Summary */}
          <h2 className="mt-14 text-3xl font-black tracking-tight md:text-4xl">Here&apos;s your current plan.</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <SumRow label="Selected route" value={isSteady ? "The steadier route 🌱" : "The adventurous route 🚀"} />
            <SumRow label="Category in plan" value={chosen ? chosen.name : "None picked yet (optional)"} />
            <SumRow label="Planned monthly investment" value={`${formatINR(monthly)}/month`} />
            <SumRow label="Share of monthly income" value={income > 0 ? pct((monthly / income) * 100) : "—"} />
            <SumRow label="Planned annual contributions" value={formatINR(monthly * 12)} />
            <SumRow label="Projection duration" value={`${plan.years} years`} />
            <SumRow
              label="Hypothetical future-value range"
              value={`${formatINR(Math.round(range.low))} – ${formatINR(Math.round(range.high))}`}
              note={`Under the ${SCENARIO_RATES.low}% and ${SCENARIO_RATES.high}% illustrations. Not a forecast.`}
            />
            <SumRow label="Actual contributions so far" value={formatINR(0)} note="Nothing has been invested. This plan is only on paper." />
          </dl>

          {/* 8. Actions */}
          {!balanced && (
            <p role="alert" className="mt-6 rounded-2xl bg-[#C04C37] px-4 py-3 text-sm font-bold text-[#F8F0DE]">
              {remaining < 0
                ? `Your budget is ${formatINR(-remaining)} over your income.`
                : `${formatINR(remaining)} of your income is still unassigned.`}{" "}
              Balance your budget before confirming the plan.
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={!balanced}
              onClick={() => goTo("verdict")}
              className={`min-h-14 rounded-full border-[3px] border-[#1f2a33] px-7 text-sm font-black tracking-wider transition-all sm:text-base ${
                balanced
                  ? "cursor-pointer bg-[#C04C37] text-[#F8F0DE] shadow-[5px_5px_0_#1f2a33] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
                  : "cursor-not-allowed border-[#1f2a33]/25 bg-[#1f2a33]/10 text-[#1f2a33]/40"
              } ${FOCUS}`}
            >
              LET&apos;S BUILD MY PLAN <Arrow />
            </button>
            <button
              type="button"
              onClick={() => goTo("route")}
              className={`min-h-14 cursor-pointer rounded-full border-[3px] border-[#1f2a33] bg-[#E7BD52] px-6 text-sm font-black tracking-wider shadow-[4px_4px_0_#1f2a33] ${FOCUS}`}
            >
              COMPARE OTHER OPTIONS
            </button>
            <button
              type="button"
              onClick={reviseBudget}
              className={`min-h-12 cursor-pointer rounded-full px-4 font-bold underline decoration-[#245D91] decoration-wavy underline-offset-4 ${FOCUS}`}
            >
              CHANGE MY BUDGET
            </button>
          </div>
          <p className="mt-3 text-xs font-semibold text-[#1f2a33]/60">
            {profile.horizon || profile.goal
              ? `Based on your answers${profile.goal ? ` (goal: ${labelOf("goal", profile.goal).toLowerCase()})` : ""}${profile.horizon ? ` (needed: ${labelOf("horizon", profile.horizon).toLowerCase()})` : ""}.`
              : "Tip: the quick check-in on the previous screens can sharpen this suggestion."}
          </p>
        </div>
      </div>
    </div>
  );
}

function SumRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border-[3px] border-[#1f2a33] bg-[#fffaf0] px-4 py-3 shadow-[3px_3px_0_#1f2a33]">
      <dt className="text-[0.65rem] font-bold uppercase tracking-widest text-[#C04C37]">{label}</dt>
      <dd className="text-lg font-black leading-tight">{value}</dd>
      {note && <p className="mt-0.5 text-xs font-medium text-[#1f2a33]/65">{note}</p>}
    </div>
  );
}
