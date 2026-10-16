"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Arrow, FOCUS } from "@/components/SceneParts";
import { useJourney } from "@/lib/journey";
import type { Step } from "@/lib/verdict";

/** The setup checklist. Progress is the user's own record, saved with the rest of their data. */
export default function Checklist({ steps, nextId }: { steps: Step[]; nextId: string | null }) {
  const { tracking, setTracking } = useJourney();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<string | null>(null);

  const done = steps.filter((s) => tracking.steps[s.id] === "done").length;

  const toggleDone = (id: string) =>
    setTracking((t) => {
      const next = { ...t.steps };
      if (next[id] === "done") delete next[id];
      else next[id] = "done";
      return { ...t, steps: next };
    });

  const view = (id: string) => {
    const opening = open !== id;
    setOpen(opening ? id : null);
    if (opening) setTracking((t) => (t.steps[id] ? t : { ...t, steps: { ...t.steps, [id]: "viewed" } }));
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-label="Setup progress"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={done}
          className="h-4 flex-1 overflow-hidden rounded-full border-[3px] border-[#1f2a33] bg-[#fffaf0]"
        >
          <motion.div
            initial={false}
            animate={{ width: `${(done / Math.max(steps.length, 1)) * 100}%` }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 160, damping: 20 }}
            className="h-full bg-[#39795A]"
          />
        </div>
        <span className="text-sm font-black">
          {done} of {steps.length} marked done
        </span>
      </div>

      <ol className="mt-4 space-y-3">
        {steps.map((s, i) => {
          const state = tracking.steps[s.id];
          const isDone = state === "done";
          const isOpen = open === s.id;
          const isNext = nextId === s.id;
          return (
            <li
              key={s.id}
              className={`rounded-2xl border-[3px] border-[#1f2a33] p-4 ${isDone ? "bg-[#39795A]/15" : "bg-[#fffaf0]"} ${
                isNext ? "shadow-[5px_5px_0_#C04C37]" : "shadow-[3px_3px_0_#1f2a33]"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[3px] border-[#1f2a33] text-sm font-black ${
                    isDone ? "bg-[#39795A] text-[#F8F0DE]" : "bg-[#E7BD52]"
                  }`}
                >
                  {isDone ? "✓" : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-base font-bold leading-snug ${isDone ? "line-through decoration-2 opacity-70" : ""}`}>{s.text}</p>
                  {isNext && !isDone && <p className="mt-0.5 text-xs font-black uppercase tracking-widest text-[#C04C37]">Next up</p>}
                  {state === "viewed" && !isDone && <p className="mt-0.5 text-xs font-semibold text-[#1f2a33]/60">Details viewed</p>}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {s.viewLabel && (
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`step-${s.id}`}
                        onClick={() => view(s.id)}
                        className={`min-h-11 cursor-pointer rounded-full border-[3px] border-[#1f2a33] bg-[#E7BD52] px-4 text-xs font-black tracking-wider shadow-[2px_2px_0_#1f2a33] ${FOCUS}`}
                      >
                        {s.viewLabel}
                      </button>
                    )}
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isDone}
                      onClick={() => toggleDone(s.id)}
                      className={`min-h-11 cursor-pointer rounded-full border-[3px] border-[#1f2a33] px-4 text-xs font-black tracking-wider shadow-[2px_2px_0_#1f2a33] ${
                        isDone ? "bg-[#39795A] text-[#F8F0DE]" : "bg-[#F8F0DE]"
                      } ${FOCUS}`}
                    >
                      {isDone ? "✓ MARKED AS COMPLETED" : "MARK AS COMPLETED"}
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {(isOpen || (!s.viewLabel && false)) && (
                      <motion.div
                        id={`step-${s.id}`}
                        initial={reduce ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="mt-3 text-sm font-medium leading-snug">{s.detail}</p>
                        {s.link && (
                          <a
                            href={s.link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-2 inline-block min-h-11 py-2 text-sm font-black underline decoration-[#245D91] decoration-wavy underline-offset-4 ${FOCUS}`}
                          >
                            {s.link.label} <Arrow /> <span className="sr-only">(opens in a new tab)</span>
                          </a>
                        )}
                        <p className="mt-1 text-xs font-semibold text-[#1f2a33]/60">
                          Nothing is opened or set up from this app. These are pointers to official sources.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!s.viewLabel && <p className="mt-2 text-sm font-medium leading-snug text-[#1f2a33]/75">{s.detail}</p>}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
