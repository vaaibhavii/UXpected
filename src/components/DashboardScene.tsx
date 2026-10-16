"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";
import CharacterVideo from "@/components/CharacterVideo";
import ProjectionPanel, { rateFor, type ProjectionSettings } from "@/components/ProjectionPanel";
import { ART, BackButton, FOCUS, GRID_TALL, Squiggle, Star } from "@/components/SceneParts";
import { formatINR, useJourney, type SavedPlan } from "@/lib/journey";
import { futureValue } from "@/lib/projection";
import {
  DEPOSIT_STEPS,
  fmtDate,
  MILESTONES,
  monthKey,
  nextCheckIn,
  nextStep,
  SIP_STEPS,
  setupStatus,
  todayDate,
  todayISO,
  rescale,
  yearsToReach,
  isoOf,
} from "@/lib/verdict";

const INPUT =
  "min-h-12 w-full rounded-xl border-[3px] border-[#1f2a33] bg-[#fffaf0] px-3 text-lg font-bold outline-none focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#245D91]";
const BTN = `min-h-11 cursor-pointer rounded-full border-[3px] border-[#1f2a33] px-5 text-sm font-black tracking-wide shadow-[3px_3px_0_#1f2a33] ${FOCUS}`;

function Card({ title, id, children, tone = "#fffaf0" }: { title: string; id: string; children: ReactNode; tone?: string }) {
  return (
    <section aria-labelledby={id} style={{ backgroundColor: tone }} className="rounded-4xl border-[3px] border-[#1f2a33] p-5 shadow-[6px_6px_0_#1f2a33] sm:p-7">
      <h2 id={id} className="text-[clamp(1.3rem,3vw,1.9rem)] font-black leading-tight">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const num = (raw: string): number | null => {
  const t = raw.trim();
  if (!/^\d{1,9}$/.test(t)) return null;
  return parseInt(t, 10);
};

const CHANGES = ["Income", "Expenses", "Savings", "Contributions"];
const uid = () => `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;

export default function DashboardScene() {
  const { saved, setSaved, tracking, setTracking, goTo, setReturnTo } = useJourney();
  const reduce = useReducedMotion();
  const [reactKey, setReactKey] = useState(0);

  if (!saved) {
    return (
      <div className="absolute inset-0 overflow-y-auto bg-[#F8F0DE] text-[#1f2a33]">
        <BackButton onClick={() => goTo("verdict")} />
        <main className="mx-auto max-w-xl px-6 pt-32 text-center">
          <h1 className="text-4xl font-black">Your corner is waiting for a plan.</h1>
          <p className="mt-3 font-semibold">Nothing has been saved yet, so there&apos;s nothing to show. Finish your money game plan first.</p>
          <button type="button" onClick={() => goTo("verdict")} className={`${BTN} mt-6 bg-[#E7BD52]`}>
            GO TO MY MONEY PLAN
          </button>
        </main>
      </div>
    );
  }

  return <Dashboard saved={saved} setSaved={setSaved} reduce={!!reduce} reactKey={reactKey} bump={() => setReactKey((k) => k + 1)} tracking={tracking} setTracking={setTracking} goTo={goTo} setReturnTo={setReturnTo} />;
}

type Ctx = ReturnType<typeof useJourney>;

