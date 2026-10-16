"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import ProjectionChart from "@/components/ProjectionChart";
import { AnimatedAmount, FOCUS } from "@/components/SceneParts";
import { formatINR, type ScenarioId } from "@/lib/journey";
import { outcome, parseRate, SCENARIO_RATES, yearlySeries } from "@/lib/projection";

const INK = "#1f2a33";
export const DURATIONS = [3, 5, 10, 15, 20];

const SCENARIOS: { id: ScenarioId; label: string; bg: string; fg: string }[] = [
  { id: "low", label: "Lower-return illustration", bg: "#245D91", fg: "#F8F0DE" },
  { id: "mid", label: "Middle-return illustration", bg: "#E7BD52", fg: INK },
  { id: "high", label: "Higher-return illustration", bg: "#C04C37", fg: "#F8F0DE" },
  { id: "custom", label: "Your own assumption", bg: "#39795A", fg: "#F8F0DE" },
];

export interface ProjectionSettings {
  years: number;
  scenario: ScenarioId;
  customRate: number;
}

export const rateFor = (s: ProjectionSettings) => (s.scenario === "custom" ? s.customRate : SCENARIO_RATES[s.scenario]);

const pct = (n: number) => `${Math.round(n * 10) / 10}%`;
const signed = (n: number) => (n < 0 ? "−" : "") + formatINR(Math.abs(n));

/** Shared hypothetical-projection view. Pure display over the numbers it is given. */
export default function ProjectionPanel({
  monthly,
  settings,
  onChange,
  steady,
}: {
  monthly: number;
  settings: ProjectionSettings;
  onChange: (next: Partial<ProjectionSettings>) => void;
  steady: boolean;
}) {
  const reduce = useReducedMotion();
  const [rateRaw, setRateRaw] = useState(String(settings.customRate));
  const rateErr = parseRate(rateRaw).error;

  const results = SCENARIOS.map((s) => ({
    ...s,
    ...outcome(monthly, s.id === "custom" ? settings.customRate : SCENARIO_RATES[s.id], settings.years),
  }));
  const selected = results.find((r) => r.id === settings.scenario) ?? results[1];
  const points = yearlySeries(monthly, selected.rate, settings.years);

  const gainLabel = (d: number) => (d > 0.5 ? "Hypothetical growth" : d < -0.5 ? "Hypothetical loss" : "Hypothetical growth or loss");

  return (
    <div>
      <p className="text-sm font-semibold text-[#1f2a33]/75">
        These are hypothetical illustrations, not forecasts. Actual returns vary, investments can lose value, and fees, taxes, and inflation can affect your outcome.
      </p>
      {steady && (
        <p className="mt-2 rounded-2xl bg-[#E7BD52] px-4 py-2 text-sm font-bold">
          Savings and deposit rates differ by bank and change over time, and we haven&apos;t verified any product&apos;s rate. Use “Your own assumption” to try a rate you&apos;ve seen from a real provider.
        </p>
      )}

      <div role="radiogroup" aria-label="Investment duration" className="mt-4 flex flex-wrap gap-2">
        {DURATIONS.map((y) => (
          <button
            key={y}
            type="button"
            role="radio"
            aria-checked={settings.years === y}
            onClick={() => onChange({ years: y })}
            className={`min-h-11 min-w-16 cursor-pointer rounded-full border-[3px] border-[#1f2a33] px-4 text-sm font-black shadow-[3px_3px_0_#1f2a33] ${
              settings.years === y ? "bg-[#1f2a33] text-[#F8F0DE]" : "bg-[#fffaf0]"
            } ${FOCUS}`}
          >
            {y} years
          </button>
        ))}
      </div>

      <div role="radiogroup" aria-label="Hypothetical return scenario" className="mt-4 grid gap-3 sm:grid-cols-2">
        {results.map((r) => {
          const on = settings.scenario === r.id;
          return (
            <motion.button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange({ scenario: r.id })}
              whileHover={reduce ? undefined : { y: -4 }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              style={{ backgroundColor: r.bg, color: r.fg }}
              className={`cursor-pointer rounded-[1.6rem] border-[3px] border-[#1f2a33] p-4 text-left ${on ? "shadow-[8px_8px_0_#1f2a33]" : "shadow-[4px_4px_0_#1f2a33]"} ${FOCUS}`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-widest">{r.label}</span>
                {on && <span aria-hidden="true">✓</span>}
              </span>
              <span className="mt-1 block text-xs font-bold opacity-90">Assumed annual return: {pct(r.rate)} (hypothetical)</span>
              <span className="mt-2 block text-[0.65rem] font-bold uppercase tracking-wider opacity-80">Illustrative future value</span>
              <span className="block text-3xl font-black leading-tight">
                <AnimatedAmount value={Math.round(r.value)} format={formatINR} />
              </span>
              <span className="mt-2 block space-y-0.5 text-xs font-semibold">
                <span className="flex justify-between gap-2">
                  <span>Planned monthly contribution</span>
                  <span>{formatINR(monthly)}</span>
                </span>
                <span className="flex justify-between gap-2">
                  <span>Total planned contributions</span>
                  <span>{formatINR(r.contributed)}</span>
                </span>
                <span className="flex justify-between gap-2">
                  <span>Duration</span>
                  <span>{settings.years} years</span>
                </span>
                <span className="flex justify-between gap-2 font-black">
                  <span>{gainLabel(r.difference)}</span>
                  <span>{Math.abs(r.difference) < 0.5 ? formatINR(0) : signed(Math.round(r.difference))}</span>
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>

      {settings.scenario === "custom" && (
        <div className="mt-3 max-w-xs">
          <label htmlFor="proj-rate" className="text-sm font-bold">
            Annual return assumption (%), can be 0 or negative
          </label>
          <input
            id="proj-rate"
            inputMode="decimal"
            autoComplete="off"
            value={rateRaw}
            aria-invalid={rateErr !== null}
            aria-describedby="proj-rate-err"
            onChange={(e) => {
              setRateRaw(e.target.value);
              const r = parseRate(e.target.value);
              if (r.value !== null) onChange({ customRate: r.value });
            }}
            className="mt-1 min-h-12 w-full rounded-xl border-[3px] border-[#1f2a33] bg-[#fffaf0] px-3 text-xl font-black outline-none focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#245D91]"
          />
          <p id="proj-rate-err" role="alert" className="min-h-5 text-xs font-semibold text-[#C04C37]">
            {rateErr}
          </p>
        </div>
      )}

      <div className="mt-5 rounded-[1.6rem] border-[3px] border-[#1f2a33] bg-[#fffaf0] p-4">
        <ProjectionChart points={points} />
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs font-bold">
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-3 w-3 rounded-sm border-2 border-[#1f2a33] bg-[#245D91]" /> Total planned contributions
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-3 w-3 rounded-sm border-2 border-[#1f2a33] bg-[#39795A]" /> Hypothetical growth
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-3 w-3 rounded-sm border-2 border-[#1f2a33] bg-[#C04C37]" /> Hypothetical loss
          </span>
          <span className="text-[#1f2a33]/60">Years along the bottom</span>
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs font-medium text-[#1f2a33]/75">
          <li>One contribution at the end of each month (monthly frequency).</li>
          <li>The annual rate becomes an effective monthly rate: (1 + annual)^(1/12) − 1.</li>
          <li>Fees, taxes, inflation, withdrawals and missed payments are excluded.</li>
          <li>At 0% the value equals contributions; below 0% it falls under them.</li>
        </ul>
      </div>
    </div>
  );
}
