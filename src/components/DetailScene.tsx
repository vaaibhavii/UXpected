"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import CharacterVideo from "@/components/CharacterVideo";
import { Arrow, ART, BackButton, Coin, FOCUS, GRID_TALL, Squiggle, Star } from "@/components/SceneParts";
import { formatINR, useJourney } from "@/lib/journey";

const INK = "#1f2a33";

interface Topic {
  id: string;
  title: string;
  tag: string;
  how: string;
  why: string;
  risks: string[];
  fits: string;
  more: string;
  bg: string;
  fg: string;
}

const STEADY: Topic[] = [
  {
    id: "savings",
    title: "Savings account",
    tag: "Easy access",
    how: "A bank account that pays interest on your balance. You can usually add or withdraw money whenever you like.",
    why: "A natural home for money you might need soon, like your emergency cushion.",
    risks: [
      "Interest rates and account terms vary by bank and can change.",
      "Interest may not keep up with rising prices (inflation), and tax can apply.",
    ],
    fits: "Money you may need within the next few months, or at short notice.",
    more: "Some countries insure bank deposits up to a limit, but the limit and coverage differ by country and bank. We haven't verified them for your bank here, so check your bank's published deposit-protection terms before relying on them.",
    bg: "#39795A",
    fg: "#F8F0DE",
  },
  {
    id: "fd",
    title: "Fixed deposit",
    tag: "Set aside for a term",
    how: "You place a sum with a bank for an agreed term. At the end, you get the money back along with the interest.",
    why: "The interest terms are often known upfront, depending on the product, so you can see what you're agreeing to.",
    risks: [
      "Taking money out early can mean a penalty or a lower rate.",
      "Terms differ between banks and deposit types, so each one needs reading.",
      "Money inside isn't as freely available as in a savings account.",
    ],
    fits: "Money you won't need for a defined period, such as a planned expense in a year or two.",
    more: "Compare the term, how interest is paid, the early-withdrawal rules and the tax treatment for the specific deposit. Not all deposits work identically, so rely on the institution's own terms.",
    bg: "#E7BD52",
    fg: INK,
  },
  {
    id: "other",
    title: "Other lower-volatility options",
    tag: "It depends",
    how: "A wider group, such as some debt-oriented funds or government-backed savings schemes. Each one has its own rules.",
    why: "They may suit goals where you'd like smaller swings than shares, with different trade-offs on access and returns.",
    risks: [
      "Not the same as a guaranteed bank deposit. Debt funds can still lose value, for example when interest rates move or a borrower fails to pay.",
      "Lock-ins, taxes and fees vary by product.",
      "Suitability depends on your goal, time horizon, and how quickly you may need the money.",
    ],
    fits: "Goals a few years away, once you've compared each product's terms.",
    more: "Read the product's official documents. If something is described as low-risk, ask what exactly that means and what could go wrong.",
    bg: "#fffaf0",
    fg: INK,
  },
];

