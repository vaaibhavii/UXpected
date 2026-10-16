"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export type SceneId =
  | "welcome"
  | "savings"
  | "income"
  | "budget"
  | "route"
  | "steady"
  | "adventure"
  | "profile"
  | "plan"
  | "verdict"
  | "dashboard";
export const SCENES: SceneId[] = ["welcome", "savings", "income", "budget", "route", "steady", "adventure", "profile", "plan", "verdict", "dashboard"];

export type ScenarioId = "low" | "mid" | "high" | "custom";
export interface PlanState {
  /** `null` means "use the suggested amount". */
  monthly: number | null;
  scenario: ScenarioId;
  years: number;
  /** Annual % for the user's own assumption (may be zero or negative). */
  customRate: number;
  category: string | null;
}

export type RouteChoice = "steady" | "adventure" | "unsure";
export interface ProfileAnswers {
  horizon?: string;
  emergency?: string;
  loss?: string;
  goal?: string;
}

export type IncomeKind = "Pocket money" | "Internship" | "Part-time work" | "Freelancing" | "Other";

export interface IncomeSource {
  id: string;
  kind: IncomeKind;
  /** `null` while the field is empty (invalid). */
  amount: number | null;
}

export interface IncomeState {
  /** Typed total, used when no individual sources are added. */
  manualTotal: number | null;
  sources: IncomeSource[];
}

/** Monthly income in whole rupees. Sources win over the typed total when present. */
export const incomeTotal = (i: IncomeState) =>
  i.sources.length > 0 ? i.sources.reduce((s, x) => s + (x.amount ?? 0), 0) : (i.manualTotal ?? 0);

export const incomeValid = (i: IncomeState) =>
  i.sources.length > 0 ? i.sources.every((s) => s.amount !== null) : i.manualTotal !== null;

export type BudgetKey = "essentials" | "fun" | "emergency" | "invest";
export const BUDGET_KEYS: BudgetKey[] = ["essentials", "fun", "emergency", "invest"];

export interface BudgetState {
  amounts: Record<BudgetKey, number>;
  /** Income the amounts were built for. A different income re-seeds the suggested split. */
  basis: number | null;
}

/** Suggested starting split: 25% / 12.5% / 25% / 37.5%. Investments absorb rounding so the total always matches. */
export function suggestSplit(income: number): Record<BudgetKey, number> {
  const essentials = Math.floor(income * 0.25);
  const fun = Math.floor(income * 0.125);
  const emergency = Math.floor(income * 0.25);
  return { essentials, fun, emergency, invest: income - essentials - fun - emergency };
}

export type SavingsChoice = "p0" | "p500" | "p1000" | "p2500" | "p5000" | "p10000" | "custom" | "unknown";

export interface SavingsState {
  /** Saved amount in rupees. `null` when nothing is known (never 0 for "unknown"). */
  amount: number | null;
  /** True only when the user chose "I'm not sure yet". */
  unknown: boolean;
  /** Which tile was picked, so the selection can be restored on back-navigation. */
  choice: SavingsChoice | null;
}

interface Nav {
  scene: SceneId;
  direction: 1 | -1;
}

/** One place the planned monthly money goes. */
export interface Destination {
  id: string;
  name: string;
  amount: number;
  why: string;
  risk: string;
  horizon: string;
  kind: "deposit" | "fund";
}

/** The confirmed plan. A self-contained snapshot, so the dashboard never depends on live scene state. */
export interface SavedPlan {
  savedAt: string;
  route: "steady" | "adventure";
  monthly: number;
  income: number;
  /** `null` when unknown. Never 0 for "not sure". */
  savings: number | null;
  emergencyMonthly: number;
  emergencyStatus: string | null;
  essentialsMonthly: number;
  investBudget: number;
  goal: string | null;
  horizon: string | null;
  lossStyle: string | null;
  years: number;
  scenario: ScenarioId;
  rate: number;
  destinations: Destination[];
}

export interface Contribution {
  id: string;
  /** yyyy-mm-dd */
  date: string;
  amount: number;
  destId: string | null;
}

export interface CheckIn {
  id: string;
  date: string;
  income: number | null;
  savings: number | null;
  changes: string[];
  note: string;
}

/** Everything the user records themselves. None of it is provider-verified. */
export interface Tracking {
  steps: Record<string, "viewed" | "done">;
  contributions: Contribution[];
  checkinDay: number | null;
  checkins: CheckIn[];
  emergencyBalance: number | null;
  emergencyTarget: number | null;
}

