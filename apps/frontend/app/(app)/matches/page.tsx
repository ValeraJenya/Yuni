"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Ban, Clock, Flag, Flame, Heart } from "lucide-react"
import { ApiError } from "@/lib/auth-api"
import { blocksApi } from "@/lib/blocks-api"
import { useAuth } from "@/lib/auth-context"
import { useLang } from "@/lib/lang-context"
import { matchesApi, type MatchSummary } from "@/lib/matches-api"
import { reportsApi } from "@/lib/reports-api"

const copy = {
  ru: {
    eyebrow: "Взаимная симпатия",
    title: "Матчи",
    empty: "Пока нет матчей.",
    emptySub: "Зайди в поиск и поставь несколько лайков.",
    discoverCta: "Перейти в поиск",
    loading: "Загружаем матчи...",
    loadError: "Не удалось загрузить матчи.",
    blockLabel: "Заблокировать",
    reportLabel: "Пожаловаться",
    blockConfirm: (name: string) => `Заблокировать ${name}? Матч исчезнет.`,
    blockSuccess: "Пользователь заблокирован.",
    blockError: "Не удалось заблокировать пользователя.",
    reportSuccess: "Жалоба отправлена.",
    reportError: "Не удалось отправить жалобу.",
    online: "В сети",
    expiresIn: (days: number, hours: number) =>
      days > 0 ? `Истекает через ${days} д` : `Истекает через ${hours} ч`,
    justMatched: "Только что",
    minutesAgo: (m: number) => `${m} мин назад`,
    hoursAgo: (h: number) => `${h} ч назад`,
    daysAgo: (d: number) => `${d} д назад`,
    inMessages: "Продолжается в чате",
    activeNote: (n: number) =>
      n === 1 ? "1 активный матч" : `${n} активных матча`,
  },
  en: {
    eyebrow: "Mutual interest",
    title: "Matches",
    empty: "No matches yet.",
    emptySub: "Head to Discover and start liking profiles.",
    discoverCta: "Go to Discover",
    loading: "Loading matches...",
    loadError: "Could not load matches.",
    blockLabel: "Block",
    reportLabel: "Report",
    blockConfirm: (name: string) => `Block ${name}? This match will disappear.`,
    blockSuccess: "User blocked.",
    blockError: "Could not block this user.",
    reportSuccess: "Report sent.",
    reportError: "Could not send report.",
    online: "Online",
    expiresIn: (days: number, hours: number) =>
      days > 0 ? `Expires in ${days}d` : `Expires in ${hours}h`,
    justMatched: "Just now",
    minutesAgo: (m: number) => `${m}m ago`,
    hoursAgo: (h: number) => `${h}h ago`,
    daysAgo: (d: number) => `${d}d ago`,
    inMessages: "Ongoing in Messages",
    activeNote: (n: number) =>
      n === 1 ? "1 active match" : `${n} active matches`,
  },
}

function relativeTime(isoDate: string, nowMs: number, t: typeof copy["ru"]) {
  const diff = (nowMs - new Date(isoDate).getTime()) / 1000
  if (diff < 120) return t.justMatched
  if (diff < 3600) return t.minutesAgo(Math.floor(diff / 60))
  if (diff < 86400) return t.hoursAgo(Math.floor(diff / 3600))
  return t.daysAgo(Math.floor(diff / 86400))
}

function timeUntilExpiry(expiresAt: string, nowMs: number, t: typeof copy["ru"]) {
  const remaining = new Date(expiresAt).getTime() - nowMs
  if (remaining <= 0) return null
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return t.expiresIn(days, hours)
}

