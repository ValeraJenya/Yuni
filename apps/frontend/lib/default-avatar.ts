/**
 * Task 071: заглушки аватара для пользователей без фотографии.
 *
 * Раньше во всех этих местах стояло `/hero-portrait.jpg` — фотография модели
 * с лендинга. Лицо конкретного человека становилось аватаром любого
 * пользователя без фото, включая его самого в собственном профиле.
 *
 * Два варианта на каждый пол: `card` — ростовой портрет 4:5 под крупные
 * карточки Discovery и профиля, `square` — кроп по плечи под маленькие
 * круглые аватары в списках, где от ростовой фигуры осталось бы тёмное пятно.
 *
 * Пол в схеме — свободная строка (Task 035), поэтому нормализуем здесь и не
 * полагаемся на конкретный набор значений. Всё, что не распознано, включая
 * незаполненное поле и небинарные значения, получает нейтральный силуэт.
 */
export type DefaultAvatarVariant = "card" | "square"

const DEFAULT_AVATARS = {
  female: {
    card: "/avatar-default-female.webp",
    square: "/avatar-default-female-square.webp",
  },
  male: {
    card: "/avatar-default-male.webp",
    square: "/avatar-default-male-square.webp",
  },
} as const

const NEUTRAL_AVATAR = "/avatar-default-neutral.svg"

export function defaultAvatarUrl(
  gender: string | null | undefined,
  variant: DefaultAvatarVariant = "card",
): string {
  const normalized = gender?.trim().toLowerCase()

  if (normalized === "female" || normalized === "male") {
    return DEFAULT_AVATARS[normalized][variant]
  }

  return NEUTRAL_AVATAR
}

/**
 * Готовый URL фотографии либо заглушка по полу. Принимает уже отрезолвленный
 * URL (см. `resolveProfilePhotoUrl`), собственного резолва не делает.
 */
export function avatarUrlOrDefault(
  photoUrl: string | null | undefined,
  gender: string | null | undefined,
  variant: DefaultAvatarVariant = "card",
): string {
  return photoUrl || defaultAvatarUrl(gender, variant)
}
