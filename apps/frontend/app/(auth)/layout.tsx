"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useLang } from "@/lib/lang-context"
import { profileApi } from "@/lib/profile-api"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isLoading, isAuthenticated, authenticatedRequest } = useAuth()
  const { lang } = useLang()

  /**
   * Task 070: куда уходит авторизованный человек с экранов входа, решается
   * здесь и только здесь.
   *
   * Раньше этот layout безусловно слал на `/discover`, а форма регистрации —
   * на `/onboarding`, и layout выигрывал: эффекты родителя выполняются после
   * эффектов ребёнка, поэтому его `replace` приходил последним. Новый
   * пользователь всё равно попадал в пустую Discovery.
   *
   * Теперь решение принимается по фактической заполненности анкеты, так что
   * оба пути сходятся в одну точку и порядок эффектов больше ни на что не
   * влияет. Побочный эффект осознанный: вход с незаполненной анкетой тоже
   * ведёт на онбординг — без анкеты человека всё равно нет в выдаче, а шаг
   * пропускается одной ссылкой.
   *
   * Ошибку запроса глотаем и отправляем на `/discover`: застрять на экране
   * входа хуже, чем не показать онбординг.
   */
  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return
    }

    let active = true

    profileApi
      .me(authenticatedRequest)
      .then(({ profile }) => {
        if (active) {
          router.replace(profile.completion.isComplete ? "/discover" : "/onboarding")
        }
      })
      .catch(() => {
        if (active) {
          router.replace("/discover")
        }
      })

    return () => {
      active = false
    }
  }, [authenticatedRequest, isAuthenticated, isLoading, router])

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <span
          className="font-sans tracking-[0.18em] uppercase text-surface-6"
          style={{ fontSize: "10px" }}
        >
          {lang === "ru" ? "Загрузка" : "Loading"}
        </span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">{children}</div>
  )
}
