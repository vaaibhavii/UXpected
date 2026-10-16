/** Pure helpers for the verdict and dashboard. No UI, no React. */

import type { Destination, ProfileAnswers } from "@/lib/journey";
import { optionsFor, suggestMonthly, type RouteKind } from "@/lib/planning";
import { formatINR } from "@/lib/journey";
import { futureValue } from "@/lib/projection";

/* ---------- Dates (kept here so components stay free of impure calls) ---------- */

export const nowISO = () => new Date().toISOString();

export const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const todayDate = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

export const todayISO = () => isoOf(todayDate());

export const parseISODate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const fmtDate = (iso: string) =>
  parseISODate(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const monthKey = (iso: string) => iso.slice(0, 7);

/** Next date (today or later) that falls on the chosen day of the month. */
export function nextCheckIn(day: number, today: Date): Date {
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), day);
  return thisMonth >= today ? thisMonth : new Date(today.getFullYear(), today.getMonth() + 1, day);
}

/* ---------- Allocation ---------- */

export const FUND_IDS = ["index", "flexi", "small"];
export const kindOf = (id: string): "fund" | "deposit" => (FUND_IDS.includes(id) ? "fund" : "deposit");

export function evenSplit(ids: string[], total: number): Record<string, number> {
  const out: Record<string, number> = {};
  if (ids.length === 0) return out;
  const base = Math.floor(total / ids.length);
  let extra = total - base * ids.length;
  ids.forEach((id) => {
    out[id] = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra -= 1;
  });
  return out;
}

/** Use the user's manual amounts only if they still cover exactly the chosen destinations. */
export function resolveAlloc(ids: string[], total: number, manual: Record<string, number> | null) {
  if (manual && Object.keys(manual).length === ids.length && ids.every((id) => id in manual)) return manual;
  return evenSplit(ids, total);
}

/** Scale amounts to a new total in proportion, using largest-remainder so it adds up exactly. */
export function rescale(amounts: Record<string, number>, newTotal: number): Record<string, number> {
  const ids = Object.keys(amounts);
  if (ids.length === 0) return {};
  const sum = ids.reduce((s, k) => s + amounts[k], 0);
  if (sum <= 0) return evenSplit(ids, newTotal);
  const parts = ids.map((k) => {
    const raw = (amounts[k] * newTotal) / sum;
    return { k, f: Math.floor(raw), rem: raw - Math.floor(raw) };
  });
  let left = newTotal - parts.reduce((s, p) => s + p.f, 0);
  [...parts]
    .sort((a, b) => b.rem - a.rem)
    .forEach((p) => {
      if (left > 0) {
        p.f += 1;
        left -= 1;
      }
    });
  return Object.fromEntries(parts.map((p) => [p.k, p.f]));
}

/* ---------- Destinations and the "why" ---------- */

const WHY: Record<string, string> = {
  savings: "Keeps money accessible, which suits emergency cover and anything you may need soon.",
  fd: "Sets money aside for a defined term, for amounts you won't need during that period.",
  other: "A place to compare lower-volatility products once you've read each one's terms.",
  index: "Broad, diversified market exposure with simple rules, considered for long-term goals.",
  flexi: "One fund that can move across company sizes, with a manager making the calls.",
  small: "Smaller companies have more room to grow, but you chose this knowing it can swing sharply.",
};

export function buildDestinations(
  route: RouteKind,
  ids: string[],
  amounts: Record<string, number>,
  profile: ProfileAnswers,
): Destination[] {
  const opts = optionsFor(route);
  return ids.flatMap((id) => {
    const o = opts.find((x) => x.id === id);
    if (!o) return [];
    const tail =
      profile.horizon === "lt1" || profile.horizon === "1to3"
        ? " You said you may need the money fairly soon, so check the terms before committing."
        : "";
    return [
      {
        id,
        name: o.name,
        amount: amounts[id] ?? 0,
        why: `${WHY[id] ?? o.role}${tail}`,
        risk: [o.limits[0], o.caution].filter(Boolean).join(" "),
        horizon: o.horizon,
        kind: kindOf(id),
      },
    ];
  });
}

/* ---------- "Why this is your plan" ---------- */