export default function MatchesPage() {
  const { lang } = useLang()
  const { authenticatedRequest, isLoading: authLoading } = useAuth()
  const t = copy[lang]
  const [matches, setMatches] = useState<MatchSummary[]>([])
  const [isMatchesLoading, setIsMatchesLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [moderationError, setModerationError] = useState<string | null>(null)
  const [moderationMessage, setModerationMessage] = useState<string | null>(null)
  const [pendingModerationUserId, setPendingModerationUserId] = useState<
    string | null
  >(null)
  const [nowMs, setNowMs] = useState(0)

  useEffect(() => {
    if (authLoading) {
      return
    }

    let active = true
    const requestStartedAt = Date.now()

    matchesApi
      .getMyMatches(authenticatedRequest)
      .then((response) => {
        if (active) {
          setNowMs(requestStartedAt)
          setLoadError(null)
          setMatches(response.matches)
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof ApiError ? error.message : t.loadError)
        }
      })
      .finally(() => {
        if (active) {
          setIsMatchesLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [authLoading, authenticatedRequest, t.loadError])

  async function blockMatch(match: MatchSummary) {
    const targetUserId = match.matchedProfile.userId
    const profileName = match.matchedProfile.displayName ?? match.matchedProfile.handle

    if (
      pendingModerationUserId ||
      !window.confirm(t.blockConfirm(profileName))
    ) {
      return
    }

    setPendingModerationUserId(targetUserId)
    setModerationError(null)
    setModerationMessage(null)

    try {
      await blocksApi.blockUser(authenticatedRequest, targetUserId)
      setMatches((current) => current.filter((item) => item.id !== match.id))
      setModerationMessage(t.blockSuccess)
    } catch (error) {
      setModerationError(error instanceof ApiError ? error.message : t.blockError)
    } finally {
      setPendingModerationUserId(null)
    }
  }

  async function reportMatch(match: MatchSummary) {
    const targetUserId = match.matchedProfile.userId

    if (pendingModerationUserId) {
      return
    }

    setPendingModerationUserId(targetUserId)
    setModerationError(null)
    setModerationMessage(null)

    try {
      await reportsApi.reportUser(authenticatedRequest, {
        targetUserId,
        reason: "other",
      })
      setModerationMessage(t.reportSuccess)
    } catch (error) {
      setModerationError(error instanceof ApiError ? error.message : t.reportError)
    } finally {
      setPendingModerationUserId(null)
    }
  }

  const activeMatches = matches.filter(
    (match) =>
      match.status === "active" && new Date(match.expiresAt).getTime() > nowMs,
  )

  return (
    <div className="min-h-screen flex flex-col md:pl-[220px]">

      {/* ── Header ───────────────────────────────────────── */}
      <header className="px-5 pt-6 pb-6 md:px-10 md:pt-8 md:pb-7">
        <span
          className="font-sans font-medium tracking-[0.20em] uppercase block mb-1"
          style={{ fontSize: "9px", color: "oklch(0.65 0.26 12 / 0.70)" }}
        >
          {t.eyebrow}
        </span>
        <div className="flex items-center gap-3">
          <h1
            className="font-display font-light tracking-[-0.01em]"
            style={{ fontSize: "1.55rem", color: "oklch(0.90 0.005 60)", lineHeight: 1.1 }}
          >
            {t.title}
          </h1>
          {activeMatches.length > 0 && (
            <span
              className="flex items-center justify-center rounded-full font-sans font-semibold text-white"
              style={{
                width: "22px",
                height: "22px",
                fontSize: "10px",
                background: "oklch(0.65 0.26 12)",
                boxShadow: "0 0 14px oklch(0.65 0.26 12 / 0.45)",
              }}
            >
              {activeMatches.length}
            </span>
          )}
        </div>
        {activeMatches.length > 0 && (
          <p
            className="font-sans mt-1.5"
            style={{ fontSize: "12px", color: "oklch(0.30 0.008 15)" }}
          >
            {t.activeNote(activeMatches.length)}
          </p>
        )}
      </header>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="flex-1 px-4 md:px-8 pb-24 md:pb-12">
        {(moderationError || moderationMessage) && (
          <p
            className="font-sans mb-4 rounded-xl px-4 py-3"
            role="status"
            style={{
              fontSize: "12px",
              color: moderationError
                ? "oklch(0.60 0.18 25 / 0.85)"
                : "oklch(0.62 0.15 145 / 0.85)",
              background: "oklch(0.11 0.012 15 / 0.80)",
              border: moderationError
                ? "1px solid oklch(0.55 0.20 25 / 0.25)"
                : "1px solid oklch(0.62 0.15 145 / 0.22)",
            }}
          >
            {moderationError ?? moderationMessage}
          </p>
        )}
        {isMatchesLoading ? (
          <div className="flex flex-col items-center gap-4 text-center py-20">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: "oklch(0.65 0.26 12 / 0.07)",
                border: "1px solid oklch(0.65 0.26 12 / 0.14)",
              }}
            >
              <Heart size={20} style={{ color: "oklch(0.65 0.26 12 / 0.55)" }} strokeWidth={1.5} />
            </div>
            <p className="font-sans" style={{ fontSize: "13px", color: "oklch(0.42 0.008 15)" }}>
              {t.loading}
            </p>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-4 text-center py-20">
            <p className="font-display font-light" style={{ fontSize: "1.4rem", color: "oklch(0.72 0.005 60)" }}>
              {t.loadError}
            </p>
            <p className="font-sans max-w-xs" style={{ fontSize: "13px", color: "oklch(0.45 0.008 15)" }}>
              {loadError}
            </p>
          </div>
        ) : activeMatches.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-6 text-center py-20">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: "oklch(0.65 0.26 12 / 0.07)",
                border: "1px solid oklch(0.65 0.26 12 / 0.14)",
                boxShadow: "0 0 36px oklch(0.65 0.26 12 / 0.06)",
              }}
            >
              <Heart size={22} style={{ color: "oklch(0.65 0.26 12 / 0.55)" }} strokeWidth={1.5} />
            </div>
            <div>
              <p
                className="font-display font-light mb-2"
                style={{ fontSize: "1.55rem", color: "oklch(0.72 0.005 60)", lineHeight: 1.05 }}
              >
                {t.empty}
              </p>
              <p className="font-sans" style={{ fontSize: "13px", color: "oklch(0.34 0.008 15)" }}>
                {t.emptySub}
              </p>
            </div>
            <Link
              href="/discover"
              className="flex items-center gap-2 rounded-full px-7 py-3.5 font-sans font-medium transition-all hover:brightness-110"
              style={{
                fontSize: "13px",
                color: "white",
                background: "oklch(0.65 0.26 12)",
                boxShadow: "0 0 26px oklch(0.65 0.26 12 / 0.30)",
              }}
            >
              <Flame size={13} />
              {t.discoverCta}
            </Link>
          </div>
        ) : (
          /* Match grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {activeMatches.map((match) => {
              const profileName = match.matchedProfile.displayName ?? match.matchedProfile.handle
              const primaryPhotoUrl = match.matchedProfile.primaryPhotoUrl
              const expiry = timeUntilExpiry(match.expiresAt, nowMs, t)
              const isModerationPending =
                pendingModerationUserId === match.matchedProfile.userId
              const isExpiringSoon =
                new Date(match.expiresAt).getTime() - nowMs < 2 * 24 * 60 * 60 * 1000

              return (
                <div
                  key={match.id}
                  className="group relative rounded-2xl overflow-hidden transition-all"
                  style={{
                    aspectRatio: "3/4",
                    background: "oklch(0.10 0.012 15)",
                    border: match.conversationStarted
                      ? "1px solid oklch(0.65 0.26 12 / 0.28)"
                      : "1px solid oklch(0.18 0.012 15 / 0.65)",
                    boxShadow: match.conversationStarted
                      ? "0 4px 24px oklch(0.65 0.26 12 / 0.12), 0 0 0 1px oklch(0.65 0.26 12 / 0.06)"
                      : "0 4px 16px oklch(0.04 0.005 15 / 0.40)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "oklch(0.65 0.26 12 / 0.36)"
                    e.currentTarget.style.boxShadow =
                      "0 8px 36px oklch(0.65 0.26 12 / 0.16), 0 0 0 1px oklch(0.65 0.26 12 / 0.10)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = match.conversationStarted
                      ? "oklch(0.65 0.26 12 / 0.28)"
                      : "oklch(0.18 0.012 15 / 0.65)"
                    e.currentTarget.style.boxShadow = match.conversationStarted
                      ? "0 4px 24px oklch(0.65 0.26 12 / 0.12), 0 0 0 1px oklch(0.65 0.26 12 / 0.06)"
                      : "0 4px 16px oklch(0.04 0.005 15 / 0.40)"
                  }}
                >
                  <Link
                    href={`/messages?chat=${match.id}`}
                    aria-label={profileName}
                    className="absolute inset-0 z-10"
                  />
                  {primaryPhotoUrl ? (
                    <Image
                      src={primaryPhotoUrl}
                      alt={profileName}
                      fill
                      draggable={false}
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        background: "oklch(0.13 0.012 15)",
                        color: "oklch(0.65 0.26 12 / 0.70)",
                      }}
                    >
                      <Heart size={28} strokeWidth={1.5} />
                    </div>
                  )}

                  {/* Vignette */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: [
                        "linear-gradient(to top, oklch(0.05 0.010 15 / 0.96) 0%, oklch(0.06 0.008 15 / 0.55) 32%, transparent 58%)",
                        "linear-gradient(to bottom, oklch(0.05 0.008 15 / 0.28) 0%, transparent 20%)",
                      ].join(", "),
                    }}
                  />

                  {/* Unread badge */}
                  {match.conversationStarted && (
                    <div
                      className="absolute top-3 right-3"
                      style={{
                        width: "9px",
                        height: "9px",
                        borderRadius: "50%",
                        background: "oklch(0.65 0.26 12)",
                        boxShadow: "0 0 10px oklch(0.65 0.26 12 / 0.75)",
                        border: "1.5px solid oklch(0.07 0.008 15)",
                      }}
                    />
                  )}

                  <div className="absolute top-3 left-3 z-20 flex gap-1.5">
                    <button
                      type="button"
                      title={t.reportLabel}
                      aria-label={t.reportLabel}
                      disabled={Boolean(pendingModerationUserId)}
                      onClick={() => void reportMatch(match)}
                      className="flex h-7 w-7 items-center justify-center rounded-full transition-all disabled:opacity-45"
                      style={{
                        color: "oklch(0.88 0.005 60)",
                        background: "oklch(0.07 0.012 15 / 0.78)",
                        border: "1px solid oklch(0.28 0.012 15 / 0.58)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <Flag size={12} strokeWidth={1.7} />
                    </button>
                    <button
                      type="button"
                      title={t.blockLabel}
                      aria-label={t.blockLabel}
                      disabled={Boolean(pendingModerationUserId)}
                      onClick={() => void blockMatch(match)}
                      className="flex h-7 w-7 items-center justify-center rounded-full transition-all disabled:opacity-45"
                      style={{
                        color: isModerationPending
                          ? "oklch(0.60 0.18 25 / 0.65)"
                          : "oklch(0.88 0.005 60)",
                        background: "oklch(0.07 0.012 15 / 0.78)",
                        border: "1px solid oklch(0.55 0.20 25 / 0.34)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <Ban size={12} strokeWidth={1.7} />
                    </button>
                  </div>

                  {/* Online indicator */}
                  {/* Expiry indicator — only shows when close to expiring */}
                  {isExpiringSoon && expiry && (
                    <div
                      className="absolute bottom-0 left-0 right-0 px-3 pt-6 pb-3 flex items-end justify-between"
                    >
                      <div>
                        <p
                          className="font-display font-light"
                          style={{
                            fontSize: "1.05rem",
                            color: "oklch(0.94 0.004 60)",
                            lineHeight: 1.15,
                            textShadow: "0 2px 12px oklch(0.04 0.005 15 / 0.80)",
                          }}
                        >
                          {profileName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock size={9} style={{ color: "oklch(0.65 0.26 12 / 0.70)" }} />
                          <span
                            className="font-sans"
                            style={{ fontSize: "9.5px", color: "oklch(0.65 0.26 12 / 0.70)" }}
                          >
                            {expiry}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Normal info — no expiry warning */}
                  {!isExpiringSoon && (
                    <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-4">
                      <p
                        className="font-display font-light"
                        style={{
                          fontSize: "1.05rem",
                          color: "oklch(0.95 0.004 60)",
                          lineHeight: 1.1,
                          textShadow: "0 2px 12px oklch(0.04 0.005 15 / 0.80)",
                        }}
                      >
                        {profileName}
                      </p>
                      <p
                        className="font-sans mt-0.5"
                        style={{ fontSize: "10px", color: "oklch(0.36 0.008 15)" }}
                      >
                        {relativeTime(match.matchedAt, nowMs, t)}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
