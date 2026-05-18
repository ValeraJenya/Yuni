"use client"

import Image from "next/image"
import Link from "next/link"
import { Heart, Star, Flame, Clock } from "lucide-react"
import { MATCHES, CHATS } from "@/mock-data/matches"
import { useLang } from "@/lib/lang-context"

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

const copy = {
  ru: {
    eyebrow: "Взаимная симпатия",
    title: "Матчи",
    empty: "Пока нет матчей.",
    emptySub: "Зайди в поиск и поставь несколько лайков.",
    discoverCta: "Перейти в поиск",
    online: "В сети",
    superlike: "Суперлайк",
    expiresIn: (days: number, hours: number) =>
      days > 0 ? `Истекает через ${days} д` : `Истекает через ${hours} ч`,
    justMatched: "Только что",
    minutesAgo: (m: number) => `${m} мин назад`,
    hoursAgo: (h: number) => `${h} ч назад`,
    daysAgo: (d: number) => `${d} д назад`,
    inMessages: "Продолжается в чате",
    activeNote: (n: number) =>
      n === 1 ? "1 матч исчезнет через 7 дней" : `${n} матча исчезнут через 7 дней`,
  },
  en: {
    eyebrow: "Mutual interest",
    title: "Matches",
    empty: "No matches yet.",
    emptySub: "Head to Discover and start liking profiles.",
    discoverCta: "Go to Discover",
    online: "Online",
    superlike: "Super like",
    expiresIn: (days: number, hours: number) =>
      days > 0 ? `Expires in ${days}d` : `Expires in ${hours}h`,
    justMatched: "Just now",
    minutesAgo: (m: number) => `${m}m ago`,
    hoursAgo: (h: number) => `${h}h ago`,
    daysAgo: (d: number) => `${d}d ago`,
    inMessages: "Ongoing in Messages",
    activeNote: (n: number) =>
      n === 1 ? "1 match expires in 7 days" : `${n} matches expire in 7 days`,
  },
}

function relativeTime(isoDate: string, t: typeof copy["ru"]) {
  const diff = (Date.now() - new Date(isoDate).getTime()) / 1000
  if (diff < 120) return t.justMatched
  if (diff < 3600) return t.minutesAgo(Math.floor(diff / 60))
  if (diff < 86400) return t.hoursAgo(Math.floor(diff / 3600))
  return t.daysAgo(Math.floor(diff / 86400))
}

function timeUntilExpiry(matchedAt: string, t: typeof copy["ru"]) {
  const expiresAt = new Date(matchedAt).getTime() + SEVEN_DAYS_MS
  const remaining = expiresAt - Date.now()
  if (remaining <= 0) return null
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return t.expiresIn(days, hours)
}

// A match "lives in Messages" if the user has sent at least one message in the chat
function hasStartedConversation(matchId: string): boolean {
  const chat = CHATS.find((c) => c.id === matchId)
  if (!chat) return false
  return chat.messages.some((m) => m.senderId === "me")
}

export default function MatchesPage() {
  const { lang } = useLang()
  const t = copy[lang]

  // Filter: within 7-day window AND not already an active conversation in Messages
  const activeMatches = MATCHES.filter((m) => {
    const age = Date.now() - new Date(m.matchedAt).getTime()
    const withinWindow = age < SEVEN_DAYS_MS
    const inMessages = hasStartedConversation(m.id)
    return withinWindow && !inMessages
  })

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
        {activeMatches.length === 0 ? (
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
              const expiry = timeUntilExpiry(match.matchedAt, t)
              const isExpiringSoon =
                Date.now() - new Date(match.matchedAt).getTime() > SEVEN_DAYS_MS - 2 * 24 * 60 * 60 * 1000

              return (
                <Link
                  key={match.id}
                  href={`/messages?chat=${match.id}`}
                  className="group relative rounded-2xl overflow-hidden transition-all"
                  style={{
                    aspectRatio: "3/4",
                    background: "oklch(0.10 0.012 15)",
                    border: match.hasUnread
                      ? "1px solid oklch(0.65 0.26 12 / 0.28)"
                      : "1px solid oklch(0.18 0.012 15 / 0.65)",
                    boxShadow: match.hasUnread
                      ? "0 4px 24px oklch(0.65 0.26 12 / 0.12), 0 0 0 1px oklch(0.65 0.26 12 / 0.06)"
                      : "0 4px 16px oklch(0.04 0.005 15 / 0.40)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "oklch(0.65 0.26 12 / 0.36)"
                    e.currentTarget.style.boxShadow =
                      "0 8px 36px oklch(0.65 0.26 12 / 0.16), 0 0 0 1px oklch(0.65 0.26 12 / 0.10)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = match.hasUnread
                      ? "oklch(0.65 0.26 12 / 0.28)"
                      : "oklch(0.18 0.012 15 / 0.65)"
                    e.currentTarget.style.boxShadow = match.hasUnread
                      ? "0 4px 24px oklch(0.65 0.26 12 / 0.12), 0 0 0 1px oklch(0.65 0.26 12 / 0.06)"
                      : "0 4px 16px oklch(0.04 0.005 15 / 0.40)"
                  }}
                >
                  <Image
                    src={match.profile.photos[0]}
                    alt={match.profile.name}
                    fill
                    draggable={false}
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />

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
                  {match.hasUnread && (
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

                  {/* Online indicator */}
                  {match.profile.isOnline && (
                    <div className="absolute top-3 left-3">
                      <span
                        className="flex items-center gap-1.5 rounded-full px-2 py-1 font-sans"
                        style={{
                          fontSize: "9px",
                          color: "oklch(0.80 0.18 145)",
                          background: "oklch(0.07 0.010 15 / 0.75)",
                          border: "1px solid oklch(0.78 0.20 145 / 0.22)",
                          backdropFilter: "blur(8px)",
                        }}
                      >
                        <span
                          style={{
                            width: "5px",
                            height: "5px",
                            borderRadius: "50%",
                            background: "oklch(0.78 0.20 145)",
                            display: "inline-block",
                            boxShadow: "0 0 5px oklch(0.78 0.20 145 / 0.75)",
                          }}
                        />
                      </span>
                    </div>
                  )}

                  {/* Superlike badge */}
                  {match.isSuperLike && (
                    <div
                      className="absolute top-3 left-3 flex items-center justify-center rounded-full"
                      style={{
                        width: "22px",
                        height: "22px",
                        background: "oklch(0.65 0.20 220)",
                        border: "1.5px solid oklch(0.07 0.010 15)",
                        boxShadow: "0 0 10px oklch(0.65 0.20 220 / 0.45)",
                      }}
                    >
                      <Star size={10} strokeWidth={2} color="white" />
                    </div>
                  )}

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
                          {match.profile.name}
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
                        {match.profile.name}
                        <span
                          className="font-sans font-light ml-1.5"
                          style={{ fontSize: "0.82rem", color: "oklch(0.56 0.006 60)" }}
                        >
                          {match.profile.age}
                        </span>
                      </p>
                      <p
                        className="font-sans mt-0.5"
                        style={{ fontSize: "10px", color: "oklch(0.36 0.008 15)" }}
                      >
                        {relativeTime(match.matchedAt, t)}
                      </p>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
