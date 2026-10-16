"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import CharacterVideo from "@/components/CharacterVideo";
import { Arrow, ART_STATIC, BackButton, Coin, FOCUS, GRID_CENTER, Squiggle, Star } from "@/components/SceneParts";
import { useJourney, type ProfileAnswers } from "@/lib/journey";

type QKey = keyof ProfileAnswers;

const QUESTIONS: { key: QKey; q: string; options: { id: string; label: string }[] }[] = [
  {
    key: "horizon",
    q: "When might you need this money?",
    options: [
      { id: "lt1", label: "Within a year" },
      { id: "1to3", label: "In 1–3 years" },
      { id: "3to7", label: "In 3–7 years" },
      { id: "7plus", label: "7+ years from now" },
      { id: "unsure", label: "I'm not sure" },
    ],
  },
  {
    key: "emergency",
    q: "Do you have emergency savings?",
    options: [
      { id: "yes", label: "Yes, a few months of expenses" },
      { id: "some", label: "A little" },
      { id: "no", label: "Not yet" },
    ],
  },
  {
    key: "loss",
    q: "If an investment dropped a lot in value, what would you most likely do?",
    options: [
      { id: "sell", label: "Sell, to stop the losses" },
      { id: "worry", label: "Worry, but wait it out" },
      { id: "stay", label: "Stay put, maybe even add more" },
      { id: "unsure", label: "I'm not sure" },
    ],
  },
  {
    key: "goal",
    q: "What's the money for?",
    options: [
      { id: "purchase", label: "A big purchase (laptop, trip)" },
      { id: "study", label: "Studies or early career" },
      { id: "wealth", label: "Long-term wealth" },
      { id: "cushion", label: "A rainy-day cushion" },
      { id: "unsure", label: "I'm not sure" },
    ],
  },
];

export const labelOf = (key: QKey, id?: string) =>
  QUESTIONS.find((q) => q.key === key)?.options.find((o) => o.id === id)?.label ?? "";

/** Balanced read-out. Uncertainty never pushes someone towards the riskier route. */
export function assess(a: ProfileAnswers) {
  const caution: string[] = [];
  if (a.horizon === "lt1" || a.horizon === "1to3") caution.push("you may need the money in the next few years, so big swings could land at a bad time");
  if (a.horizon === "unsure") caution.push("you're not sure when you'll need it");
  if (a.emergency === "no") caution.push("you don't have emergency savings yet, and building those first often comes before taking market risk");
  if (a.loss === "sell") caution.push("a large fall would likely make you sell, which can turn a temporary drop into a real loss");
  if (a.loss === "unsure") caution.push("you're not sure how you'd react to a big fall");
  if (a.goal === "purchase" || a.goal === "cushion") caution.push("this goal has a fairly defined date or purpose where stability matters");

  const longTerm = a.horizon === "3to7" || a.horizon === "7plus";
  const cushioned = a.emergency === "yes" || a.emergency === "some";
  const steadyReaction = a.loss === "worry" || a.loss === "stay";

  if (caution.length > 0) {
    return {
      title: "The steadier route looks like a sensible place to start.",
      lean: "steady" as const,
      body: "That isn't a verdict on you. It's because:",
      points: caution,
    };
  }
  if (longTerm && cushioned && steadyReaction) {
    return {
      title: "Both routes are worth understanding, and the adventurous one may be worth researching for money you won't touch for years.",
      lean: "both" as const,
      body: "From your answers:",
      points: [
        "your goal is a few years or more away",
        "you have some emergency savings in place",
        "you'd likely wait out a drop rather than rush to sell",
        "even so, growth funds can fall sharply and nothing is guaranteed, so keep money you may need soon in steadier places",
      ],
    };
  }
  return {
    title: "A bit of both could be worth comparing.",
    lean: "both" as const,
    body: "Your answers point in different directions, which is normal. Read both routes and see which trade-offs you're comfortable with.",
    points: [],
  };
}

