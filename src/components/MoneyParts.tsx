"use client";

import { useEffect, useState } from "react";
import type { BudgetKey } from "@/lib/journey";

const INK = "#1f2a33";

/* ---------- Desk props (original doodles) ---------- */

export function Wallet({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 90 70" className={`pointer-events-none absolute ${className}`}>
      <path d="M14 14 L58 4 L64 14" fill="#39795A" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <rect x="4" y="12" width="80" height="52" rx="10" fill="#C04C37" stroke={INK} strokeWidth="3" />
      <rect x="50" y="30" width="38" height="20" rx="8" fill="#E7BD52" stroke={INK} strokeWidth="3" />
      <circle cx="64" cy="40" r="3" fill={INK} />
    </svg>
  );
}

export function Calculator({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 70 90" className={`pointer-events-none absolute ${className}`}>
      <rect x="4" y="4" width="62" height="82" rx="10" fill="#245D91" stroke={INK} strokeWidth="3" />
      <rect x="12" y="12" width="46" height="18" rx="4" fill="#F8F0DE" stroke={INK} strokeWidth="2.5" />
      <text x="54" y="26" textAnchor="end" fontSize="13" fontWeight="900" fill={INK}>
        8,000
      </text>
      {[0, 1, 2].flatMap((r) =>
        [0, 1, 2].map((c) => (
          <circle key={`${r}${c}`} cx={20 + c * 15} cy={44 + r * 14} r="5" fill={r === 2 && c === 2 ? "#E7BD52" : "#F8F0DE"} stroke={INK} strokeWidth="2" />
        )),
      )}
    </svg>
  );
}

export function Notebook({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 80 96" className={`pointer-events-none absolute ${className}`}>
      <rect x="8" y="4" width="68" height="88" rx="8" fill="#E7BD52" stroke={INK} strokeWidth="3" />
      {[16, 32, 48, 64, 80].map((y) => (
        <rect key={y} x="2" y={y - 4} width="14" height="8" rx="4" fill="#F8F0DE" stroke={INK} strokeWidth="2.5" />
      ))}
      <path d="M28 26 H66 M28 42 H60 M28 58 H66 M28 74 H50" stroke={INK} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Category motifs ---------- */

export function Motif({ kind, className = "" }: { kind: BudgetKey; className?: string }) {
  const common = { stroke: INK, strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className={className}>
      {kind === "essentials" && (
        <>
          <path d="M6 24 L24 8 L42 24 V42 H6 Z" fill="#F8F0DE" {...common} />
          <rect x="19" y="29" width="10" height="13" rx="2" fill="#E7BD52" {...common} />
        </>
      )}
      {kind === "fun" && (
        <>
          <ellipse cx="24" cy="19" rx="13" ry="15" fill="#C04C37" {...common} />
          <path d="M24 34 Q 20 40 25 46" fill="none" {...common} />
          <path d="M18 12 Q 15 16 17 20" stroke="#F8F0DE" strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      )}
      {kind === "emergency" && (
        <>
          <path d="M5 26 A19 19 0 0 1 43 26 Z" fill="#E7BD52" {...common} />
          <path d="M24 26 V40 Q 24 45 19 43" fill="none" {...common} />
        </>
      )}
      {kind === "invest" && (
        <>
          <path d="M24 44 V22" fill="none" {...common} />
          <path d="M24 26 Q 10 26 9 12 Q 22 12 24 26 Z" fill="#39795A" {...common} />
          <path d="M24 20 Q 38 20 39 6 Q 26 6 24 20 Z" fill="#E7BD52" {...common} />
        </>
      )}
    </svg>
  );
}

/* ---------- Validated whole-rupee input ---------- */

interface MoneyInputProps {
  id: string;
  value: number | null;
  onChange: (v: number | null) => void;
  /** Treat an empty field as ₹0 instead of "no value". */
  emptyIsZero?: boolean;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  boxClassName?: string;
  inputClassName?: string;
  prefixClassName?: string;
  errorClassName?: string;
}

/** Only digits can be typed; negatives, decimals and letters are rejected with a short hint. */
export function MoneyInput({
  id,
  value,
  onChange,
  emptyIsZero = false,
  ariaLabel,
  placeholder,
  className = "",
  boxClassName = "",
  inputClassName = "",
  prefixClassName = "",
  errorClassName = "text-[#C04C37]",
}: MoneyInputProps) {
  const [raw, setRaw] = useState(value === null ? "" : String(value));
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const current = raw === "" ? (emptyIsZero ? 0 : null) : Number(raw);
    if (current !== value) setRaw(value === null ? "" : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handle = (text: string) => {
    if (text.includes("-")) return setErr("Negative amounts aren't possible here.");
    const digits = text.replace(/[₹,\s]/g, "");
    if (!/^\d*$/.test(digits)) return setErr("Whole rupees only, please.");
    if (digits.length > 9) return setErr("That's a big number! Try something smaller.");
    const clean = digits.replace(/^0+(?=\d)/, "");
    setErr(null);
    setRaw(clean);
    onChange(clean === "" ? (emptyIsZero ? 0 : null) : Number(clean));
  };

  return (
    <div className={className}>
      <div className={`flex items-center ${boxClassName}`}>
        <span aria-hidden="true" className={prefixClassName}>
          ₹
        </span>
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          aria-label={ariaLabel}
          aria-invalid={err !== null}
          aria-describedby={`${id}-err`}
          placeholder={placeholder}
          value={raw}
          onChange={(e) => handle(e.target.value)}
          onBlur={() => setErr(null)}
          className={`w-full min-w-0 bg-transparent outline-none ${inputClassName}`}
        />
      </div>
      <p id={`${id}-err`} role="alert" className={`min-h-4 text-xs font-semibold ${errorClassName}`}>
        {err}
      </p>
    </div>
  );
}
