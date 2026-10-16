import { formatINR, type PlanState, type ProfileAnswers } from "@/lib/journey";
import { outcome, SCENARIO_RATES } from "@/lib/projection";

export type RouteKind = "steady" | "adventure";

/* ---------- Educational option content (no live data, no named schemes) ---------- */

export interface PlanOption {
  id: string;
  name: string;
  tag: string;
  what: string;
  how: string;
  role: string;
  limits: string[];
  horizon: string;
  caution?: string;
}

export const STEADY_OPTIONS: PlanOption[] = [
  {
    id: "savings",
    name: "Savings account",
    tag: "Accessible",
    what: "A bank account that pays interest on your balance and lets you add or withdraw money easily.",
    how: "You deposit money and the bank credits interest at its stated rate. Rates, minimum balances and fees differ between banks and can change.",
    role: "A natural home for your emergency cushion and for money you might need at short notice.",
    limits: [
      "Interest may not keep up with inflation, and interest can be taxable.",
      "Terms vary by bank. Check fees, minimum balances and any deposit-protection limits for your own bank before relying on them.",
    ],
    horizon: "Any, especially money you may need within months.",
  },
  {
    id: "fd",
    name: "Fixed deposit",
    tag: "Set aside for a term",
    what: "A deposit held with a bank for an agreed term at an agreed rate.",
    how: "You choose an amount and a term. Interest terms are often known upfront, depending on the product, and you receive the money plus interest at maturity.",
    role: "For money you won't need for a defined period, once your accessible cushion is in place.",
    limits: [
      "Withdrawing early may mean a penalty or lower interest.",
      "Interest can be taxable, and terms differ between banks and deposit types.",
      "Not 'guaranteed' by default: protections depend on the institution and the rules that apply, which we haven't verified here.",
    ],
    horizon: "Roughly the term you choose, often months to a few years.",
  },
  {
    id: "other",
    name: "Other lower-volatility products",
    tag: "Check each one",
    what: "A broad group, such as some debt-oriented funds or government-backed savings schemes.",
    how: "Each product has its own rules for returns, lock-ins, costs and taxes, so they can't be treated as one thing.",
    role: "Possible for goals a few years away, after you've compared specific products' terms.",
    limits: [
      "Debt funds are not the same as bank deposits and can lose value, for example when interest rates move or a borrower doesn't repay.",
      "Lock-ins, exit loads, fees and taxes vary.",
      "No specific products or returns are shown here.",
    ],
    horizon: "Depends on the product and your goal, often a few years.",
  },
];

export const ADVENTURE_OPTIONS: PlanOption[] = [
  {
    id: "index",
    name: "Broad-market index funds",
    tag: "Tracks an index",
    what: "Funds that aim to track a market index, holding many of the same companies in similar proportions.",
    how: "The fund follows the index up and down, minus costs, rather than a manager picking stocks.",
    role: "Some people consider them for broad, diversified exposure with simple rules for long-term goals.",
    limits: [
      "Market risk: the fund can fall when markets fall.",
      "Costs and tracking differences mean results can differ from the index.",
    ],
    horizon: "Typically many years (often 7+), for money you can leave invested.",
  },
  {
    id: "flexi",
    name: "Flexi-cap mutual funds",
    tag: "Manager decides the mix",
    what: "Funds where the manager can invest across large, mid and small companies.",
    how: "The manager chooses the mix and may change it over time, so two flexi-cap funds can hold very different things.",
    role: "Some people consider one fund that spans company sizes and adapts to conditions.",
    limits: [
      "Results depend on the manager's strategy, holdings and market conditions.",
      "Can underperform its benchmark and can lose value.",
    ],
    horizon: "Long term, often 5–7+ years.",
  },
  {
    id: "small",
    name: "Small-cap mutual funds",
    tag: "Higher caution",
    what: "Funds focused on smaller companies.",
    how: "Smaller companies can grow faster, but can also swing sharply and be harder to sell in tough markets.",
    role: "Only for long horizons and money you can afford to see fall a lot. Often a small part of a wider plan, if at all.",
    limits: [
      "Can be particularly volatile, with sharp and prolonged falls.",
      "Substantial losses are possible. Growth potential doesn't make it suitable for a beginner.",
      "Not picked for you just because you chose the adventurous route.",
    ],
    horizon: "Long horizons only (often 7+ years), after careful research.",
    caution: "Not automatically suitable for beginners.",
  },
];

export const DATA_NOTE =
  "These are categories to research, not current fund recommendations. No verified scheme-level data (scheme names, expense ratios, benchmarks, performance) is connected to this prototype, so none is shown. If you look at real schemes, use their official factsheets and note the date of the information.";

export const optionsFor = (r: RouteKind) => (r === "steady" ? STEADY_OPTIONS : ADVENTURE_OPTIONS);

/* ---------- Suggested monthly amount ---------- */

export interface Suggestion {
  amount: number;
  reasons: string[];
  /** Answers that sit uneasily with the chosen route. */
  conflicts: string[];
  /** Neutral observations. */
  notes: string[];
}

interface Rule {
  m: number;
  why: string;
}

