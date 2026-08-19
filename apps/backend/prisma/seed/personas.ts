// Fixed identities for the demo dataset. IDs are hardcoded (not
// gen_random_uuid()) on purpose: re-running the seed must upsert the same
// rows instead of growing new ones, and the chat scenarios below need to
// know in advance who they are wiring together.
export const SEED_PASSWORD = 'YuniDemo123!';
export const SEED_EMAIL_DOMAIN = 'seed.yuni.local';

export interface SeedPersona {
  key: string;
  id: string;
  photoId: string;
  handle: string;
  displayName: string;
  birthDate: string; // YYYY-MM-DD
  bio: string;
  gender: string;
  lookingFor: string;
  city: string;
  country: string;
}

function userId(n: number): string {
  return `a1e00000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
}

function photoId(n: number): string {
  return `b1e00000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
}

export const PERSONAS: SeedPersona[] = [
  {
    key: 'demo',
    id: userId(1),
    photoId: photoId(1),
    handle: 'demo',
    displayName: 'Демо',
    birthDate: '1997-04-12',
    bio: 'Демо-аккаунт для проверки сценариев. Пишите смело — это тестовые данные.',
    gender: 'female',
    lookingFor: 'relationship',
    city: 'Москва',
    country: 'RU',
  },
  {
    key: 'anna',
    id: userId(2),
    photoId: photoId(2),
    handle: 'anna_l',
    displayName: 'Аня',
    birthDate: '1999-07-03',
    bio: 'Люблю долгие прогулки и короткие переписки, которые перерастают в длинные.',
    gender: 'female',
    lookingFor: 'relationship',
    city: 'Санкт-Петербург',
    country: 'RU',
  },
  {
    key: 'igor',
    id: userId(3),
    photoId: photoId(3),
    handle: 'igor_k',
    displayName: 'Игорь',
    birthDate: '1994-11-21',
    bio: 'Варю кофе, катаюсь на велосипеде, редко отвечаю сразу — зато отвечаю честно.',
    gender: 'male',
    lookingFor: 'relationship',
    city: 'Казань',
    country: 'RU',
  },
  {
    key: 'sonya',
    id: userId(4),
    photoId: photoId(4),
    handle: 'sonya_m',
    displayName: 'Соня',
    birthDate: '2000-02-14',
    bio: 'Архитектор по профессии, мечтатель по жизни. Ищу того, кто не боится идти пешком.',
    gender: 'female',
    lookingFor: 'friendship',
    city: 'Алматы',
    country: 'KZ',
  },
  {
    key: 'dima',
    id: userId(5),
    photoId: photoId(5),
    handle: 'dima_r',
    displayName: 'Дима',
    birthDate: '1996-09-08',
    bio: 'Программирую днём, играю на гитаре вечером. Ищу человека для новых плейлистов.',
    gender: 'male',
    lookingFor: 'casual',
    city: 'Новосибирск',
    country: 'RU',
  },
  {
    key: 'liza',
    id: userId(6),
    photoId: photoId(6),
    handle: 'liza_v',
    displayName: 'Лиза',
    birthDate: '1998-05-30',
    bio: 'Ветеринар, обожаю котов и плохие каламбуры. Второе не обязательно взаимно.',
    gender: 'female',
    lookingFor: 'unsure',
    city: 'Екатеринбург',
    country: 'RU',
  },
  {
    key: 'mark',
    id: userId(7),
    photoId: photoId(7),
    handle: 'mark_t',
    displayName: 'Марк',
    birthDate: '1995-12-02',
    bio: 'Танцую сальсу, готовлю плов по семейному рецепту. Открыт(а) новым знакомствам.',
    gender: 'non-binary',
    lookingFor: 'friendship',
    city: 'Тбилиси',
    country: 'GE',
  },
  {
    key: 'nastya',
    id: userId(8),
    photoId: photoId(8),
    handle: 'nastya_p',
    displayName: 'Настя',
    birthDate: '2001-03-19',
    bio: 'Учусь на врача, мечтаю объехать все горы Кавказа. Расскажи мне что-нибудь новое.',
    gender: 'female',
    lookingFor: 'relationship',
    city: 'Минск',
    country: 'BY',
  },
  {
    key: 'oleg',
    id: userId(9),
    photoId: photoId(9),
    handle: 'oleg_s',
    displayName: 'Олег',
    birthDate: '1993-08-25',
    bio: 'Фотограф-любитель, бегаю по утрам. Верю, что лучшие разговоры начинаются с вопроса.',
    gender: 'male',
    lookingFor: 'casual',
    city: 'Бишкек',
    country: 'KG',
  },
];

export function personaEmail(persona: SeedPersona): string {
  return `${persona.handle}@${SEED_EMAIL_DOMAIN}`;
}

export function findPersona(key: string): SeedPersona {
  const persona = PERSONAS.find((candidate) => candidate.key === key);

  if (!persona) {
    throw new Error(`Unknown seed persona: ${key}`);
  }

  return persona;
}