export const EMPTY_TRACKING: Tracking = {
  steps: {},
  contributions: [],
  checkinDay: null,
  checkins: [],
  emergencyBalance: null,
  emergencyTarget: null,
};

/** Draft allocation while the verdict is being edited. `null` = not edited yet. */
export interface VerdictDraft {
  ids: string[] | null;
  amounts: Record<string, number> | null;
}

const STORAGE_KEY = "honest-million-v1";

interface JourneyValue {
  scene: SceneId;
  direction: 1 | -1;
  savings: SavingsState;
  setSavings: (s: SavingsState) => void;
  income: IncomeState;
  setIncome: Dispatch<SetStateAction<IncomeState>>;
  budget: BudgetState;
  setBudget: Dispatch<SetStateAction<BudgetState>>;
  route: RouteChoice | null;
  setRoute: (r: RouteChoice | null) => void;
  profile: ProfileAnswers;
  setProfile: Dispatch<SetStateAction<ProfileAnswers>>;
  plan: PlanState;
  setPlan: Dispatch<SetStateAction<PlanState>>;
  /** When set, the budget scene returns here when finished. */
  returnTo: SceneId | null;
  setReturnTo: (s: SceneId | null) => void;
  draft: VerdictDraft;
  setDraft: Dispatch<SetStateAction<VerdictDraft>>;
  saved: SavedPlan | null;
  setSaved: Dispatch<SetStateAction<SavedPlan | null>>;
  tracking: Tracking;
  setTracking: Dispatch<SetStateAction<Tracking>>;
  goNext: () => void;
  goBack: () => void;
  goTo: (scene: SceneId) => void;
}

const JourneyContext = createContext<JourneyValue | null>(null);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [nav, setNav] = useState<Nav>({ scene: "welcome", direction: 1 });
  const [savings, setSavings] = useState<SavingsState>({ amount: null, unknown: false, choice: null });
  const [income, setIncome] = useState<IncomeState>({ manualTotal: 8000, sources: [] });
  const [budget, setBudget] = useState<BudgetState>({ amounts: suggestSplit(8000), basis: null });
  const [route, setRoute] = useState<RouteChoice | null>(null);
  const [profile, setProfile] = useState<ProfileAnswers>({});
  const [plan, setPlan] = useState<PlanState>({ monthly: null, scenario: "mid", years: 10, customRate: 6, category: null });
  const [returnTo, setReturnTo] = useState<SceneId | null>(null);
  const [draft, setDraft] = useState<VerdictDraft>({ ids: null, amounts: null });
  const [saved, setSaved] = useState<SavedPlan | null>(null);
  const [tracking, setTracking] = useState<Tracking>(EMPTY_TRACKING);
  const [hydrated, setHydrated] = useState(false);

  // Restore the confirmed plan and the user's own records from this browser.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data?.saved && typeof data.saved.monthly === "number" && Array.isArray(data.saved.destinations)) setSaved(data.saved);
        if (data?.tracking && typeof data.tracking === "object") setTracking({ ...EMPTY_TRACKING, ...data.tracking });
      }
    } catch {
      /* corrupt or unavailable storage: start fresh */
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ saved, tracking }));
    } catch {
      /* storage full or blocked: the plan still works for this session */
    }
  }, [hydrated, saved, tracking]);

  const goNext = useCallback(
    () =>
      setNav((n) => ({
        scene: SCENES[Math.min(SCENES.indexOf(n.scene) + 1, SCENES.length - 1)],
        direction: 1,
      })),
    [],
  );
  const goBack = useCallback(
    () =>
      setNav((n) => ({
        scene: SCENES[Math.max(SCENES.indexOf(n.scene) - 1, 0)],
        direction: -1,
      })),
    [],
  );

  const goTo = useCallback(
    (scene: SceneId) =>
      setNav((n) => ({
        scene,
        direction: SCENES.indexOf(scene) >= SCENES.indexOf(n.scene) ? 1 : -1,
      })),
    [],
  );

  const value = useMemo(
    () => ({
      ...nav,
      savings,
      setSavings,
      income,
      setIncome,
      budget,
      setBudget,
      route,
      setRoute,
      profile,
      setProfile,
      plan,
      setPlan,
      returnTo,
      setReturnTo,
      draft,
      setDraft,
      saved,
      setSaved,
      tracking,
      setTracking,
      goNext,
      goBack,
      goTo,
    }),
    [nav, savings, income, budget, route, profile, plan, returnTo, draft, saved, tracking, goNext, goBack, goTo],
  );

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error("useJourney must be used inside <JourneyProvider>");
  return ctx;
}

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
export const formatINR = (n: number) => `₹${inr.format(n)}`;