export default function ProfileScene() {
  const { profile, setProfile, goTo, setRoute } = useJourney();
  const reduce = useReducedMotion();
  const answered = QUESTIONS.filter((q) => profile[q.key]).length;
  const [step, setStep] = useState(() => (answered === QUESTIONS.length ? QUESTIONS.length : Math.min(answered, QUESTIONS.length - 1)));
  const [reactKey, setReactKey] = useState(0);

  const done = step >= QUESTIONS.length;
  const current = QUESTIONS[Math.min(step, QUESTIONS.length - 1)];
  const result = done ? assess(profile) : null;

  const answer = (id: string) => {
    setProfile((p) => ({ ...p, [current.key]: id }));
    setReactKey((k) => k + 1);
    setTimeout(() => setStep((s) => s + 1), reduce ? 0 : 250);
  };

  const back = () => {
    if (done) return setStep(QUESTIONS.length - 1);
    if (step > 0) return setStep(step - 1);
    goTo("route");
  };

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-[#F8F0DE] text-[#1f2a33]">
      <BackButton onClick={back} />

      <div className={GRID_CENTER}>
        <div className={ART_STATIC}>
          <div aria-hidden="true" className="absolute inset-x-[4%] bottom-[4%] top-[8%] rounded-[54%_46%_58%_42%/45%_55%_45%_55%] bg-[#E7BD52]" />
          <div className="absolute inset-0">
            <CharacterVideo reactKey={reactKey} />
          </div>
          <Coin className="left-[6%] top-[6%]" delay={0.4} />
          <Star className="right-[10%] top-[4%]" color="#C04C37" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C04C37]">Quick check-in · no right answers</p>

          {!done ? (
            <>
              <div className="mt-3 flex items-center gap-2" role="progressbar" aria-valuemin={1} aria-valuemax={QUESTIONS.length} aria-valuenow={step + 1} aria-label="Question progress">
                {QUESTIONS.map((q, i) => (
                  <span
                    key={q.key}
                    className={`h-3 flex-1 rounded-full border-[2.5px] border-[#1f2a33] ${i < step ? "bg-[#39795A]" : i === step ? "bg-[#E7BD52]" : "bg-[#fffaf0]"}`}
                  />
                ))}
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={current.key}
                  initial={reduce ? false : { opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.25 }}
                >
                  <h1 className="mt-5 text-[clamp(1.9rem,4.4vw,3.4rem)] font-black leading-[1] tracking-tight">{current.q}</h1>
                  <div role="radiogroup" aria-label={current.q} className="mt-6 grid gap-3 sm:grid-cols-2">
                    {current.options.map((o, i) => {
                      const selected = profile[current.key] === o.id;
                      return (
                        <motion.button
                          key={o.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => answer(o.id)}
                          whileHover={reduce ? undefined : { y: -4, rotate: i % 2 ? 1 : -1 }}
                          whileTap={reduce ? undefined : { scale: 0.97 }}
                          transition={{ type: "spring", stiffness: 420, damping: 12 }}
                          className={`min-h-16 cursor-pointer rounded-[1.4rem] border-[3px] border-[#1f2a33] px-4 py-3 text-left text-base font-black ${
                            selected ? "bg-[#245D91] text-[#F8F0DE] shadow-[6px_6px_0_#1f2a33]" : "bg-[#fffaf0] shadow-[4px_4px_0_#1f2a33]"
                          } ${FOCUS}`}
                        >
                          {o.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
              <p className="mt-6 text-sm font-semibold text-[#1f2a33]/60">
                Question {step + 1} of {QUESTIONS.length}. Nothing here is saved beyond this prototype.
              </p>
            </>
          ) : (
            result && (
              <motion.div initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="mt-3 text-[clamp(1.9rem,4.2vw,3.2rem)] font-black leading-[1] tracking-tight">
                  <span className="relative inline-block text-[#39795A]">
                    {result.title}
                    <Squiggle className="absolute -bottom-2 left-0 h-2.5 w-full" color="#E7BD52" />
                  </span>
                </h1>
                <p className="mt-5 text-base font-medium text-[#1f2a33]/80 md:text-lg">{result.body}</p>
                {result.points.length > 0 && (
                  <ul className="mt-3 space-y-2 text-base font-semibold">
                    {result.points.map((p) => (
                      <li key={p} className="flex gap-2">
                        <span aria-hidden="true" className="text-[#C04C37]">
                          ✦
                        </span>
                        <span className="first-letter:uppercase">{p}.</span>
                      </li>
                    ))}
                  </ul>
                )}

                <details className="mt-5 rounded-2xl border-[3px] border-[#1f2a33] bg-[#fffaf0] p-4">
                  <summary className={`cursor-pointer text-sm font-black ${FOCUS}`}>Your answers</summary>
                  <ul className="mt-2 space-y-1 text-sm">
                    {QUESTIONS.map((q) => (
                      <li key={q.key}>
                        <span className="font-bold">{q.q}</span> {labelOf(q.key, profile[q.key])}
                      </li>
                    ))}
                  </ul>
                </details>

                <p className="mt-4 text-xs font-semibold text-[#1f2a33]/60">
                  This is a general learning aid, not personal financial advice. You can open either route.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRoute("steady");
                      goTo("steady");
                    }}
                    className={`min-h-14 cursor-pointer rounded-full border-[3px] border-[#1f2a33] px-6 text-sm font-black tracking-wider shadow-[5px_5px_0_#1f2a33] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none ${
                      result.lean === "steady" ? "bg-[#39795A] text-[#F8F0DE]" : "bg-[#E7BD52]"
                    } ${FOCUS}`}
                  >
                    EXPLORE THE STEADIER ROUTE <Arrow />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRoute("adventure");
                      goTo("adventure");
                    }}
                    className={`min-h-14 cursor-pointer rounded-full border-[3px] border-[#1f2a33] bg-[#fffaf0] px-6 text-sm font-black tracking-wider shadow-[5px_5px_0_#1f2a33] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none ${FOCUS}`}
                  >
                    EXPLORE THE ADVENTUROUS ROUTE <Arrow />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className={`mt-3 min-h-12 cursor-pointer rounded-full px-4 font-bold underline decoration-[#245D91] decoration-wavy underline-offset-4 ${FOCUS}`}
                >
                  Change my answers
                </button>
              </motion.div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
