"use client"

import { useState } from "react"
import Image from "next/image"
import {
  ShieldCheck,
  Star,
  Pencil,
  MapPin,
  Briefcase,
  GraduationCap,
  Languages,
  ChevronRight,
  Settings,
  LogOut,
  Lock,
  Bell,
  User,
  Camera,
  Plus,
  Heart,
  TrendingUp,
} from "lucide-react"
import { ME } from "@/mock-data/profiles"
import { useLang } from "@/lib/lang-context"

const copy = {
  ru: {
    edit: "Редактировать",
    verified: "Верифицирован",
    premium: "Premium",
    completion: "Заполнен на",
    completionCta: "Улучшить",
    bioLabel: "О себе",
    interestsLabel: "Интересы",
    detailsLabel: "Детали",
    photosLabel: "Фотографии",
    statsLabel: "Статистика",
    height: "Рост",
    occupation: "Работа",
    education: "Образование",
    languages: "Языки",
    accountLabel: "Аккаунт",
    privacyLabel: "Конфиденциальность",
    notificationsLabel: "Уведомления",
    settingsLabel: "Настройки",
    logoutLabel: "Выйти",
    lookingFor: "Ищу",
    lookingForValues: {
      relationship: "Серьёзные отношения",
      casual: "Неформальное общение",
      friendship: "Дружба",
      unsure: "Пока не знаю",
    },
    cm: "см",
    likesReceived: "Лайков",
    matchesCount: "Матчей",
    profileViews: "Просмотров",
    addPhoto: "Добавить фото",
    upgradeLabel: "Улучши профиль",
    upgradeSub: "Получи больше показов и возможностей",
    upgradeCta: "Подробнее",
  },
  en: {
    edit: "Edit",
    verified: "Verified",
    premium: "Premium",
    completion: "Profile",
    completionCta: "Improve",
    bioLabel: "About me",
    interestsLabel: "Interests",
    detailsLabel: "Details",
    photosLabel: "Photos",
    statsLabel: "Stats",
    height: "Height",
    occupation: "Work",
    education: "Education",
    languages: "Languages",
    accountLabel: "Account",
    privacyLabel: "Privacy",
    notificationsLabel: "Notifications",
    settingsLabel: "Settings",
    logoutLabel: "Sign out",
    lookingFor: "Looking for",
    lookingForValues: {
      relationship: "Serious relationship",
      casual: "Casual",
      friendship: "Friendship",
      unsure: "Not sure yet",
    },
    cm: "cm",
    likesReceived: "Likes",
    matchesCount: "Matches",
    profileViews: "Views",
    addPhoto: "Add photo",
    upgradeLabel: "Boost your profile",
    upgradeSub: "Get more visibility and matches",
    upgradeCta: "Learn more",
  },
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-sans font-medium uppercase tracking-[0.18em]"
      style={{ fontSize: "9px", color: "oklch(0.32 0.008 15)" }}
    >
      {children}
    </p>
  )
}

