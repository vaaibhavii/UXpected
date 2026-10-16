import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const heroFont = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-hero", display: "swap" });

export const metadata: Metadata = {
  title: "UXpected",
  description: "A fresh Next.js project, ready for your ideas.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={heroFont.variable}>{children}</body>
    </html>
  );
}