function Dashboard({
  saved,
  setSaved,
  reduce,
  reactKey,
  bump,
  tracking,
  setTracking,
  goTo,
}: {
  saved: SavedPlan;
  setSaved: Ctx["setSaved"];
  reduce: boolean;
  reactKey: number;
  bump: () => void;
  tracking: Ctx["tracking"];
  setTracking: Ctx["setTracking"];
  goTo: Ctx["goTo"];
  setReturnTo: Ctx["setReturnTo"];
}) {
  const steady = saved.route === "steady";
  const contribs = tracking.contributions;
  const totalReported = contribs.reduce((s, c) => s + c.amount, 0);
  const thisMonth = todayISO().slice(0, 7);
  const monthReported = contribs.filter((c) => monthKey(c.date) === thisMonth).reduce((s, c) => s + c.amount, 0);

  /* Status per destination, based only on the user's own checklist ticks. */
  const stepsOf = (kind: "deposit" | "fund") => (kind === "deposit" ? DEPOSIT_STEPS : SIP_STEPS);
  const kinds = Array.from(new Set(saved.destinations.map((d) => d.kind)));
  const pending = kinds.flatMap((k) => {
    const n = nextStep(stepsOf(k), tracking.steps);
    return n ? [{ kind: k, step: n }] : [];
  });
  const firstPending = pending[0] ?? null;

  /* ---- Contributions form ---- */
  const [cDate, setCDate] = useState("");
  const [cAmt, setCAmt] = useState("");
  const [cDest, setCDest] = useState("");
  const [cErr, setCErr] = useState<string | null>(null);
  const addContribution = () => {
    const amt = num(cAmt);
    if (amt === null || amt <= 0) return setCErr("Enter a whole-rupee amount above zero.");
    const date = cDate || todayISO();
    if (date > todayISO()) return setCErr("That date is in the future. Record contributions once you've made them.");
    setCErr(null);
    setTracking((t) => ({ ...t, contributions: [{ id: uid(), date, amount: amt, destId: cDest || null }, ...t.contributions].sort((a, b) => (a.date < b.date ? 1 : -1)) }));
    setCAmt("");
    bump();
  };

  /* ---- Projection explorer (local only) ---- */
  const [exMonthly, setExMonthly] = useState(String(saved.monthly));
  const [ex, setEx] = useState<ProjectionSettings>({ years: saved.years, scenario: saved.scenario, customRate: saved.scenario === "custom" ? saved.rate : 8 });
  const exAmount = num(exMonthly) ?? 0;
  const differs = exAmount !== saved.monthly || ex.years !== saved.years || ex.scenario !== saved.scenario || (ex.scenario === "custom" && ex.customRate !== saved.rate);
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  const [updated, setUpdated] = useState(false);
  const applyUpdate = () => {
    const amts = rescale(Object.fromEntries(saved.destinations.map((d) => [d.id, d.amount])), Math.min(exAmount, saved.investBudget));
    setSaved({
      ...saved,
      monthly: Math.min(exAmount, saved.investBudget),
      years: ex.years,
      scenario: ex.scenario,
      rate: rateFor(ex),
      destinations: saved.destinations.map((d) => ({ ...d, amount: amts[d.id] ?? d.amount })),
    });
    setConfirmUpdate(false);
    setUpdated(true);
  };

  /* ---- Emergency progress ---- */
  const [eBal, setEBal] = useState(tracking.emergencyBalance === null ? "" : String(tracking.emergencyBalance));
  const [eTar, setETar] = useState(tracking.emergencyTarget === null ? "" : String(tracking.emergencyTarget));
  const saveEmergency = () =>
    setTracking((t) => ({ ...t, emergencyBalance: eBal.trim() === "" ? null : num(eBal), emergencyTarget: eTar.trim() === "" ? null : num(eTar) }));
  const eb = tracking.emergencyBalance;
  const et = tracking.emergencyTarget;

  /* ---- Check-in ---- */
  const [changes, setChanges] = useState<string[]>([]);
  const [ciIncome, setCiIncome] = useState("");
  const [ciSavings, setCiSavings] = useState("");
  const [note, setNote] = useState("");
  const [ciMsg, setCiMsg] = useState<string | null>(null);
  const days = Array.from({ length: 28 }, (_, i) => i + 1);
  const upcoming = tracking.checkinDay ? fmtDate(isoOf(nextCheckIn(tracking.checkinDay, todayDate()))) : null;
  const saveCheckin = () => {
    const entry = { id: uid(), date: todayISO(), income: num(ciIncome), savings: num(ciSavings), changes, note: note.trim() };
    setTracking((t) => ({ ...t, checkins: [entry, ...t.checkins] }));
    setChanges([]);
    setCiIncome("");
    setCiSavings("");
    setNote("");
    setCiMsg("Check-in saved with today's date.");
  };
  const lastCheckin = tracking.checkins[0] ?? null;
  const prevWith = (key: "income" | "savings") => tracking.checkins.find((c) => c[key] !== null) ?? null;

  const tiles: { label: string; value: string; note: string; bg: string; fg: string }[] = [
    { label: "Monthly income", value: formatINR(saved.income), note: "From your budget", bg: "#E7BD52", fg: "#1f2a33" },
    { label: "Current savings", value: saved.savings === null ? "Unknown" : formatINR(saved.savings), note: saved.savings === null ? "You weren't sure yet" : "As you entered it", bg: "#fffaf0", fg: "#1f2a33" },
    {
      label: "Emergency savings",
      value: eb !== null ? formatINR(eb) : "Not recorded",
      note: eb !== null ? "Self-reported" : `${formatINR(saved.emergencyMonthly)}/month planned in budget`,
      bg: "#39795A",
      fg: "#F8F0DE",
    },
    { label: "Planned monthly investment", value: formatINR(saved.monthly), note: "A plan, not a transaction", bg: "#C04C37", fg: "#F8F0DE" },
    { label: "Total planned contributions", value: formatINR(saved.monthly * saved.years * 12), note: `Over ${saved.years} years if followed exactly`, bg: "#245D91", fg: "#F8F0DE" },
    { label: "Contributions you've recorded", value: contribs.length ? formatINR(totalReported) : "None yet", note: "Self-reported, not verified", bg: "#fffaf0", fg: "#1f2a33" },
  ];

  const contribPct = saved.monthly > 0 ? Math.min(100, Math.round((monthReported / saved.monthly) * 100)) : 0;

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-[#F8F0DE] text-[#1f2a33]">
      <BackButton onClick={() => goTo("verdict")} />

      <div className={GRID_TALL}>
        <div className={ART}>
          <div aria-hidden="true" className="absolute inset-x-[4%] bottom-[4%] top-[8%] rounded-[46%_54%_42%_58%/55%_45%_55%_45%] bg-[#E7BD52]" />
          <div className="absolute inset-0">
            <CharacterVideo reactKey={reactKey} />
          </div>
          <Star className="absolute left-[4%] top-[6%] z-10 h-10 w-10" color="#C04C37" />
        </div>

        <main className="min-w-0 space-y-10">
          <header>
            <h1 className="text-[clamp(2rem,5vw,3.6rem)] font-black leading-[1.05]">Hey Aarav, this is your money corner.</h1>
            <Squiggle className="mt-2 w-48" />
            <p className="mt-3 text-lg font-semibold">One plan, one month at a time. Let&apos;s see where you stand.</p>
            <p className="mt-1 text-sm font-medium text-[#1f2a33]/70">Plan saved {fmtDate(saved.savedAt)}. This stays in this browser only.</p>
          </header>

          {/* A */}
          <Card title="Money at a glance" id="d-glance">
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {tiles.map((t, i) => (
                <motion.li
                  key={t.label}
                  initial={reduce ? false : { y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: reduce ? 0 : i * 0.05 }}
                  style={{ backgroundColor: t.bg, color: t.fg }}
                  className="rounded-2xl border-[3px] border-[#1f2a33] p-4 shadow-[3px_3px_0_#1f2a33]"
                >
                  <p className="text-[0.65rem] font-black uppercase tracking-widest opacity-80">{t.label}</p>
                  <p className="text-2xl font-black leading-tight">{t.value}</p>
                  <p className="text-xs font-semibold opacity-80">{t.note}</p>
                </motion.li>
              ))}
            </ul>
          </Card>

          {/* B */}
          <Card title="Your allocation" id="d-alloc">
            <ul className="grid gap-4 md:grid-cols-2">
              {saved.destinations.map((d) => {
                const status = setupStatus(stepsOf(d.kind), tracking.steps);
                const total = saved.destinations.reduce((s, x) => s + x.amount, 0);
                return (
                  <li key={d.id} className="rounded-3xl border-[3px] border-[#1f2a33] bg-[#F8F0DE] p-4 shadow-[4px_4px_0_#1f2a33]">
                    <p className="text-lg font-black">{d.name}</p>
                    <p className="text-2xl font-black">
                      {formatINR(d.amount)}
                      <span className="text-sm font-bold"> / month · {total > 0 ? Math.round((d.amount / total) * 100) : 0}%</span>
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      <b>Main risk:</b> {d.risk}
                    </p>
                    <p
                      className={`mt-2 inline-block rounded-full border-[3px] border-[#1f2a33] px-3 py-1 text-xs font-black ${
                        status === "Marked as completed by you" ? "bg-[#39795A] text-[#F8F0DE]" : status === "Setup steps viewed" ? "bg-[#E7BD52]" : "bg-[#fffaf0]"
                      }`}
                    >
                      {status}
                    </p>
                  </li>
                );
              })}
            </ul>
            {saved.destinations.length === 0 && <p className="font-semibold">Your plan has no destinations yet because the planned monthly amount is {formatINR(0)}.</p>}
            <p className="mt-3 text-xs font-semibold text-[#1f2a33]/70">
              Statuses come from the checklist you tick yourself. We aren&apos;t connected to any bank or fund provider, so nothing here is confirmed as active.
            </p>
            <button type="button" onClick={() => goTo("verdict")} className={`${BTN} mt-3 bg-[#E7BD52]`}>
              EDIT MY PLAN
            </button>
          </Card>

          {/* C */}
          <Card title="My contributions" id="d-contrib" tone="#fffaf0">
            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border-[3px] border-[#1f2a33] bg-[#E7BD52] p-3">
                <dt className="text-[0.65rem] font-black uppercase tracking-widest">Planned</dt>
                <dd className="text-xl font-black">{formatINR(saved.monthly)} / month</dd>
              </div>
              <div className="rounded-2xl border-[3px] border-[#1f2a33] bg-[#fffaf0] p-3">
                <dt className="text-[0.65rem] font-black uppercase tracking-widest">Self-reported</dt>
                <dd className="text-xl font-black">{contribs.length ? formatINR(totalReported) : "None yet"}</dd>
              </div>
              <div className="rounded-2xl border-[3px] border-dashed border-[#1f2a33] p-3">
                <dt className="text-[0.65rem] font-black uppercase tracking-widest">Verified by a provider</dt>
                <dd className="text-sm font-bold">None. No provider is connected.</dd>
              </div>
            </dl>

            <form
              className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                addContribution();
              }}
            >
              <div>
                <label htmlFor="c-date" className="text-sm font-bold">
                  Date
                </label>
                <input id="c-date" type="date" max={todayISO()} value={cDate || todayISO()} onChange={(e) => setCDate(e.target.value)} className={INPUT} />
              </div>
              <div>
                <label htmlFor="c-amt" className="text-sm font-bold">
                  Amount (₹)
                </label>
                <input id="c-amt" inputMode="numeric" value={cAmt} onChange={(e) => setCAmt(e.target.value)} className={INPUT} aria-describedby="c-err" />
              </div>
              <div>
                <label htmlFor="c-dest" className="text-sm font-bold">
                  Where it went
                </label>
                <select id="c-dest" value={cDest} onChange={(e) => setCDest(e.target.value)} className={INPUT}>
                  <option value="">Not specified</option>
                  {saved.destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className={`${BTN} bg-[#39795A] text-[#F8F0DE]`}>
                RECORD IT
              </button>
            </form>
            <p id="c-err" role="alert" className="min-h-5 text-sm font-bold text-[#C04C37]">
              {cErr}
            </p>

            {contribs.length === 0 ? (
              <p className="mt-2 rounded-2xl bg-[#F8F0DE] p-4 font-semibold">First month, fresh start. When you put money aside, record it here. Anything you add is marked as self-reported.</p>
            ) : (
              <ul className="mt-2 divide-y-2 divide-[#1f2a33]/20">
                {contribs.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm font-semibold">
                    <span>
                      {fmtDate(c.date)} · {formatINR(c.amount)} · {saved.destinations.find((d) => d.id === c.destId)?.name ?? "Not specified"} · <i>self-reported</i>
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove contribution of ${formatINR(c.amount)} on ${fmtDate(c.date)}`}
                      onClick={() => setTracking((t) => ({ ...t, contributions: t.contributions.filter((x) => x.id !== c.id) }))}
                      className={`min-h-11 cursor-pointer px-2 text-xs font-black underline ${FOCUS}`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* D */}
          <Card title="Future-you, hypothetically" id="d-future">
            <p className="mb-3 text-sm font-semibold">Play with the numbers here. This won&apos;t change your saved plan unless you choose to update it below.</p>
            <label htmlFor="ex-m" className="text-sm font-bold">
              Monthly amount to try (₹, up to your {formatINR(saved.investBudget)} budget)
            </label>
            <input id="ex-m" inputMode="numeric" value={exMonthly} onChange={(e) => { setExMonthly(e.target.value); setUpdated(false); }} className={`${INPUT} max-w-xs`} />
            {num(exMonthly) === null && <p role="alert" className="text-sm font-bold text-[#C04C37]">Enter a whole-rupee amount.</p>}
            {exAmount > saved.investBudget && <p role="alert" className="text-sm font-bold text-[#C04C37]">That&apos;s above your investment budget, so updating would cap it at {formatINR(saved.investBudget)}.</p>}
            <div className="mt-4">
              <ProjectionPanel monthly={exAmount} settings={ex} steady={steady} onChange={(n) => { setEx((p) => ({ ...p, ...n })); setUpdated(false); }} />
            </div>
            <div className="mt-4 rounded-2xl bg-[#F8F0DE] p-4">
              {!confirmUpdate ? (
                <button type="button" disabled={!differs || num(exMonthly) === null} onClick={() => setConfirmUpdate(true)} className={`${BTN} bg-[#E7BD52] disabled:cursor-not-allowed disabled:opacity-50`}>
                  MAKE THIS MY PLAN
                </button>
              ) : (
                <div role="alert">
                  <p className="font-bold">
                    Replace your saved plan with {formatINR(Math.min(exAmount, saved.investBudget))}/month for {ex.years} years at {rateFor(ex)}% (hypothetical)? Destination amounts will be scaled in proportion.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={applyUpdate} className={`${BTN} bg-[#C04C37] text-[#F8F0DE]`}>
                      YES, UPDATE
                    </button>
                    <button type="button" onClick={() => setConfirmUpdate(false)} className={`${BTN} bg-[#fffaf0]`}>
                      KEEP MY PLAN
                    </button>
                  </div>
                </div>
              )}
              {updated && <p role="status" className="mt-2 text-sm font-bold text-[#39795A]">Plan updated.</p>}
            </div>
          </Card>

          {/* E */}
          <Card title="Progress" id="d-progress" tone="#245D91">
            <div className="space-y-5 rounded-2xl bg-[#fffaf0] p-4 text-[#1f2a33]">
              <div>
                <p className="font-black">Emergency savings goal (optional)</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <div>
                    <label htmlFor="e-bal" className="text-sm font-bold">Set aside so far (₹)</label>
                    <input id="e-bal" inputMode="numeric" value={eBal} onChange={(e) => setEBal(e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label htmlFor="e-tar" className="text-sm font-bold">My target (₹)</label>
                    <input id="e-tar" inputMode="numeric" value={eTar} onChange={(e) => setETar(e.target.value)} className={INPUT} />
                  </div>
                  <button type="button" onClick={saveEmergency} className={`${BTN} bg-[#E7BD52]`}>SAVE</button>
                </div>
                {eb !== null && et !== null && et > 0 ? (
                  <div className="mt-3">
                    <div role="progressbar" aria-label="Emergency savings progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round((eb / et) * 100))} className="h-4 overflow-hidden rounded-full border-[3px] border-[#1f2a33]">
                      <div className="h-full bg-[#39795A] transition-[width]" style={{ width: `${Math.min(100, (eb / et) * 100)}%` }} />
                    </div>
                    <p className="mt-1 text-sm font-semibold">{Math.min(100, Math.round((eb / et) * 100))}% of your own target (self-reported)</p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm font-medium">Add both numbers if you&apos;d like a progress bar. Leave them blank otherwise.</p>
                )}
              </div>

              <div>
                <p className="font-black">This month&apos;s contribution goal</p>
                {saved.monthly > 0 ? (
                  <>
                    <div role="progressbar" aria-label="This month's recorded contributions" aria-valuemin={0} aria-valuemax={100} aria-valuenow={contribPct} className="mt-2 h-4 overflow-hidden rounded-full border-[3px] border-[#1f2a33]">
                      <div className="h-full bg-[#C04C37] transition-[width]" style={{ width: `${contribPct}%` }} />
                    </div>
                    <p className="mt-1 text-sm font-semibold">
                      {formatINR(monthReported)} of {formatINR(saved.monthly)} recorded this month (self-reported)
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-medium">Your plan is {formatINR(0)}/month for now, so there&apos;s no monthly goal.</p>
                )}
              </div>

              <div>
                <p className="font-black">Milestones</p>
                {contribs.length === 0 ? (
                  <p className="text-sm font-medium">None yet. Record your first contribution to start.</p>
                ) : (
                  <ul className="mt-1 flex flex-wrap gap-2">
                    <li className="rounded-full border-[3px] border-[#1f2a33] bg-[#E7BD52] px-3 py-1 text-xs font-black">First contribution recorded</li>
                    {MILESTONES.filter((m) => totalReported >= m).map((m) => (
                      <li key={m} className="rounded-full border-[3px] border-[#1f2a33] bg-[#39795A] px-3 py-1 text-xs font-black text-[#F8F0DE]">
                        {formatINR(m)} recorded
                      </li>
                    ))}
                  </ul>
                )}
                {saved.monthly > 0 && (
                  <p className="mt-2 text-xs font-medium text-[#1f2a33]/70">
                    Hypothetically, at {rateFor({ years: saved.years, scenario: saved.scenario, customRate: saved.rate })}% a year, contributing {formatINR(saved.monthly)} monthly passes {formatINR(MILESTONES[0])}{" "}
                    {(() => {
                      const y = yearsToReach(saved.monthly, saved.rate, MILESTONES[0]);
                      return y === null ? "never within 40 years under that assumption." : `in year ${y} (an illustration, not a forecast).`;
                    })()}{" "}
                    Value after {saved.years} years: {formatINR(Math.round(futureValue(saved.monthly, saved.rate, saved.years * 12)))}.
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* F */}
          <Card title="Next steps" id="d-next" tone="#E7BD52">
            {firstPending ? (
              <>
                <p className="text-sm font-black uppercase tracking-widest">Your next checklist item</p>
                <p className="mt-1 text-xl font-black leading-snug">{firstPending.step.text}</p>
                <p className="mt-1 text-sm font-semibold">{firstPending.step.detail}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => goTo("verdict")} className={`${BTN} bg-[#fffaf0]`}>
                    CONTINUE SETUP
                  </button>
                  <button
                    type="button"
                    onClick={() => setTracking((t) => ({ ...t, steps: { ...t.steps, [firstPending.step.id]: "done" } }))}
                    className={`${BTN} bg-[#39795A] text-[#F8F0DE]`}
                  >
                    MARK AS COMPLETED
                  </button>
                </div>
              </>
            ) : (
              <p className="text-lg font-black">
                {saved.destinations.length ? "You've marked every checklist step as done. Confirm directly with your provider before treating anything as active." : "No setup steps yet, since there are no destinations."}
              </p>
            )}
          </Card>

          {/* G */}
          <Card title="See you next month, Aarav." id="d-checkin">
            <p className="font-semibold">Come back, check what changed, and give future-you another little head start.</p>

            <div className="mt-4">
              <label htmlFor="ci-day" className="text-sm font-bold">Preferred check-in day of the month</label>
              <select
                id="ci-day"
                value={tracking.checkinDay ?? ""}
                onChange={(e) => setTracking((t) => ({ ...t, checkinDay: e.target.value ? Number(e.target.value) : null }))}
                className={`${INPUT} max-w-xs`}
              >
                <option value="">Not chosen</option>
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {upcoming && <p className="mt-1 text-sm font-bold">Your next check-in day: {upcoming}.</p>}
              <p className="mt-1 text-xs font-semibold text-[#1f2a33]/70">This prototype sends no reminders or notifications. Please come back on your own.</p>
            </div>

            <form className="mt-5 rounded-2xl bg-[#F8F0DE] p-4" onSubmit={(e) => { e.preventDefault(); saveCheckin(); }}>
              <fieldset>
                <legend className="font-black">What changed since last time?</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CHANGES.map((c) => {
                    const on = changes.includes(c);
                    return (
                      <label key={c} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-[3px] border-[#1f2a33] px-4 text-sm font-bold has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#245D91] ${on ? "bg-[#E7BD52]" : "bg-[#fffaf0]"}`}>
                        <input type="checkbox" checked={on} onChange={() => setChanges((p) => (on ? p.filter((x) => x !== c) : [...p, c]))} className="h-4 w-4 accent-[#1f2a33]" />
                        {c}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="ci-inc" className="text-sm font-bold">Income this month (₹, optional)</label>
                  <input id="ci-inc" inputMode="numeric" value={ciIncome} onChange={(e) => setCiIncome(e.target.value)} className={INPUT} />
                </div>
                <div>
                  <label htmlFor="ci-sav" className="text-sm font-bold">Total savings now (₹, optional)</label>
                  <input id="ci-sav" inputMode="numeric" value={ciSavings} onChange={(e) => setCiSavings(e.target.value)} className={INPUT} />
                </div>
              </div>
              <label htmlFor="ci-note" className="mt-3 block text-sm font-bold">A note to future-you (optional)</label>
              <textarea id="ci-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={INPUT} />
              <button type="submit" className={`${BTN} mt-3 bg-[#39795A] text-[#F8F0DE]`}>SAVE THIS CHECK-IN</button>
              <p role="status" className="mt-2 min-h-5 text-sm font-bold text-[#39795A]">{ciMsg}</p>
            </form>

            <div className="mt-4">
              <h3 className="font-black">Check-in history</h3>
              {tracking.checkins.length === 0 ? (
                <p className="mt-1 text-sm font-medium">No check-ins yet. Your first one will become the starting point for future comparisons.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {tracking.checkins.map((c, i) => {
                    const older = tracking.checkins.slice(i + 1);
                    const prevInc = older.find((x) => x.income !== null);
                    const prevSav = older.find((x) => x.savings !== null);
                    return (
                      <li key={c.id} className="rounded-2xl border-[3px] border-[#1f2a33] bg-[#fffaf0] p-3 text-sm font-semibold">
                        <p className="font-black">{fmtDate(c.date)}</p>
                        <p>Changed: {c.changes.length ? c.changes.join(", ") : "nothing noted"}</p>
                        {c.income !== null && (
                          <p>
                            Income {formatINR(c.income)}
                            {prevInc && prevInc.income !== null && ` (was ${formatINR(prevInc.income)} on ${fmtDate(prevInc.date)})`}
                          </p>
                        )}
                        {c.savings !== null && (
                          <p>
                            Savings {formatINR(c.savings)}
                            {prevSav && prevSav.savings !== null && ` (was ${formatINR(prevSav.savings)} on ${fmtDate(prevSav.date)})`}
                          </p>
                        )}
                        {c.note && <p className="italic">“{c.note}”</p>}
                      </li>
                    );
                  })}
                </ul>
              )}
              {lastCheckin && !prevWith("income") && !prevWith("savings") && (
                <p className="mt-2 text-xs font-medium text-[#1f2a33]/70">Comparisons appear once you have a second check-in with numbers to compare.</p>
              )}
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
