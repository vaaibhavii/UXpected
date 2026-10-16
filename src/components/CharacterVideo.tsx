"use client";

import { useCallback, useEffect, useRef } from "react";

const IDLE = ["/assets/typing.webm", "/assets/rhythm.webm"];
const BREAK = "/assets/stretching.webm";
const CLICK = "/assets/click-pose.webm";

export default function CharacterVideo({
  reactKey = 0,
  onBreakHalfway,
  onBreakEnd,
}: {
  reactKey?: number;
  onBreakHalfway?: () => void;
  onBreakEnd?: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const idleIndex = useRef(0);
  const loops = useRef(0);
  const mode = useRef<"idle" | "break" | "click">("idle");
  const halfwayTriggered = useRef(false);

  const play = useCallback((src: string, loop: boolean) => {
    const v = ref.current;
    if (!v) return;
    v.loop = loop;
    v.src = src;
    v.play().catch(() => {});
  }, []);

  const playIdle = useCallback(() => {
    mode.current = "idle";
    loops.current = 0;
    play(IDLE[idleIndex.current % IDLE.length], false);
  }, [play]);

  const startBreak = useCallback(() => {
    mode.current = "break";
    halfwayTriggered.current = false;
    play(BREAK, false);
  }, [play]);

  useEffect(() => {
    // Start directly with the stretching sequence, or play immediately
    startBreak();
  }, [startBreak]);

  // Parent can trigger the click reaction by bumping `reactKey`.
  useEffect(() => {
    if (reactKey > 0) {
      mode.current = "click";
      play(CLICK, false);
    }
  }, [reactKey, play]);

  const onTimeUpdate = () => {
    if (mode.current === "break" && !halfwayTriggered.current) {
      const v = ref.current;
      if (v && v.duration > 0 && v.currentTime >= v.duration / 2) {
        halfwayTriggered.current = true;
        onBreakHalfway?.();
      }
    }
  };

  const onEnded = () => {
    if (mode.current === "idle") {
      loops.current += 1;
      if (loops.current >= 3) {
        startBreak();
      } else {
        play(IDLE[idleIndex.current % IDLE.length], false);
      }
    } else {
      if (mode.current === "break") {
        if (!halfwayTriggered.current) {
          halfwayTriggered.current = true;
          onBreakHalfway?.();
        }
        onBreakEnd?.();
      }
      idleIndex.current += 1;
      playIdle();
    }
  };

  const onClick = () => {
    if (mode.current === "click") return;
    if (mode.current === "break") {
      if (!halfwayTriggered.current) {
        halfwayTriggered.current = true;
        onBreakHalfway?.();
      }
      onBreakEnd?.();
    }
    mode.current = "click";
    play(CLICK, false);
  };

  return (
    <video
      id="character-video"
      ref={ref}
      className="w-full h-full object-contain pointer-events-auto cursor-pointer"
      autoPlay
      muted
      playsInline
      onTimeUpdate={onTimeUpdate}
      onEnded={onEnded}
      onError={() => {
        if (mode.current === "break") {
          if (!halfwayTriggered.current) {
            halfwayTriggered.current = true;
            onBreakHalfway?.();
          }
          onBreakEnd?.();
          playIdle();
        }
      }}
      onClick={onClick}
    />
  );
}