function SettingsRow({
  icon: Icon,
  label,
  danger = false,
}: {
  icon: React.ElementType
  label: string
  danger?: boolean
}) {
  return (
    <button
      className="flex items-center gap-4 w-full px-5 py-4 transition-all text-left"
      style={{ borderBottom: "1px solid oklch(0.14 0.010 15 / 0.60)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(0.13 0.010 15 / 0.60)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <Icon
        size={15}
        strokeWidth={1.5}
        style={{
          color: danger ? "oklch(0.55 0.20 25 / 0.65)" : "oklch(0.36 0.008 15)",
          flexShrink: 0,
        }}
      />
      <span
        className="flex-1 font-sans"
        style={{
          fontSize: "13.5px",
          color: danger ? "oklch(0.60 0.18 25 / 0.75)" : "oklch(0.60 0.006 60)",
        }}
      >
        {label}
      </span>
      {!danger && (
        <ChevronRight size={13} strokeWidth={1.5} style={{ color: "oklch(0.22 0.008 15)" }} />
      )}
    </button>
  )
}

export default function ProfilePage() {
  const { lang } = useLang()
  const t = copy[lang]
  const profile = ME

  const [editingBio, setEditingBio] = useState(false)
  const [bio, setBio] = useState(profile.bio)

  // Mock stats
  const stats = [
    { icon: Heart, value: "142", label: t.likesReceived },
    { icon: Star, value: "18", label: t.matchesCount },
    { icon: TrendingUp, value: "347", label: t.profileViews },
  ]

  // Mock additional photos
  const allPhotos = [
    profile.photos[0],
    "/cta-image.jpg",
    profile.photos[0],
    "/cta-image.jpg",
  ]

  return (
    <div className="min-h-screen md:pl-[220px] pb-28 md:pb-12">

      {/* ── Desktop two-column layout wrapper ── */}
      <div className="md:flex md:gap-0 md:min-h-screen">

        {/* ── Left column: hero + photos + stats ── */}
        <div className="md:sticky md:top-0 md:self-start md:w-[340px] md:flex-shrink-0 md:min-h-screen md:border-r" style={{ borderColor: "oklch(0.16 0.010 15 / 0.60)" }}>

          {/* ── Cinematic hero ── */}
          <div
            className="relative w-full overflow-hidden"
            style={{ height: "clamp(300px, 42vw, 420px)" }}
          >
            <Image
              src={profile.photos[0]}
              alt={profile.name}
              fill
              className="object-cover object-top"
              priority
            />
            {/* Bottom fade */}
            <div
              className="absolute inset-0"
              style={{
                background: [
                  "linear-gradient(to top, oklch(0.075 0.010 15) 0%, oklch(0.075 0.010 15 / 0.72) 28%, transparent 56%)",
                  "linear-gradient(to bottom, oklch(0.075 0.010 15 / 0.40) 0%, transparent 30%)",
                ].join(", "),
              }}
            />
            {/* Rose rim glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 100%, oklch(0.65 0.26 12 / 0.12) 0%, transparent 52%)",
              }}
            />

            {/* Edit button */}
            <button
              className="absolute top-5 right-5 flex items-center gap-1.5 rounded-full px-3.5 py-2 font-sans font-medium transition-all"
              style={{
                fontSize: "11px",
                color: "oklch(0.75 0.005 60)",
                background: "oklch(0.07 0.012 15 / 0.80)",
                border: "1px solid oklch(0.28 0.012 15 / 0.50)",
                backdropFilter: "blur(14px)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.65 0.26 12 / 0.38)"
                e.currentTarget.style.color = "oklch(0.92 0.005 60)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "oklch(0.28 0.012 15 / 0.50)"
                e.currentTarget.style.color = "oklch(0.75 0.005 60)"
              }}
              aria-label={t.edit}
            >
              <Pencil size={11} strokeWidth={2} />
              {t.edit}
            </button>

            {/* Name block */}
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
              <div className="flex items-end justify-between">
                <div>
                  <h1
                    className="font-display font-light tracking-[-0.01em] mb-1"
                    style={{
                      fontSize: "clamp(2rem, 6vw, 2.6rem)",
                      color: "oklch(0.96 0.004 60)",
                      lineHeight: 1.0,
                      textShadow: "0 2px 24px oklch(0.04 0.005 15 / 0.70)",
                    }}
                  >
                    {profile.name}
                    <span
                      className="font-sans font-light ml-2"
                      style={{ fontSize: "clamp(1.2rem, 3vw, 1.5rem)", color: "oklch(0.50 0.006 60)" }}
                    >
                      {profile.age}
                    </span>
                  </h1>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={10} style={{ color: "oklch(0.65 0.26 12 / 0.80)" }} />
                    <span
                      className="font-sans"
                      style={{ fontSize: "11.5px", color: "oklch(0.44 0.008 15)" }}
                    >
                      {profile.city}
                    </span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-col items-end gap-1.5">
                  {profile.isVerified && (
                    <span
                      className="flex items-center gap-1 rounded-full px-2.5 py-1 font-sans font-medium"
                      style={{
                        fontSize: "9px",
                        color: "oklch(0.74 0.18 220)",
                        background: "oklch(0.08 0.012 15 / 0.78)",
                        border: "1px solid oklch(0.72 0.18 220 / 0.30)",
                        backdropFilter: "blur(12px)",
                      }}
                    >
                      <ShieldCheck size={9} />
                      {t.verified}
                    </span>
                  )}
                  {profile.isPremium && (
                    <span
                      className="flex items-center gap-1 rounded-full px-2.5 py-1 font-sans font-medium"
                      style={{
                        fontSize: "9px",
                        letterSpacing: "0.08em",
                        color: "oklch(0.84 0.12 72)",
                        background: "oklch(0.08 0.012 15 / 0.78)",
                        border: "1px solid oklch(0.82 0.12 72 / 0.28)",
                        backdropFilter: "blur(12px)",
                      }}
                    >
                      <Star size={8} strokeWidth={1.5} />
                      PREMIUM
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Stats row ── */}
          <div
            className="grid grid-cols-3"
            style={{ borderBottom: "1px solid oklch(0.15 0.010 15 / 0.60)" }}
          >
            {stats.map((stat, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 py-5"
                style={{
                  borderRight:
                    i < stats.length - 1 ? "1px solid oklch(0.15 0.010 15 / 0.60)" : "none",
                }}
              >
                <stat.icon
                  size={14}
                  strokeWidth={1.5}
                  style={{ color: "oklch(0.65 0.26 12 / 0.65)" }}
                />
                <span
                  className="font-display font-light"
                  style={{ fontSize: "1.3rem", color: "oklch(0.82 0.005 60)", lineHeight: 1 }}
                >
                  {stat.value}
                </span>
                <span
                  className="font-sans"
                  style={{ fontSize: "9.5px", color: "oklch(0.30 0.008 15)" }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* ── Completion bar ── */}
          <div
            className="px-5 py-5 relative overflow-hidden"
            style={{ borderBottom: "1px solid oklch(0.15 0.010 15 / 0.60)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="font-sans"
                style={{ fontSize: "12px", color: "oklch(0.42 0.008 15)" }}
              >
                {t.completion} {profile.completionPct}%
              </span>
              <button
                className="font-sans font-medium transition-colors"
                style={{ fontSize: "11px", color: "oklch(0.65 0.26 12)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.78 0.22 12)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.65 0.26 12)")}
              >
                {t.completionCta}
              </button>
            </div>
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ background: "oklch(0.16 0.010 15)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${profile.completionPct}%`,
                  background: "linear-gradient(to right, oklch(0.55 0.24 14), oklch(0.68 0.26 12))",
                  boxShadow: "0 0 10px oklch(0.65 0.26 12 / 0.50)",
                }}
              />
            </div>
          </div>

          {/* ── Photos grid ── */}
          <div className="px-5 py-5" style={{ borderBottom: "1px solid oklch(0.15 0.010 15 / 0.60)" }}>
            <div className="flex items-center justify-between mb-3.5">
              <SectionLabel>{t.photosLabel}</SectionLabel>
              <button
                className="flex items-center gap-1 font-sans font-medium"
                style={{ fontSize: "11px", color: "oklch(0.65 0.26 12)" }}
              >
                <Camera size={11} />
                {t.edit}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {allPhotos.map((src, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-xl"
                  style={{
                    aspectRatio: "1",
                    border: "1px solid oklch(0.20 0.012 15 / 0.55)",
                    background: "oklch(0.10 0.012 15)",
                  }}
                >
                  <Image
                    src={src}
                    alt={`Photo ${i + 1}`}
                    fill
                    className="object-cover object-top"
                    sizes="80px"
                  />
                  {i === 0 && (
                    <div
                      className="absolute top-1 left-1 rounded-full px-1.5 py-0.5 font-sans"
                      style={{
                        fontSize: "7px",
                        color: "oklch(0.90 0.004 60)",
                        background: "oklch(0.65 0.26 12)",
                      }}
                    >
                      {lang === "ru" ? "Главное" : "Main"}
                    </div>
                  )}
                </div>
              ))}
              {/* Add photo button */}
              <button
                className="overflow-hidden rounded-xl flex flex-col items-center justify-center gap-1 transition-all"
                style={{
                  aspectRatio: "1",
                  border: "1px dashed oklch(0.22 0.012 15 / 0.70)",
                  background: "oklch(0.10 0.010 15 / 0.50)",
                  color: "oklch(0.30 0.008 15)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "oklch(0.65 0.26 12 / 0.35)"
                  e.currentTarget.style.color = "oklch(0.65 0.26 12 / 0.65)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "oklch(0.22 0.012 15 / 0.70)"
                  e.currentTarget.style.color = "oklch(0.30 0.008 15)"
                }}
                aria-label={t.addPhoto}
              >
                <Plus size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Right column: bio, interests, details, settings ── */}
        <div className="flex-1 px-5 md:px-8 flex flex-col gap-7 pt-5 md:pt-6">

          {/* ── Upgrade banner (only show if not premium) ── */}
          {!profile.isPremium && (
            <div
              className="rounded-2xl px-5 py-4 flex items-center gap-4 relative overflow-hidden"
              style={{
                background: "oklch(0.11 0.012 15 / 0.85)",
                border: "1px solid oklch(0.65 0.26 12 / 0.20)",
                boxShadow: "0 0 32px oklch(0.65 0.26 12 / 0.07)",
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at 0% 50%, oklch(0.65 0.26 12 / 0.08) 0%, transparent 55%)",
                }}
              />
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  width: "36px",
                  height: "36px",
                  background: "oklch(0.65 0.26 12 / 0.12)",
                  border: "1px solid oklch(0.65 0.26 12 / 0.22)",
                }}
              >
                <Star size={15} strokeWidth={1.5} style={{ color: "oklch(0.65 0.26 12)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-sans font-medium"
                  style={{ fontSize: "13px", color: "oklch(0.78 0.005 60)" }}
                >
                  {t.upgradeLabel}
                </p>
                <p
                  className="font-sans"
                  style={{ fontSize: "11.5px", color: "oklch(0.36 0.008 15)" }}
                >
                  {t.upgradeSub}
                </p>
              </div>
              <button
                className="flex-shrink-0 rounded-full px-4 py-2 font-sans font-medium"
                style={{
                  fontSize: "11.5px",
                  color: "oklch(0.90 0.005 60)",
                  background: "oklch(0.65 0.26 12 / 0.18)",
                  border: "1px solid oklch(0.65 0.26 12 / 0.30)",
                }}
              >
                {t.upgradeCta}
              </button>
            </div>
          )}

          {/* ── Bio ── */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <SectionLabel>{t.bioLabel}</SectionLabel>
              <button
                onClick={() => setEditingBio(true)}
                className="flex items-center gap-1 font-sans"
                style={{ fontSize: "11px", color: "oklch(0.32 0.008 15)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.50 0.006 60)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.32 0.008 15)")}
              >
                <Pencil size={10} strokeWidth={2} />
                {t.edit}
              </button>
            </div>
            {editingBio ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                onBlur={() => setEditingBio(false)}
                autoFocus
                rows={4}
                className="w-full bg-transparent font-sans outline-none resize-none rounded-2xl px-5 py-4"
                style={{
                  fontSize: "13.5px",
                  lineHeight: "1.65",
                  color: "oklch(0.74 0.005 60)",
                  border: "1px solid oklch(0.65 0.26 12 / 0.32)",
                  caretColor: "oklch(0.65 0.26 12)",
                  boxShadow: "0 0 20px oklch(0.65 0.26 12 / 0.06)",
                }}
              />
            ) : (
              <button
                onClick={() => setEditingBio(true)}
                className="text-left w-full rounded-2xl px-5 py-4 transition-all"
                style={{
                  background: "oklch(0.11 0.012 15 / 0.80)",
                  border: "1px solid oklch(0.20 0.012 15 / 0.60)",
                  boxShadow: "inset 0 1px 0 oklch(0.22 0.010 15 / 0.10)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "oklch(0.28 0.012 15)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "oklch(0.20 0.012 15 / 0.60)")
                }
              >
                <p
                  className="font-sans leading-relaxed"
                  style={{
                    fontSize: "13.5px",
                    color: "oklch(0.54 0.006 15)",
                    lineHeight: "1.65",
                  }}
                >
                  {bio}
                </p>
              </button>
            )}
          </div>

          {/* ── Interests ── */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <SectionLabel>{t.interestsLabel}</SectionLabel>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((tag) => (
                <span
                  key={tag}
                  className="font-sans rounded-full px-4 py-2"
                  style={{
                    fontSize: "12px",
                    color: "oklch(0.56 0.008 15)",
                    background: "oklch(0.12 0.012 15 / 0.80)",
                    border: "1px solid oklch(0.22 0.012 15 / 0.60)",
                    boxShadow: "inset 0 1px 0 oklch(0.26 0.010 15 / 0.10)",
                  }}
                >
                  {tag}
                </span>
              ))}
              <button
                className="flex items-center gap-1.5 rounded-full px-4 py-2 font-sans transition-all"
                style={{
                  fontSize: "12px",
                  color: "oklch(0.32 0.008 15)",
                  background: "oklch(0.10 0.010 15 / 0.60)",
                  border: "1px dashed oklch(0.20 0.010 15 / 0.60)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "oklch(0.65 0.26 12 / 0.28)"
                  e.currentTarget.style.color = "oklch(0.50 0.006 60)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "oklch(0.20 0.010 15 / 0.60)"
                  e.currentTarget.style.color = "oklch(0.32 0.008 15)"
                }}
              >
                <Plus size={11} strokeWidth={2} />
                {lang === "ru" ? "Добавить" : "Add"}
              </button>
            </div>
          </div>

          {/* ── Details ── */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <SectionLabel>{t.detailsLabel}</SectionLabel>
            </div>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid oklch(0.20 0.012 15 / 0.60)",
                background: "oklch(0.11 0.012 15 / 0.80)",
                boxShadow: "inset 0 1px 0 oklch(0.22 0.010 15 / 0.10)",
              }}
            >
              {([
                profile.height && {
                  icon: User,
                  label: t.height,
                  value: `${profile.height} ${t.cm}`,
                },
                profile.occupation && {
                  icon: Briefcase,
                  label: t.occupation,
                  value: profile.occupation,
                },
                profile.education && {
                  icon: GraduationCap,
                  label: t.education,
                  value: profile.education,
                },
                profile.languages?.length && {
                  icon: Languages,
                  label: t.languages,
                  value: profile.languages.join(", "),
                },
                {
                  icon: Heart,
                  label: t.lookingFor,
                  value: t.lookingForValues[profile.lookingFor],
                },
              ] as Array<
                { icon: React.ElementType; label: string; value: string } | undefined | null | false
              >)
                .filter(Boolean)
                .map((row: any, i, arr) => (
                  <div
                    key={row.label}
                    className="flex items-center gap-4 px-5 py-3.5"
                    style={{
                      borderBottom:
                        i < arr.length - 1
                          ? "1px solid oklch(0.15 0.010 15 / 0.60)"
                          : "none",
                    }}
                  >
                    <row.icon
                      size={13}
                      strokeWidth={1.5}
                      style={{ color: "oklch(0.34 0.008 15)", flexShrink: 0 }}
                    />
                    <span
                      className="font-sans flex-shrink-0"
                      style={{
                        fontSize: "11.5px",
                        color: "oklch(0.30 0.008 15)",
                        minWidth: "76px",
                      }}
                    >
                      {row.label}
                    </span>
                    <span
                      className="font-sans flex-1 text-right"
                      style={{ fontSize: "13px", color: "oklch(0.62 0.006 60)" }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* ── Account settings ── */}
          <div>
            <div className="mb-3.5">
              <SectionLabel>{t.accountLabel}</SectionLabel>
            </div>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid oklch(0.20 0.012 15 / 0.60)",
                background: "oklch(0.11 0.012 15 / 0.80)",
                boxShadow: "inset 0 1px 0 oklch(0.22 0.010 15 / 0.10)",
              }}
            >
              <SettingsRow icon={Lock} label={t.privacyLabel} />
              <SettingsRow icon={Bell} label={t.notificationsLabel} />
              <SettingsRow icon={Settings} label={t.settingsLabel} />
              <div style={{ borderBottom: "none" }}>
                <SettingsRow icon={LogOut} label={t.logoutLabel} danger />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
