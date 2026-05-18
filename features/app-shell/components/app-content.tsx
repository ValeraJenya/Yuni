"use client"

import type { ReactNode } from "react"
import { useDemoSession } from "@/lib/demo-session"
import { DemoGate } from "./demo-gate"
import { AppNav } from "./app-nav"

export function AppContent({ children }: { children: ReactNode }) {
  const { isDemo } = useDemoSession()

  if (!isDemo) {
    return <DemoGate />
  }

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: "oklch(0.075 0.010 15)" }}>

      {/* Ambient background glows */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      >
        {/* Rose bloom — top left anchor */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-20%",
            width: "70vw",
            height: "65vh",
            background:
              "radial-gradient(ellipse at center, oklch(0.65 0.26 12 / 0.075) 0%, transparent 60%)",
            filter: "blur(80px)",
          }}
        />
        {/* Ruby ember — bottom right */}
        <div
          style={{
            position: "absolute",
            bottom: "-15%",
            right: "-15%",
            width: "55vw",
            height: "55vh",
            background:
              "radial-gradient(ellipse at center, oklch(0.48 0.22 18 / 0.055) 0%, transparent 60%)",
            filter: "blur(100px)",
          }}
        />
        {/* Warm centre haze — very subtle */}
        <div
          style={{
            position: "absolute",
            top: "35%",
            left: "30%",
            width: "50vw",
            height: "40vh",
            background:
              "radial-gradient(ellipse at center, oklch(0.65 0.18 18 / 0.022) 0%, transparent 65%)",
            filter: "blur(120px)",
          }}
        />
        {/* Noise grain */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.022,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/* Page content */}
      <main className="relative z-10 flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom nav on mobile, side nav on desktop */}
      <AppNav />
    </div>
  )
}
