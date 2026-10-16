"use client";

import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import CharacterVideo from "@/components/CharacterVideo";
import { useJourney } from "@/lib/journey";

export default function WelcomeScene() {
  const { goNext } = useJourney();
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);

  // Fallback in case autoplay is blocked or video fails to fire events
  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 bg-[#24353c]">
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <video
          src="/assets/room_afternoon.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div className="relative w-full h-full flex items-center justify-center">
          <CharacterVideo
            onBreakHalfway={() => setReady(true)}
            onBreakEnd={() => setReady(true)}
          />
        </div>
      </div>

      <header className="fixed top-0 left-0 right-0 z-20 flex justify-between items-start p-8 md:p-12 pointer-events-none">
        <div className="pointer-events-auto flex flex-col drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] text-white">
          <h1 className="font-(family-name:--font-hero) text-[1.6rem] md:text-[1.9rem] font-bold tracking-tight text-white leading-tight">
            Welcome, Aarav!
          </h1>
          <div className="mt-3 max-w-sm font-(family-name:--font-hero) text-[1rem] md:text-[1.1rem] font-medium leading-snug tracking-normal text-white/95">
            <p>Are you ready to become a millionaire? (well, not just yet, but here&apos;s a start)</p>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {ready && (
          <div className="absolute inset-x-0 bottom-8 z-20 flex justify-center md:bottom-12 pointer-events-none">
            <motion.button
              type="button"
              onClick={goNext}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0.2 : 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto rounded-full bg-[#f39800] px-7 py-4 text-sm font-bold tracking-wider text-white shadow-[0_4px_14px_rgba(243,152,0,0.4)] transition-colors duration-200 hover:bg-[#e08b00] active:scale-95 focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-white cursor-pointer"
            >
              LET&apos;S BEGIN <ArrowUpRight aria-hidden="true" strokeWidth={3} className="inline-block h-[1.15em] w-[1.15em] align-[-0.2em]" />
            </motion.button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