const GOAL_PHRASE: Record<string, string> = {
  purchase: "a big purchase",
  study: "studies or an early career",
  wealth: "long-term wealth",
  cushion: "a rainy-day cushion",
  unsure: "a goal you haven't settled yet",
};

export function explainPlan(a: {
  route: RouteKind;
  profile: ProfileAnswers;
  invest: number;
  monthly: number;
  emergencyAlloc: number;
}): { lines: string[]; conflicts: string[] } {
  const { route, profile: p, invest, monthly, emergencyAlloc } = a;
  const lines: string[] = [];

  lines.push(
    route === "steady"
      ? "You chose the steadier route, so we're showing savings and lower-volatility options to look into, not equity funds."
      : "You chose the higher-risk route, so we're showing equity-fund categories to research. These can fall sharply and losses are possible.",
  );

  if (p.goal) lines.push(`Your goal is ${GOAL_PHRASE[p.goal] ?? "not settled yet"}.`);
  else lines.push("You haven't told us your goal yet, so nothing here is tuned to one.");

  switch (p.horizon) {
    case "lt1":
      lines.push("You may need this money within a year. That makes accessibility and stability important before choosing anything volatile.");
      break;
    case "1to3":
      lines.push("You may need this money in 1–3 years. That's a short window for investments that can fall sharply.");
      break;
    case "3to7":
      lines.push("You expect to need the money in 3–7 years, a medium window where a bad stretch could still hurt.");
      break;
    case "7plus":
      lines.push("You don't expect to need this money for 7+ years, which gives volatile investments more time to recover. It doesn't guarantee they will.");
      break;
    case "unsure":
      lines.push("You're not sure when you'll need the money, so we've treated it cautiously.");
      break;
    default:
      lines.push("We don't know when you'll need the money yet.");
  }

  switch (p.loss) {
    case "sell":
      lines.push("You said a big fall would likely make you sell. That matters, because selling after a drop can lock in a loss.");
      break;
    case "worry":
      lines.push("You'd worry about a big fall but wait it out, which is a reasonable starting point.");
      break;
    case "stay":
      lines.push("You said you'd stay put after a big fall. That's an attitude, not protection, and real losses still hurt.");
      break;
    case "unsure":
      lines.push("You're not sure how you'd react to a big fall, which is worth finding out gently before taking market risk.");
      break;
  }

  if (p.emergency === "yes") lines.push("You have emergency savings in place.");
  else if (p.emergency === "some") lines.push("Your emergency savings are still a work in progress.");
  else if (p.emergency === "no") lines.push("You don't have emergency savings yet. Building that first usually comes before taking market risk.");
  else if (emergencyAlloc > 0) lines.push(`Your budget sets aside ${formatINR(emergencyAlloc)} a month for emergency savings.`);
  else lines.push("Your budget doesn't set money aside for emergencies yet.");

  lines.push(
    invest > 0
      ? `Your budget sets aside ${formatINR(invest)} a month for investments, and this plan uses ${formatINR(monthly)} of it.`
      : "You haven't allocated money to investing, so your plan starts with building savings. That's a perfectly valid place to start.",
  );

  const conflicts = route === "adventure" ? suggestMonthly(route, invest, p).conflicts : [];
  return { lines, conflicts };
}

/* ---------- Action plan ---------- */

export interface Step {
  id: string;
  text: string;
  detail: string;
  /** Label for the "view" action, if the step has one. */
  viewLabel?: "VIEW SCHEME DETAILS" | "VIEW OFFICIAL SETUP STEPS";
  link?: { label: string; url: string };
}

const SEBI = { label: "SEBI's investor website (official)", url: "https://investor.sebi.gov.in/" };
const AMFI = { label: "AMFI, the mutual fund industry body (official)", url: "https://www.amfiindia.com/" };
const DICGC = { label: "DICGC, deposit insurance information (official)", url: "https://www.dicgc.org.in/" };

