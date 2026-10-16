"use client";

import { useState } from "react";
import { useJourney } from "@/lib/journey";

const cases = ["Case 1", "Case 2", "Case 3", "Case 4", "Case 5"];

export default function MenuNav() {
  const [open, setOpen] = useState(false);
  const { goTo } = useJourney();

  return (
    <>
      <div className="fixed top-8 right-8 md:top-12 md:right-12 z-40">
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="w-12 h-12 rounded-full bg-[#f39800] hover:bg-[#e08b00] active:scale-95 transition-all duration-200 shadow-[0_4px_14px_rgba(243,152,0,0.4)] flex flex-col items-center justify-center gap-1 cursor-pointer focus:outline-none"
        >
          <span className="w-[5px] h-[5px] rounded-full bg-white" />
          <span className="w-[5px] h-[5px] rounded-full bg-white" />
          <span className="w-[5px] h-[5px] rounded-full bg-white" />
        </button>
      </div>
      <nav
        aria-hidden={!open}
        className={`fixed inset-0 z-30 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-[#24353c]/90" onClick={() => setOpen(false)} />
        <ul className="relative h-full flex flex-col items-center justify-center gap-5 text-white text-2xl font-bold">
          <li>
            <button
              type="button"
              className="cursor-pointer"
              onClick={() => {
                goTo("welcome");
                setOpen(false);
              }}
            >
              Home
            </button>
          </li>
          <li><a href="#about" onClick={() => setOpen(false)}>About</a></li>
          <li className="flex flex-col items-center gap-2">
            <span>Case</span>
            <ul className="flex flex-col items-center gap-2 text-base font-normal text-white/80">
              {cases.map((c, i) => (
                <li key={c}><a href={`#case-${i + 1}`} onClick={() => setOpen(false)}>{c}</a></li>
              ))}
            </ul>
          </li>
          <li><a href="#contact" onClick={() => setOpen(false)}>Contact</a></li>
        </ul>
      </nav>
    </>
  );
}
