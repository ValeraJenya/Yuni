"use client"

import {
  SettingsGroup,
  SettingsScreen,
  SettingToggle,
} from "@/features/settings/components/settings-screen"
import { useSettingsResource } from "@/features/settings/hooks/use-settings-resource"
import { useLang } from "@/lib/lang-context"
import { settingsApi, type NotificationSettings } from "@/lib/settings-api"

const copy = {
  ru: {
    eyebrow: "Настройки",
    title: "Уведомления",
    description:
      "Что показывать в разделе уведомлений. Изменения применяются сразу.",
    back: "К профилю",
    activityGroup: "Знакомства",
    likes: "Лайки",
    matches: "Совпадения",
    messages: "Сообщения",
    otherGroup: "Прочее",
    productUpdates: "Новости о продукте",
    productUpdatesHint: "Редкие сообщения о новых возможностях. По умолчанию выключено.",
    loading: "Загружаем настройки...",
    loadError: "Не удалось загрузить настройки. Обновите страницу.",
    saveError: "Не удалось сохранить. Переключатель возвращён в прежнее состояние.",
  },
  en: {
    eyebrow: "Settings",
    title: "Notifications",
    description: "What shows up in your notifications. Changes apply immediately.",
    back: "Back to profile",
    activityGroup: "Dating",
    likes: "Likes",
    matches: "Matches",
    messages: "Messages",
    otherGroup: "Other",
    productUpdates: "Product news",
    productUpdatesHint: "Occasional notes about new features. Off by default.",
    loading: "Loading settings...",
    loadError: "Could not load settings. Please refresh.",
    saveError: "Could not save. The toggle was reverted.",
  },
}

const loadNotifications = async (
  request: Parameters<typeof settingsApi.getNotifications>[0],
) => (await settingsApi.getNotifications(request)).notificationSettings

const saveNotifications = async (
  request: Parameters<typeof settingsApi.updateNotifications>[0],
  payload: Partial<NotificationSettings>,
) => (await settingsApi.updateNotifications(request, payload)).notificationSettings

export default function NotificationSettingsPage() {
  const { lang } = useLang()
  const t = copy[lang]
  const { settings, isLoading, isSaving, loadError, saveError, update } =
    useSettingsResource<NotificationSettings>({
      load: loadNotifications,
      save: saveNotifications,
    })

  return (
    <SettingsScreen
      eyebrow={t.eyebrow}
      title={t.title}
      description={t.description}
      backLabel={t.back}
    >
      {isLoading ? (
        <p className="font-sans text-[13px] text-muted-foreground">{t.loading}</p>
      ) : loadError || !settings ? (
        <p className="font-sans text-[13px] text-destructive">{t.loadError}</p>
      ) : (
        <>
          {saveError ? (
            <p className="font-sans text-[12.5px] text-destructive" role="status">
              {t.saveError}
            </p>
          ) : null}

          <SettingsGroup label={t.activityGroup}>
            <SettingToggle
              label={t.likes}
              checked={settings.likesEnabled}
              disabled={isSaving}
              onChange={(next) => update({ likesEnabled: next })}
            />
            <SettingToggle
              label={t.matches}
              checked={settings.matchesEnabled}
              disabled={isSaving}
              onChange={(next) => update({ matchesEnabled: next })}
            />
            <SettingToggle
              label={t.messages}
              checked={settings.messagesEnabled}
              disabled={isSaving}
              onChange={(next) => update({ messagesEnabled: next })}
            />
          </SettingsGroup>

          <SettingsGroup label={t.otherGroup}>
            <SettingToggle
              label={t.productUpdates}
              hint={t.productUpdatesHint}
              checked={settings.productUpdatesEnabled}
              disabled={isSaving}
              onChange={(next) => update({ productUpdatesEnabled: next })}
            />
          </SettingsGroup>
        </>
      )}
    </SettingsScreen>
  )
}
