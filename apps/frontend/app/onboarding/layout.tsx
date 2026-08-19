"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useLang } from "@/lib/lang-context"

/**
 * Task 070: онбординг живёт вне группы `(app)` намеренно.
 *
 * Он требует авторизации так же, как остальные экраны, но не показывает
 * `AppNav`: нижняя навигация из первого экрана после регистрации уводит в
 * Discovery, Матчи и Чаты, которые для незаполненной анкеты пусты по построению.
 * Пропустить шаг можно, но осознанно — ссылкой с названным последствием, а не
 * случайным тапом по вкладке.
 */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { isLoading, isAuthenticated } = useAuth()
  const { lang } = useLang()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/signin")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || !isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: "oklch(0.075 0.010 15)" }}
      >
        <span
          className="font-sans tracking-[0.18em] uppercase"
          style={{ fontSize: "10px", color: "oklch(0.42 0.008 15)" }}
        >
          {lang === "ru" ? "Загрузка" : "Loading"}
        </span>
      </div>
    )
  }

  return (
    <div
      className="relative min-h-screen"
      style={{ background: "oklch(0.075 0.010 15)" }}
    >
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true" style={{ zIndex: 0 }}>
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

      <div className="relative z-10">{children}</div>
    </div>
  )
}