export const DEPOSIT_STEPS: Step[] = [
  {
    id: "dep-1",
    text: "Compare eligible banks or providers.",
    detail: "Look beyond the headline rate: fees, minimum balances, how easy withdrawals are, and how the provider is regulated.",
  },
  {
    id: "dep-2",
    text: "Review the interest rate, terms, withdrawal rules and any relevant protections.",
    detail:
      "Read the provider's own terms. Whether, and how much, a deposit is insured depends on the institution and the rules that apply. This prototype hasn't verified any limit for your bank.",
    viewLabel: "VIEW OFFICIAL SETUP STEPS",
    link: DICGC,
  },
  {
    id: "dep-3",
    text: "Choose an amount that doesn't compromise essential expenses or emergency access.",
    detail: "Keep what you need for essentials and emergencies somewhere you can reach quickly before locking anything away.",
  },
  {
    id: "dep-4",
    text: "Follow the institution's official account-opening or deposit instructions.",
    detail: "Use the bank's own app, branch or website. We haven't connected to any provider, so nothing is opened from here.",
    viewLabel: "VIEW OFFICIAL SETUP STEPS",
  },
  {
    id: "dep-5",
    text: "Record the amount and maturity date, if applicable.",
    detail: "Note what you've put in under “My contributions” on your dashboard. Maturity dates aren't tracked here yet, so keep your own note.",
  },
];

export const SIP_STEPS: Step[] = [
  {
    id: "sip-1",
    text: "Verify the exact mutual fund scheme and its official documentation.",
    detail:
      "Your plan names categories, not specific schemes. Choose a scheme yourself and read its official documents. Check the date on any figure you see.",
    viewLabel: "VIEW SCHEME DETAILS",
    link: AMFI,
  },
  {
    id: "sip-2",
    text: "Review its investment objective, risk information, benchmark, expense ratio and terms.",
    detail: "Look for the stated objective, the risk label, which benchmark it's measured against, what it costs each year, and any exit charges.",
    viewLabel: "VIEW SCHEME DETAILS",
    link: AMFI,
  },
  {
    id: "sip-3",
    text: "Confirm the scheme's risk profile suits your goal and time horizon.",
    detail: "Hold it up against your own answers: when you may need the money, and how you'd react to a big fall.",
  },
  {
    id: "sip-4",
    text: "Follow the official provider's process for account setup and identity verification.",
    detail: "Use the provider's official channels. We haven't connected to any provider, so no account is created from here.",
    viewLabel: "VIEW OFFICIAL SETUP STEPS",
    link: SEBI,
  },
  {
    id: "sip-5",
    text: "Choose the monthly amount and date.",
    detail: "Pick a date shortly after your income arrives, and an amount you're comfortable leaving invested.",
  },
  {
    id: "sip-6",
    text: "Review the payment mandate details before authorising any recurring payment.",
    detail: "Check the amount, the frequency, the start and end dates, and how to pause or cancel before you approve anything.",
    viewLabel: "VIEW OFFICIAL SETUP STEPS",
    link: SEBI,
  },
  {
    id: "sip-7",
    text: "Confirm the setup directly with the provider before treating the SIP as active.",
    detail: "Only the provider can tell you a SIP is active. Until then, treat it as planned.",
  },
];

export const stepsFor = (route: RouteKind) => (route === "steady" ? DEPOSIT_STEPS : SIP_STEPS);

export const nextStep = (steps: Step[], state: Record<string, "viewed" | "done">) =>
  steps.find((s) => state[s.id] !== "done") ?? null;

export type SetupStatus = "Planned" | "Setup steps viewed" | "Marked as completed by you";

export function setupStatus(steps: Step[], state: Record<string, "viewed" | "done">): SetupStatus {
  if (steps.length > 0 && steps.every((s) => state[s.id] === "done")) return "Marked as completed by you";
  if (steps.some((s) => state[s.id])) return "Setup steps viewed";
  return "Planned";
}

/* ---------- Milestones ---------- */

export const MILESTONES = [10000, 25000, 50000, 100000];

/** First whole year in which the hypothetical value passes `target`, or null within `maxYears`. */
export function yearsToReach(monthly: number, annualPct: number, target: number, maxYears = 40): number | null {
  if (monthly <= 0) return null;
  for (let y = 1; y <= maxYears; y++) if (futureValue(monthly, annualPct, y * 12) >= target) return y;
  return null;
}
