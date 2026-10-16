"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState, type ReactNode } from "react";
import CharacterVideo from "@/components/CharacterVideo";
import Checklist from "@/components/Checklist";
import ProjectionPanel, { rateFor, type ProjectionSettings } from "@/components/ProjectionPanel";
import { Arrow, ART, BackButton, Coin, FOCUS, GRID_TALL, Squiggle, Star } from "@/components/SceneParts";
import { labelOf } from "@/components/ProfileScene";
import { BUDGET_KEYS, formatINR, incomeTotal, useJourney, type SavedPlan } from "@/lib/journey";
import { DATA_NOTE, derivePlan, needsCushion, optionsFor, type RouteKind } from "@/lib/planning";
import { buildDestinations, explainPlan, nextStep, nowISO, rescale, resolveAlloc, stepsFor } from "@/lib/verdict";

const BAR = ["#245D91", "#C04C37", "#39795A", "#E7BD52"];

function Card({ title, id, children, tone = "#fffaf0" }: { title: string; id: string; children: ReactNode; tone?: string }) {
  return (
    <section
      aria-labelledby={id}
      style={{ backgroundColor: tone }}
      className="rounded-[2rem] border-[3px] border-[#1f2a33] p-5 shadow-[6px_6px_0_#1f2a33] sm:p-7"
    >
      <h2 id={id} className="text-[clamp(1.4rem,3vw,2rem)] font-black leading-tight">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function VerdictScene() {
  const { income: inc, savings, budget, route: routeState, profile, plan, draft, setDraft, setSaved, setReturnTo, goTo } = useJourney();
  const reduce = useReducedMotion();
  const [reactKey, setReactKey] = useState(0);
  const [proj, setProj] = useState<ProjectionSettings>({ years: plan.years, scenario: plan.scenario, customRate: plan.customRate });

  const route: RouteKind = routeState === "adventure" ? "adventure" : "steady";
  const steady = route === "steady";
  const income = incomeTotal(inc);
  const a = budget.amounts;
  const allocated = BUDGET_KEYS.reduce((s, k) => s + a[k], 0);
  const invest = a.invest;
  const { monthly } = derivePlan({ invest, route, profile, plan });
  const options = optionsFor(route);
  const savingsKnown = !savings.unknown && savings.amount !== null ? savings.amount : null;
  const lacking = steady && needsCushion(profile, a.emergency);

  /* Destinations: edited draft if there is one, otherwise a default from earlier choices. */
  const defaultIds = useMemo(() => {
    if (steady) return plan.category && plan.category !== "savings" ? ["savings", plan.category] : ["savings"];
    return plan.category ? [plan.category] : [];
  }, [steady, plan.category]);
  const ids = draft.ids ?? defaultIds;

  const defaultAmounts = useMemo(() => {
    if (steady && ids.length === 2) {
      const heavy = lacking || profile.horizon === "lt1" || profile.horizon === "1to3";
      return rescale({ [ids[0]]: heavy ? 60 : 40, [ids[1]]: heavy ? 40 : 60 }, monthly);
    }
    return null;
  }, [steady, ids, lacking, profile.horizon, monthly]);

  const amounts = resolveAlloc(ids, monthly, draft.amounts ?? defaultAmounts);
  const dests = buildDestinations(route, ids, amounts, profile);
  const sum = dests.reduce((s, d) => s + d.amount, 0);
  const noDestination = monthly > 0 && dests.length === 0;
  const mismatch = monthly > 0 && dests.length > 0 && sum !== monthly;
  const overBudget = sum > invest || monthly > invest;
  const unbalancedBudget = income - allocated !== 0;
  const blocked = noDestination || mismatch || overBudget;
  const pctOfIncome = income > 0 ? Math.round((monthly / income) * 1000) / 10 : 0;

  const why = explainPlan({ route, profile, invest, monthly, emergencyAlloc: a.emergency });
  const steps = stepsFor(route);
  const stepState = useJourney().tracking.steps;
  const next = nextStep(steps, stepState);

  const setAmount = (id: string, v: number) => {
    setDraft({ ids, amounts: { ...amounts, [id]: Math.max(0, Math.round(v) || 0) } });
    setReactKey((k) => k + 1);
  };
  const toggleDest = (id: string) => {
    const nextIds = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    setDraft({ ids: nextIds, amounts: null });
  };
  const rebalance = () => setDraft({ ids, amounts: rescale(amounts, monthly) });

  const reviseBudget = () => {
    setReturnTo("verdict");
    goTo("budget");
  };

  const save = () => {
    if (blocked) return;
    const snapshot: SavedPlan = {
      savedAt: nowISO(),
      route,
      monthly,
      income,
      savings: savingsKnown,
      emergencyMonthly: a.emergency,
      emergencyStatus: profile.emergency ?? null,
      essentialsMonthly: a.essentials,
      investBudget: invest,
      goal: profile.goal ?? null,
      horizon: profile.horizon ?? null,
      lossStyle: profile.loss ?? null,
      years: proj.years,
      scenario: proj.scenario,
      rate: rateFor(proj),
      destinations: dests,
    };
    setSaved(snapshot);
    goTo("dashboard");
  };

  const stickers = [
    { label: "Route", value: steady ? "Steadier 🌱" : "Adventurous 🚀", bg: "#245D91", fg: "#F8F0DE", r: -2 },
    { label: "Main goal", value: profile.goal ? labelOf("goal", profile.goal) : "Not set yet", bg: "#E7BD52", fg: "#1f2a33", r: 1.5 },
    { label: "Monthly income", value: formatINR(income), bg: "#fffaf0", fg: "#1f2a33", r: -1 },
    { label: "Current savings", value: savingsKnown === null ? "Not sure yet" : formatINR(savingsKnown), bg: "#fffaf0", fg: "#1f2a33", r: 2 },
    {
      label: "Emergency savings",
      value: profile.emergency ? labelOf("emergency", profile.emergency) : a.emergency > 0 ? `${formatINR(a.emergency)}/month planned` : "None planned yet",
      bg: "#39795A",
      fg: "#F8F0DE",
      r: -1.5,
    },
    { label: "Planned monthly amount", value: formatINR(monthly), bg: "#C04C37", fg: "#F8F0DE", r: 1 },
    { label: "Planned duration", value: `${proj.years} years`, bg: "#E7BD52", fg: "#1f2a33", r: -2 },
  ];

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-[#F8F0DE] text-[#1f2a33]">
      <BackButton onClick={() => goTo("plan")} />

      <div className={GRID_TALL}>
        <div className={ART}>
          <div
            aria-hidden="true"
            style={{ backgroundColor: steady ? "#39795A" : "#245D91" }}
            className="absolute inset-x-[4%] bottom-[4%] top-[8%] rounded-[54%_46%_58%_42%/45%_55%_45%_55%]"
          />
          <div className="absolute inset-0">
            <CharacterVideo reactKey={reactKey} />
          </div>
          <Star className="absolute right-[2%] top-[4%] z-10 h-10 w-10" color="#E7BD52" />
          <Coin className="absolute bottom-[8%] left-[4%] z-10" delay={0.4} />
        </div>

        <main className="min-w-0 space-y-10">
          <header>
            <h1 className="text-[clamp(2rem,5vw,3.6rem)] font-black leading-[1.05]">Alright Aarav. Here&apos;s your money game plan.</h1>
            <Squiggle className="mt-2 w-48" />
            <p className="mt-3 max-w-xl text-lg font-semibold">
              You&apos;ve made your choices. Here&apos;s how you could put your plan into action, one step at a time.
            </p>
          </header>

          <ul aria-label="Your choices so far" className="flex flex-wrap gap-3">
            {stickers.map((s) => (
              <motion.li
                key={s.label}
                initial={reduce ? false : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: s.r }}
                style={{ backgroundColor: s.bg, color: s.fg }}
                className="max-w-full rounded-2xl border-[3px] border-[#1f2a33] px-4 py-2 shadow-[3px_3px_0_#1f2a33]"
              >
                <span className="block text-[0.65rem] font-black uppercase tracking-widest opacity-80">{s.label}</span>
                <span className="block text-base font-black leading-tight">{s.value}</span>
              </motion.li>
            ))}
          </ul>

          <Card title="YOUR MONTHLY MONEY PLAN" id="v-monthly" tone="#E7BD52">
            {monthly > 0 ? (
              <>
                <p className="text-[clamp(2.2rem,6vw,3.6rem)] font-black leading-none">
                  {formatINR(monthly)}
                  <span className="text-xl font-bold"> / month</span>
                </p>
                <p className="mt-2 text-base font-bold">
                  That&apos;s {pctOfIncome}% of your {formatINR(income)} monthly income.
                </p>
              </>
            ) : (
              <p className="text-2xl font-black">Your plan can start with building your savings first.</p>
            )}
            <p className="mt-3 text-sm font-semibold">
              This is your current plan based on the budget and choices you&apos;ve entered. You can change it whenever your circumstances change.
            </p>
            {unbalancedBudget && (
              <p className="mt-2 text-sm font-bold text-[#C04C37]">
                Heads up: your budget isn&apos;t fully balanced ({formatINR(Math.abs(income - allocated))} {income > allocated ? "unplanned" : "over"}).
              </p>
            )}
          </Card>

          <Card title="Here's where every rupee is planned to go." id="v-dest">
            {monthly === 0 ? (
              <p className="font-semibold">There&apos;s nothing to place yet. Once you plan a monthly amount, its destinations will show up here.</p>
            ) : (
              <>
                {!steady && (
                  <p className="mb-3 rounded-2xl bg-[#E7BD52] px-4 py-2 text-sm font-bold">
                    These are categories to research, not confirmed funds. {DATA_NOTE}
                  </p>
                )}
                {noDestination && (
                  <div role="alert" className="mb-3 rounded-2xl border-[3px] border-[#C04C37] bg-[#fffaf0] p-4">
                    <p className="font-black">You haven&apos;t picked a category yet.</p>
                    <p className="text-sm font-semibold">Pick one on your plan screen so each rupee has somewhere to go.</p>
                    <button
                      type="button"
                      onClick={() => goTo("plan")}
                      className={`mt-2 min-h-11 cursor-pointer rounded-full border-[3px] border-[#1f2a33] bg-[#E7BD52] px-5 text-sm font-black shadow-[3px_3px_0_#1f2a33] ${FOCUS}`}
                    >
                      GO TO MY PLAN
                    </button>
                  </div>
                )}

                {dests.length > 0 && (
                  <div
                    role="img"
                    aria-label={`Split of ${formatINR(monthly)}: ${dests.map((d) => `${d.name} ${formatINR(d.amount)}`).join(", ")}`}
                    className="flex h-9 overflow-hidden rounded-full border-[3px] border-[#1f2a33] bg-[#F8F0DE]"
                  >
                    {dests.map((d, i) => (
                      <motion.div
                        key={d.id}
                        layout={!reduce}
                        style={{ width: `${monthly > 0 ? (d.amount / Math.max(sum, monthly)) * 100 : 0}%`, backgroundColor: BAR[i % BAR.length] }}
                        className="border-r-[3px] border-[#1f2a33] last:border-r-0"
                      />
                    ))}
                  </div>
                )}

                <ul className="mt-4 grid gap-4 md:grid-cols-2">
                  {dests.map((d, i) => (
                    <li key={d.id} className="rounded-[1.5rem] border-[3px] border-[#1f2a33] bg-[#F8F0DE] p-4 shadow-[4px_4px_0_#1f2a33]">
                      <p className="flex items-center gap-2 text-lg font-black">
                        <i aria-hidden="true" style={{ backgroundColor: BAR[i % BAR.length] }} className="inline-block h-4 w-4 rounded-full border-2 border-[#1f2a33]" />
                        {d.name}
                      </p>
                      <label htmlFor={`amt-${d.id}`} className="mt-2 block text-xs font-black uppercase tracking-widest">
                        Planned per month (₹)
                      </label>
                      <input
                        id={`amt-${d.id}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={d.amount}
                        onChange={(e) => setAmount(d.id, Number(e.target.value))}
                        className="mt-1 min-h-12 w-full rounded-xl border-[3px] border-[#1f2a33] bg-[#fffaf0] px-3 text-xl font-black outline-none focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#245D91]"
                      />
                      <p className="mt-1 text-sm font-bold">
                        {sum > 0 ? Math.round((d.amount / sum) * 1000) / 10 : 0}% of your planned total
                      </p>
                      <dl className="mt-2 space-y-1 text-sm">
                        <div>
                          <dt className="inline font-black">Why it&apos;s here: </dt>
                          <dd className="inline font-medium">{d.why}</dd>
                        </div>
                        <div>
                          <dt className="inline font-black">Main risk: </dt>
                          <dd className="inline font-medium">{d.risk}</dd>
                        </div>
                        <div>
                          <dt className="inline font-black">Planned duration: </dt>
                          <dd className="inline font-medium">{d.horizon}</dd>
                        </div>
                      </dl>
                      {steady && (
                        <button
                          type="button"
                          onClick={() => toggleDest(d.id)}
                          className={`mt-2 min-h-11 cursor-pointer text-xs font-black underline underline-offset-4 ${FOCUS}`}
                        >
                          Remove this destination
                        </button>
                      )}
                    </li>
                  ))}
                </ul>

                {steady && (
                  <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Add a destination">
                    {options
                      .filter((o) => !ids.includes(o.id))
                      .map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => toggleDest(o.id)}
                          className={`min-h-11 cursor-pointer rounded-full border-[3px] border-[#1f2a33] bg-[#fffaf0] px-4 text-xs font-black shadow-[2px_2px_0_#1f2a33] ${FOCUS}`}
                        >
                          + Add {o.name}
                        </button>
                      ))}
                  </div>
                )}

                <p
                  aria-live="polite"
                  className={`mt-4 text-base font-black ${mismatch || overBudget ? "text-[#C04C37]" : "text-[#39795A]"}`}
                >
                  Destinations add up to {formatINR(sum)} · plan {formatINR(monthly)} · investment budget {formatINR(invest)}
                  {!mismatch && !overBudget && dests.length > 0 ? " ✓ reconciles" : ""}
                </p>
                {mismatch && (
                  <div role="alert" className="mt-2 rounded-2xl border-[3px] border-[#C04C37] bg-[#fffaf0] p-4 text-sm font-semibold">
                    These amounts add up to {formatINR(sum)}, but your plan is {formatINR(monthly)}. Edit the amounts, or let us rebalance them in proportion.
                    <button
                      type="button"
                      onClick={rebalance}
                      className={`mt-2 block min-h-11 cursor-pointer rounded-full border-[3px] border-[#1f2a33] bg-[#E7BD52] px-5 text-sm font-black shadow-[3px_3px_0_#1f2a33] ${FOCUS}`}
                    >
                      REBALANCE TO {formatINR(monthly)}
                    </button>
                  </div>
                )}
                {overBudget && (
                  <div role="alert" className="mt-2 rounded-2xl border-[3px] border-[#C04C37] bg-[#fffaf0] p-4 text-sm font-semibold">
                    This is more than the {formatINR(invest)} you set aside for investing. Lower the amounts, or revise your budget.
                    <button
                      type="button"
                      onClick={reviseBudget}
                      className={`mt-2 block min-h-11 cursor-pointer rounded-full border-[3px] border-[#1f2a33] bg-[#E7BD52] px-5 text-sm font-black shadow-[3px_3px_0_#1f2a33] ${FOCUS}`}
                    >
                      REVISE MY BUDGET
                    </button>
                  </div>
                )}
              </>
            )}
          </Card>

          <Card title="Why this is your plan." id="v-why" tone="#245D91">
            <div className="rounded-2xl bg-[#fffaf0] p-4 text-[#1f2a33]">
              <ul className="list-disc space-y-1.5 pl-5 text-sm font-medium">
                {why.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              {why.conflicts.length > 0 && (
                <div className="mt-3 rounded-xl border-[3px] border-[#C04C37] p-3">
                  <p className="text-sm font-black">Worth a second look</p>
                  <ul className="list-disc pl-5 text-sm font-medium">
                    {why.conflicts.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="mt-3 text-xs font-semibold text-[#1f2a33]/70">
                This explains how your answers shaped the plan. It isn&apos;t a judgement that any option is suitable for you.
              </p>
            </div>
          </Card>

          <Card title="Okay, how do I actually start?" id="v-start">
            <p className="mb-3 text-sm font-semibold">
              {steady
                ? "A deposit checklist for the steadier route. Tick things off as you do them yourself."
                : "A SIP checklist for the adventurous route. Tick things off as you do them yourself."}
            </p>
            <Checklist steps={steps} nextId={next?.id ?? null} />
          </Card>

          <Card title="And what could future-you be looking at?" id="v-future" tone="#fffaf0">
            {monthly > 0 ? (
              <ProjectionPanel monthly={monthly} settings={proj} steady={steady} onChange={(n) => setProj((p) => ({ ...p, ...n }))} />
            ) : (
              <p className="font-semibold">With ₹0 a month planned, there&apos;s nothing to illustrate yet.</p>
            )}
          </Card>

          <Card title="Ready to save this plan?" id="v-confirm" tone="#E7BD52">
            <ul className="grid gap-1 text-sm font-bold sm:grid-cols-2">
              <li>Route: {steady ? "Steadier" : "Adventurous"}</li>
              <li>Monthly plan: {formatINR(monthly)}</li>
              <li>Duration: {proj.years} years</li>
              <li>Projection rate: {rateFor(proj)}% (hypothetical)</li>
              {dests.map((d) => (
                <li key={d.id}>
                  {d.name}: {formatINR(d.amount)}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm font-semibold">
              Saving keeps this plan in this browser so your dashboard can show it. No money is moved and nothing is invested.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={save}
                disabled={blocked}
                aria-describedby={blocked ? "save-why" : undefined}
                className={`min-h-14 cursor-pointer rounded-full border-[3px] border-[#1f2a33] bg-[#C04C37] px-7 text-base font-black tracking-wide text-[#F8F0DE] shadow-[5px_5px_0_#1f2a33] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
              >
                SAVE MY PLAN &amp; MEET MY DASHBOARD <Arrow />
              </button>
              <button
                type="button"
                onClick={() => goTo("plan")}
                className={`min-h-12 cursor-pointer text-sm font-black underline underline-offset-4 ${FOCUS}`}
              >
                CHANGE MY CHOICES
              </button>
            </div>
            {blocked && (
              <p id="save-why" className="mt-2 text-sm font-bold text-[#C04C37]">
                Fix the allocation above to save.
              </p>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}