const ADVENTURE: Topic[] = [
  {
    id: "index",
    title: "Broad-market index funds",
    tag: "Tracks a market index",
    how: "A fund that aims to track a market index, holding many of the same companies in similar proportions.",
    why: "It spreads your money across many companies in one purchase, using simple, rule-based holdings.",
    risks: [
      "Still carries market risk. If the market falls, the fund can fall with it.",
      "Costs and tracking differences mean results can differ a little from the index.",
    ],
    fits: "Long-term goals, many years away, with money you can leave invested through downturns.",
    more: "Different indices cover different slices of the market. Check which index a fund follows, what it holds and what it costs. Past performance doesn't predict future results.",
    bg: "#245D91",
    fg: "#F8F0DE",
  },
  {
    id: "flexi",
    title: "Flexi-cap mutual funds",
    tag: "Manager decides the mix",
    how: "A fund manager can invest across large, mid and small companies, and change the mix over time.",
    why: "Some people like one fund that can span company sizes and adapt as conditions change.",
    risks: [
      "Results depend on the manager's strategy, holdings and market conditions.",
      "It can underperform its benchmark and can lose value.",
      "Two flexi-cap funds can look quite different inside.",
    ],
    fits: "Long-term goals, once you've read what a specific fund holds and how it's run.",
    more: "Look at the fund's stated strategy, holdings, costs and how it behaved in bad years, not only good ones.",
    bg: "#C04C37",
    fg: "#F8F0DE",
  },
  {
    id: "small",
    title: "Small-cap mutual funds",
    tag: "Particularly volatile",
    how: "A fund focused on smaller companies, which tend to be less established than big ones.",
    why: "Smaller companies have more room to grow, which is why some investors research them for the long term.",
    risks: [
      "Can be particularly volatile, with sharp falls.",
      "May experience substantial losses, and recovery can take a long time.",
      "Not automatically suitable for a beginner just because the growth potential sounds attractive.",
    ],
    fits: "Only long horizons, and only money you can afford to see drop a lot. Many people keep it to a small part of a wider plan.",
    more: "Higher risk doesn't mean higher realised returns. It means a wider range of possible outcomes, including poor ones.",
    bg: "#E7BD52",
    fg: INK,
  },
];

type TabId = "how" | "why" | "risks" | "fits" | "more";

const TABS: { id: TabId; label: string }[] = [
  { id: "how", label: "How it works" },
  { id: "why", label: "Why consider it" },
  { id: "risks", label: "Key risks" },
  { id: "fits", label: "Goal & time horizon" },
  { id: "more", label: "Worth checking" },
];

const STEADY_HORIZONS = [
  { id: "months", label: "Within months" },
  { id: "years", label: "In 1–3 years" },
  { id: "later", label: "3+ years away" },
];
const ADVENTURE_HORIZONS = [
  { id: "short", label: "Under 3 years" },
  { id: "mid", label: "3–7 years" },
  { id: "long", label: "7+ years" },
];

/** Which timeframes people usually research each category for. A prompt for thinking, not advice. */
const STEADY_FIT: Record<string, string[]> = {
  savings: ["months", "years"],
  fd: ["years"],
  other: ["years", "later"],
};
const ADVENTURE_FIT: Record<string, string[]> = {
  index: ["long"],
  flexi: ["mid", "long"],
  small: ["long"],
};

function TopicArt({ id }: { id: string }) {
  const s = { stroke: INK, strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg aria-hidden="true" viewBox="0 0 56 56" className="h-14 w-14 shrink-0">
      {id === "savings" && (
        <>
          <rect x="10" y="14" width="36" height="38" rx="10" fill="#F8F0DE" {...s} />
          <rect x="14" y="6" width="28" height="9" rx="4" fill="#C04C37" {...s} />
          <circle cx="28" cy="34" r="9" fill="#E7BD52" {...s} />
        </>
      )}
      {id === "fd" && (
        <>
          <path d="M17 24 V18 A11 11 0 0 1 39 18 V24" fill="none" {...s} />
          <rect x="10" y="24" width="36" height="26" rx="6" fill="#C04C37" {...s} />
          <circle cx="28" cy="37" r="3.5" fill="#F8F0DE" {...s} />
        </>
      )}
      {id === "other" && (
        <>
          <path d="M28 8 V48 M16 48 H40 M10 18 H46" fill="none" {...s} />
          <path d="M6 30 L10 18 L14 30 Z M42 30 L46 18 L50 30 Z" fill="#E7BD52" {...s} />
        </>
      )}
      {id === "index" && (
        <>
          <rect x="6" y="32" width="10" height="18" fill="#F8F0DE" {...s} />
          <rect x="23" y="22" width="10" height="28" fill="#E7BD52" {...s} />
          <rect x="40" y="10" width="10" height="40" fill="#F8F0DE" {...s} />
        </>
      )}
      {id === "flexi" && (
        <>
          <circle cx="18" cy="34" r="13" fill="#E7BD52" {...s} />
          <circle cx="38" cy="22" r="9" fill="#F8F0DE" {...s} />
          <circle cx="40" cy="42" r="5" fill="#245D91" {...s} />
        </>
      )}
      {id === "small" && (
        <>
          <path d="M6 46 L18 28 L26 38 L38 14 L50 8" fill="none" {...s} />
          <circle cx="50" cy="8" r="4" fill="#C04C37" {...s} />
        </>
      )}
    </svg>
  );
}

