"use client"

import {
  SettingsGroup,
  SettingsScreen,
  SettingToggle,
} from "@/features/settings/components/settings-screen"
import { useSettingsResource } from "@/features/settings/hooks/use-settings-resource"
import { useLang } from "@/lib/lang-context"
import { settingsApi, type PrivacySettings } from "@/lib/settings-api"

const copy = {
  ru: {
    eyebrow: "Настройки",
    title: "Конфиденциальность",
    description:
      "Что видят другие пользователи и кто может вас найти. Изменения применяются сразу.",
    back: "К профилю",
    visibilityGroup: "Видимость",
    privateMode: "Приватный режим",
    privateModeHint:
      "Анкета скрыта из общей ленты. Вас увидят только те, с кем уже есть совпадение.",
    discoverable: "Показывать анкету в ленте",
    discoverableHint: "Выключите, чтобы взять паузу, не удаляя профиль.",
    privateFieldsGroup: "Что видно в приватном режиме",
    showName: "Имя",
    showBio: "Описание",
    showLocation: "Город и страна",
    activityGroup: "Активность и контакты",
    showDistance: "Показывать расстояние",
    showDistanceHint:
      "Точные координаты не показываются никогда — только оценка расстояния.",
    showOnline: "Показывать статус «в сети»",
    matchesOnly: "Сообщения только от совпадений",
    loading: "Загружаем настройки...",
    loadError: "Не удалось загрузить настройки. Обновите страницу.",
    saveError: "Не удалось сохранить. Переключатель возвращён в прежнее состояние.",
  },
  en: {
    eyebrow: "Settings",
    title: "Privacy",
    description:
      "What other people see and who can find you. Changes apply immediately.",
    back: "Back to profile",
    visibilityGroup: "Visibility",
    privateMode: "Private mode",
    privateModeHint:
      "Your profile is hidden from discovery. Only existing matches can see you.",
    discoverable: "Show my profile in discovery",
    discoverableHint: "Turn off to take a break without deleting your profile.",
    privateFieldsGroup: "Visible in private mode",
    showName: "Name",
    showBio: "Bio",
    showLocation: "City and country",
    activityGroup: "Activity and contact",
    showDistance: "Show distance",
    showDistanceHint:
      "Exact coordinates are never shown — only an estimated distance.",
    showOnline: "Show online status",
    matchesOnly: "Messages from matches only",
    loading: "Loading settings...",
    loadError: "Could not load settings. Please refresh.",
    saveError: "Could not save. The toggle was reverted.",
  },
}

const loadPrivacy = async (
  request: Parameters<typeof settingsApi.getPrivacy>[0],
) => (await settingsApi.getPrivacy(request)).privacySettings

const savePrivacy = async (
  request: Parameters<typeof settingsApi.updatePrivacy>[0],
  payload: Partial<PrivacySettings>,
) => (await settingsApi.updatePrivacy(request, payload)).privacySettings

export default function PrivacySettingsPage() {
  const { lang } = useLang()
  const t = copy[lang]
  const { settings, isLoading, isSaving, loadError, saveError, update } =
    useSettingsResource<PrivacySettings>({ load: loadPrivacy, save: savePrivacy })

  const isPrivate = settings?.profileVisibilityMode === "private"

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

          <SettingsGroup label={t.visibilityGroup}>
            <SettingToggle
              label={t.privateMode}
              hint={t.privateModeHint}
              checked={isPrivate}
              disabled={isSaving}
              onChange={(next) =>
                update({ profileVisibilityMode: next ? "private" : "open" })
              }
            />
            <SettingToggle
              label={t.discoverable}
              hint={t.discoverableHint}
              checked={settings.discoverable}
              disabled={isSaving}
              onChange={(next) => update({ discoverable: next })}
            />
          </SettingsGroup>

          {/* Группа осмысленна только в приватном режиме, поэтому в открытом
              она отключена, а не спрятана: иначе переключатель приватного
              режима менял бы состав экрана и выглядел бы как сбой. */}
          <SettingsGroup label={t.privateFieldsGroup}>
            <SettingToggle
              label={t.showName}
              checked={settings.showDisplayNameInPrivateMode}
              disabled={isSaving || !isPrivate}
              onChange={(next) => update({ showDisplayNameInPrivateMode: next })}
            />
            <SettingToggle
              label={t.showBio}
              checked={settings.showBioInPrivateMode}
              disabled={isSaving || !isPrivate}
              onChange={(next) => update({ showBioInPrivateMode: next })}
            />
            <SettingToggle
              label={t.showLocation}
              checked={settings.showLocationInPrivateMode}
              disabled={isSaving || !isPrivate}
              onChange={(next) => update({ showLocationInPrivateMode: next })}
            />
          </SettingsGroup>

          <SettingsGroup label={t.activityGroup}>
            <SettingToggle
              label={t.showDistance}
              hint={t.showDistanceHint}
              checked={settings.showDistance}
              disabled={isSaving}
              onChange={(next) => update({ showDistance: next })}
            />
            <SettingToggle
              label={t.showOnline}
              checked={settings.showOnlineStatus}
              disabled={isSaving}
              onChange={(next) => update({ showOnlineStatus: next })}
            />
            <SettingToggle
              label={t.matchesOnly}
              checked={settings.allowMessagesFromMatchesOnly}
              disabled={isSaving}
              onChange={(next) => update({ allowMessagesFromMatchesOnly: next })}
            />
          </SettingsGroup>
        </>
      )}
    </SettingsScreen>
  )
}
