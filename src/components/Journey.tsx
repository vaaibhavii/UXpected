"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import IncomeScene from "@/components/IncomeScene";
import BudgetScene from "@/components/BudgetScene";
import RouteScene from "@/components/RouteScene";
import DetailScene from "@/components/DetailScene";
import ProfileScene from "@/components/ProfileScene";
import PlanScene from "@/components/PlanScene";
import VerdictScene from "@/components/VerdictScene";
import DashboardScene from "@/components/DashboardScene";
import SavingsScene from "@/components/SavingsScene";
import WelcomeScene from "@/components/WelcomeScene";
import { JourneyProvider, useJourney } from "@/lib/journey";

const variants = {
  enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%" }),
  center: { x: 0 },
  exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%" }),
};

function Stage() {
  const { scene, direction } = useJourney();
  const reduce = useReducedMotion();

  return (
    <main className="relative h-screen w-screen select-none overflow-hidden bg-[#24353c]">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={scene}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={reduce ? { duration: 0.01 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {scene === "welcome" && <WelcomeScene />}
          {scene === "savings" && <SavingsScene />}
          {scene === "income" && <IncomeScene />}
          {scene === "budget" && <BudgetScene />}
          {scene === "route" && <RouteScene />}
          {scene === "steady" && <DetailScene kind="steady" />}
          {scene === "adventure" && <DetailScene kind="adventure" />}
          {scene === "profile" && <ProfileScene />}
          {scene === "plan" && <PlanScene />}
          {scene === "verdict" && <VerdictScene />}
          {scene === "dashboard" && <DashboardScene />}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

export default function Journey() {
  return (
    <JourneyProvider>
      <Stage />
    </JourneyProvider>
  );
}