export default function DetailScene({ kind }: { kind: "steady" | "adventure" }) {
  const { budget, goTo } = useJourney();
  const reduce = useReducedMotion();
  const steady = kind === "steady";
  const topics = steady ? STEADY : ADVENTURE;
  const invest = budget.amounts.invest;
  const horizons = steady ? STEADY_HORIZONS : ADVENTURE_HORIZONS;
  const fitMap = steady ? STEADY_FIT : ADVENTURE_FIT;

  const [selected, setSelected] = useState<string>(topics[0].id);
  const [tab, setTab] = useState<TabId>("how");
  const [seen, setSeen] = useState<string[]>([topics[0].id]);
  const [horizon, setHorizon] = useState<string | null>(null);

  const current = topics.find((t) => t.id === selected) ?? topics[0];
  const fitsNow = (id: string) => horizon !== null && (fitMap[id] ?? []).includes(horizon);
  const noneFit = horizon !== null && topics.every((t) => !fitsNow(t.id));

  const pick = (id: string) => {
    setSelected(id);
    setTab("how");
    setSeen((s) => (s.includes(id) ? s : [...s, id]));
  };

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = TABS[(i + dir + TABS.length) % TABS.length];
    setTab(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-[#F8F0DE] text-[#1f2a33]">
      <BackButton onClick={() => goTo("route")} />

      <div className={GRID_TALL}>
        <div className={ART}>
          <div
            aria-hidden="true"
            style={{ backgroundColor: steady ? "#39795A" : "#245D91" }}
            className="absolute inset-x-[4%] bottom-[4%] top-[8%] rounded-[46%_54%_42%_58%/55%_45%_55%_45%]"
          />
          <div className="absolute inset-0">
            <CharacterVideo />
          </div>
          <Coin className="left-[6%] top-[6%]" delay={0.4} />
          <Star className="right-[10%] top-[4%]" color={steady ? "#E7BD52" : "#C04C37"} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C04C37]">
            {steady ? "The steadier route 🌱" : "The adventurous route 🚀"}
          </p>
          <h1 className="mt-2 text-[clamp(2.1rem,5vw,4rem)] font-black leading-[0.97] tracking-tight">
            <span className={`relative inline-block ${steady ? "text-[#39795A]" : "text-[#245D91]"}`}>
              {steady ? "Let's build your money cushion." : "Ready to explore the growth route?"}
              <Squiggle className="absolute -bottom-2 left-0 h-2.5 w-full" color={steady ? "#E7BD52" : "#C04C37"} />
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base font-medium text-[#1f2a33]/80 md:text-lg">
            {steady
              ? "Before chasing growth, let's understand the options designed for stability and access."
              : "These investments can offer long-term growth potential, but they can also fall sharply. Let's understand what you're signing up for."}
          </p>
          <p className="mt-4 inline-block -rotate-1 rounded-2xl border-[3px] border-[#1f2a33] bg-[#fffaf0] px-4 py-2 text-sm font-bold shadow-[3px_3px_0_#1f2a33]">
            {invest > 0 ? (
              <>
                Your planned investment budget: <span className="font-black text-[#C04C37]">{formatINR(invest)}/month</span>
              </>
            ) : (
              <>No investment budget planned right now. You can keep learning without committing anything.</>
            )}
          </p>

          {/* 1. When might you need the money? */}
          <div className="mt-6">
            <p id="horizon-label" className="text-sm font-black">
              When might you need this money? <span className="font-semibold text-[#1f2a33]/60">(optional, tap to see which options fit)</span>
            </p>
            <div role="group" aria-labelledby="horizon-label" className="mt-2 flex flex-wrap gap-2">
              {horizons.map((h) => {
                const on = horizon === h.id;
                return (
                  <button
                    key={h.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setHorizon(on ? null : h.id)}
                    className={`min-h-11 cursor-pointer rounded-full border-[3px] border-[#1f2a33] px-4 text-sm font-black shadow-[3px_3px_0_#1f2a33] transition-transform hover:-translate-y-0.5 ${on ? "bg-[#1f2a33] text-[#F8F0DE]" : "bg-[#fffaf0]"} ${FOCUS}`}
                  >
                    {h.label}
                  </button>
                );
              })}
            </div>
            <p aria-live="polite" className="mt-2 min-h-5 text-sm font-semibold">
              {noneFit
                ? steady
                  ? "None of these are usually discussed for that timeframe."
                  : "Money you may need within about 3 years is usually a poor match for funds that can fall sharply. The steadier route may be worth a look."
                : horizon
                  ? "Highlighted options are ones people often research for that timeframe. It's a starting point, not a recommendation."
                  : ""}
            </p>
          </div>

          {/* 2. Pick an option */}
          <div role="group" aria-label="Choose an option to explore" className="mt-3 grid gap-3 sm:grid-cols-3">
            {topics.map((t, i) => {
              const on = selected === t.id;
              const fit = fitsNow(t.id);
              const dim = horizon !== null && !fit;
              return (
                <motion.button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => pick(t.id)}
                  initial={reduce ? false : { opacity: 0, y: 24 }}
                  animate={{ opacity: dim ? 0.55 : 1, y: 0, rotate: on ? 0 : i % 2 ? 0.8 : -0.8 }}
                  whileHover={reduce ? undefined : { y: -4 }}
                  whileTap={reduce ? undefined : { scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18, delay: reduce ? 0 : 0.08 * i }}
                  style={{ backgroundColor: t.bg, color: t.fg }}
                  className={`relative flex cursor-pointer flex-col items-start gap-2 rounded-3xl border-[3px] border-[#1f2a33] p-4 text-left ${on ? "shadow-[7px_7px_0_#1f2a33] ring-4 ring-[#1f2a33]/20" : "shadow-[4px_4px_0_#1f2a33]"} ${FOCUS}`}
                >
                  <TopicArt id={t.id} />
                  <span className="text-lg font-black leading-tight">{t.title}</span>
                  <span className="rounded-full border-[2.5px] border-[#1f2a33] bg-[#F8F0DE] px-2.5 py-0.5 text-[0.65rem] font-black uppercase tracking-wider text-[#1f2a33]">
                    {t.tag}
                  </span>
                  {fit && (
                    <span className="rounded-full bg-[#1f2a33] px-2.5 py-0.5 text-[0.65rem] font-black uppercase tracking-wider text-[#F8F0DE]">
                      Often researched for this
                    </span>
                  )}
                  {seen.includes(t.id) && !on && (
                    <span aria-label="Already explored" className="absolute right-3 top-3 text-sm font-black">
                      ✓
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
          <p className="mt-2 text-xs font-bold text-[#1f2a33]/70">
            Explored {seen.length} of {topics.length}
          </p>

          {/* 3. Details, one section at a time */}
          <section
            aria-label={`${current.title} details`}
            style={{ backgroundColor: current.bg, color: current.fg }}
            className="mt-3 rounded-[1.6rem] border-[3px] border-[#1f2a33] p-5 shadow-[5px_5px_0_#1f2a33]"
          >
            <div role="tablist" aria-label={`About ${current.title}`} className="flex flex-wrap gap-2">
              {TABS.map((t, i) => {
                const on = tab === t.id;
                return (
                  <button
                    key={t.id}
                    id={`tab-${t.id}`}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    aria-controls="detail-panel"
                    tabIndex={on ? 0 : -1}
                    onClick={() => setTab(t.id)}
                    onKeyDown={(e) => onTabKey(e, i)}
                    className={`min-h-11 cursor-pointer rounded-full border-[3px] border-[#1f2a33] px-4 text-xs font-black uppercase tracking-wider text-[#1f2a33] transition-transform hover:-translate-y-0.5 ${on ? "bg-[#F8F0DE] shadow-[3px_3px_0_#1f2a33]" : "bg-[#F8F0DE]/50"} ${FOCUS}`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div id="detail-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-4 min-h-28">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${current.id}-${tab}`}
                  initial={reduce ? false : { opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: -16 }}
                  transition={{ duration: reduce ? 0 : 0.18 }}
                  className="text-base leading-snug md:text-lg"
                >
                  {tab === "how" && <p>{current.how}</p>}
                  {tab === "why" && <p>{current.why}</p>}
                  {tab === "risks" && (
                    <ul className="space-y-2">
                      {current.risks.map((r) => (
                        <li key={r} className="flex gap-2">
                          <span aria-hidden="true">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {tab === "fits" && <p>{current.fits}</p>}
                  {tab === "more" && <p>{current.more}</p>}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t-[3px] border-dashed border-current/40 pt-3">
              <button
                type="button"
                disabled={TABS[0].id === tab}
                onClick={() => setTab(TABS[Math.max(0, TABS.findIndex((x) => x.id === tab) - 1)].id)}
                className={`min-h-11 cursor-pointer rounded-full px-3 text-sm font-black underline underline-offset-4 disabled:cursor-default disabled:opacity-30 ${FOCUS}`}
              >
                <Arrow dir="left" />Previous
              </button>
              <span className="text-xs font-bold opacity-80">
                {TABS.findIndex((x) => x.id === tab) + 1} of {TABS.length}
              </span>
              <button
                type="button"
                disabled={TABS[TABS.length - 1].id === tab}
                onClick={() => setTab(TABS[Math.min(TABS.length - 1, TABS.findIndex((x) => x.id === tab) + 1)].id)}
                className={`min-h-11 cursor-pointer rounded-full px-3 text-sm font-black underline underline-offset-4 disabled:cursor-default disabled:opacity-30 ${FOCUS}`}
              >
                Next<Arrow dir="right" />
              </button>
            </div>
          </section>

          <p className="mt-6 rounded-2xl border-[3px] border-[#1f2a33] bg-[#fffaf0] p-4 text-sm font-bold leading-snug md:text-base">
            {steady
              ? "Lower volatility does not automatically mean risk-free, and the right choice depends on when you need the money."
              : "Long-term investing does not guarantee positive returns. Only consider investing money you can afford to leave invested and potentially lose."}
          </p>
          <p className="mt-2 text-xs font-semibold text-[#1f2a33]/60">
            General education only. These are categories, not personal recommendations, and no live data or fund performance is shown.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => goTo("plan")}
              className={`min-h-14 cursor-pointer rounded-full border-[3px] border-[#1f2a33] bg-[#C04C37] px-7 text-sm font-black tracking-wider text-[#F8F0DE] shadow-[5px_5px_0_#1f2a33] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none sm:text-base ${FOCUS}`}
            >
              {steady ? "BUILD MY STEADIER PLAN" : "EXPLORE MY INVESTMENT OPTIONS"} <Arrow />
            </button>
            <button
              type="button"
              onClick={() => goTo("profile")}
              className={`min-h-12 cursor-pointer rounded-full px-4 font-bold underline decoration-[#245D91] decoration-wavy underline-offset-4 ${FOCUS}`}
            >
              Not sure? Help me figure it out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