function rulesFor(route: RouteKind, p: ProfileAnswers): Rule[] {
  const r: Rule[] = [];
  if (route === "adventure") {
    switch (p.horizon) {
      case "lt1":
        r.push({ m: 0, why: "You may need this money within a year, and market-linked funds can be down exactly when you need to withdraw." });
        break;
      case "1to3":
        r.push({ m: 0.25, why: "You may need the money within 1–3 years, which is a short window for investments that can fall sharply." });
        break;
      case "unsure":
        r.push({ m: 0.5, why: "You're not sure when you'll need the money, so we've kept the starting amount cautious." });
        break;
      case "3to7":
        r.push({ m: 0.75, why: "A 3–7 year window can work for some growth investing, but leaves less time to recover from a bad stretch." });
        break;
      case undefined:
        r.push({ m: 0.5, why: "We don't know your time horizon yet, so we've kept the starting amount cautious. The quick questions can sharpen this." });
        break;
    }
    switch (p.emergency) {
      case "no":
        r.push({ m: 0.25, why: "You don't have emergency savings yet. Building that cushion first usually comes before taking market risk." });
        break;
      case "some":
        r.push({ m: 0.75, why: "Your emergency savings are still a work in progress, so we've trimmed the starting amount." });
        break;
    }
    switch (p.loss) {
      case "sell":
        r.push({ m: 0.5, why: "You said you'd likely sell after a big fall, which can turn a temporary drop into a real loss." });
        break;
      case "unsure":
        r.push({ m: 0.75, why: "You're not sure how you'd react to a big fall, so we've kept the starting amount modest." });
        break;
    }
    switch (p.goal) {
      case "purchase":
      case "cushion":
        r.push({ m: 0.25, why: "This goal has a fairly defined purpose or date, where stability matters more than growth potential." });
        break;
      case "study":
        r.push({ m: 0.5, why: "Money for studies or an early career often has a nearer deadline than long-term wealth." });
        break;
      case "unsure":
        r.push({ m: 0.75, why: "Your goal isn't settled yet, so we've kept the starting amount modest." });
        break;
    }
  } else {
    switch (p.emergency) {
      case "no":
        r.push({ m: 0.5, why: "You don't have emergency savings yet, so a good share of this is better kept in an accessible savings account first." });
        break;
      case "some":
        r.push({ m: 0.75, why: "Your emergency savings are still growing, so we've trimmed the starting amount." });
        break;
    }
  }
  return r;
}

export function suggestMonthly(route: RouteKind, invest: number, p: ProfileAnswers): Suggestion {
  const reasons: string[] = [];
  const conflicts: string[] = [];
  const notes: string[] = [];

  if (invest <= 0) {
    return {
      amount: 0,
      reasons: ["You haven't set aside anything for investing in your budget, and that's a valid choice. You can keep exploring without committing money."],
      conflicts,
      notes,
    };
  }

  reasons.push(`You're setting aside ${formatINR(invest)} a month for investments in your budget. We've used that as your starting limit.`);

  const rules = rulesFor(route, p);
  const m = rules.length ? Math.min(...rules.map((x) => x.m)) : 1;
  rules.filter((x) => x.m < 1).forEach((x) => reasons.push(x.why));

  let amount = invest;
  if (m < 1) {
    const unit = invest >= 20000 ? 500 : invest >= 2000 ? 100 : 10;
    amount = Math.min(invest, Math.floor((invest * m) / unit) * unit);
    if (amount === 0) {
      reasons.push("Because of that, starting at ₹0 for now is a reasonable choice. You can still explore and revisit this.");
    } else {
      reasons.push(`So we suggest starting with ${formatINR(amount)} rather than the full ${formatINR(invest)}. You can change it.`);
    }
  } else {
    reasons.push("Nothing in your answers suggests holding back, but starting below your limit is always allowed.");
  }

  if (route === "adventure") {
    if (p.horizon === "lt1" || p.horizon === "1to3")
      conflicts.push("You may need this money within about 3 years, which is a short time for investments that can fall sharply.");
    if (p.emergency === "no") conflicts.push("You don't have emergency savings yet.");
    if (p.loss === "sell") conflicts.push("You said you'd likely sell after a big fall.");
    if (p.goal === "purchase" || p.goal === "cushion") conflicts.push("Your goal looks like a near-term purchase or cushion.");
  } else if (p.horizon === "7plus" && p.emergency === "yes" && (p.loss === "stay" || p.loss === "worry")) {
    notes.push("Your answers show a long horizon and comfort with ups and downs. You may also want to learn about the adventurous route, which is just an option to explore.");
  }

  return { amount, reasons, conflicts, notes };
}

/** The monthly amount actually in use: the user's pick, else the suggestion, never above the budget. */
export function derivePlan(a: { invest: number; route: RouteKind; profile: ProfileAnswers; plan: PlanState }) {
  const sug = suggestMonthly(a.route, a.invest, a.profile);
  const monthly = Math.max(0, Math.min(a.plan.monthly ?? sug.amount, a.invest));
  return { sug, monthly };
}

export function fvRange(monthly: number, years: number) {
  const low = outcome(monthly, SCENARIO_RATES.low, years).value;
  const high = outcome(monthly, SCENARIO_RATES.high, years).value;
  return { low, high };
}

export function needsCushion(profile: ProfileAnswers, emergencyAlloc: number) {
  return profile.emergency === "no" || (profile.emergency === undefined && emergencyAlloc === 0);
}
