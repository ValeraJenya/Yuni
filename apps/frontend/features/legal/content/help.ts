import type { LegalContent } from "../types"

/**
 * Task 063 — Справочный центр.
 *
 * Отвечает на вопросы по фактическому поведению сервиса. Там, где функция
 * не реализована, ответ говорит об этом прямо и предлагает рабочий обходной
 * путь, а не отправляет пользователя нажимать несуществующую кнопку.
 */
export const helpContent: LegalContent = {
  ru: {
    eyebrow: "Поддержка",
    title: "Справочный центр",
    updated: "14 августа 2026",
    updatedLabel: "Обновлено",
    tocLabel: "Разделы",
    intro: [
      "Короткие ответы на то, что спрашивают чаще всего. Если нужного вопроса здесь нет — напишите на hello@yuni.app, обычно отвечаем в течение нескольких часов.",
    ],
    sections: [
      {
        id: "getting-started",
        title: "Начало работы",
        blocks: [
          {
            kind: "p",
            text: "Как заполнить профиль. Анкета показывается другим только когда заполнены обязательные поля: имя, дата рождения, город и хотя бы одна фотография. Пока чего-то не хватает, на странице профиля виден индикатор заполненности — он подскажет, какое поле осталось.",
          },
          {
            kind: "p",
            text: "Почему меня никто не видит. Проверьте две вещи: заполнен ли профиль полностью и не включён ли приватный режим в настройках приватности — в нём анкета скрыта из общей ленты.",
          },
          {
            kind: "p",
            text: "Можно ли поменять хендл. Хендл уникален и задаётся при создании профиля. Сейчас изменить его самостоятельно нельзя — напишите нам, если он вам не подходит.",
          },
        ],
      },
      {
        id: "matching",
        title: "Лайки и совпадения",
        blocks: [
          {
            kind: "p",
            text: "Что происходит после лайка. Если человек ответит взаимностью, появится совпадение и откроется диалог. До этого он не узнает о вашем лайке.",
          },
          {
            kind: "p",
            text: "Почему анкета снова появилась в ленте. Лайки и пропуски действуют ограниченное время. Когда срок истекает, анкета может показаться снова — это не сбой.",
          },
          {
            kind: "p",
            text: "Почему совпадение исчезло. Совпадение действует семь дней. Если за это время диалог не начался, оно завершается. Совпадение также завершается, если один из вас заблокировал другого.",
          },
        ],
      },
      {
        id: "staged-chat",
        title: "Этапный чат",
        blocks: [
          {
            kind: "p",
            text: "Зачем этапы. Идея простая: разговор раскрывается постепенно, а не вываливается сразу. Это снижает давление в начале общения и даёт повод продолжать.",
          },
          {
            kind: "p",
            text: "Первый этап — только текст. Голосовые сообщения открываются на втором этапе, когда переписка уже состоялась.",
          },
          {
            kind: "p",
            text: "Лимиты голосовых на втором этапе: не больше 60 секунд на сообщение и не больше 90 секунд суммарно за этап на каждого. На третьем этапе ограничений нет.",
          },
          {
            kind: "p",
            text: "Что за вопросы появляются в диалоге. Это игра: по ходу переписки сервис предлагает вопрос обоим. Вопрос можно отложить один раз. Чтобы перейти на третий этап, нужно вдвоём ответить на несколько вопросов.",
          },
          {
            kind: "todo",
            text: "TODO (продукт): на чистой базе список стартовых фраз пуст, потому что таблица нигде не наполняется (Task 045). Пока это так, подсказки для начала разговора не показываются.",
          },
        ],
      },
      {
        id: "safety",
        title: "Безопасность и жалобы",
        blocks: [
          {
            kind: "p",
            text: "Как заблокировать. Блокировка доступна из профиля пользователя и из диалога. Она завершает совпадение и закрывает переписку для обеих сторон. Снятие блокировки переписку не возвращает: чтобы общаться снова, потребуется новое совпадение.",
          },
          {
            kind: "p",
            text: "Как пожаловаться. В жалобе выбирается причина — спам, фейк, домогательства, сексуальный контент, разжигание ненависти, мошенничество, подозрение на несовершеннолетие, угрозы — и добавляется комментарий. Жалобы разбираются вручную.",
          },
          {
            kind: "p",
            text: "Что делать при подозрении на мошенничество. Не переводите деньги ни при каких обстоятельствах и ни под каким предлогом. Пожалуйтесь с причиной «мошенничество» и заблокируйте пользователя. Если деньги уже переведены — обратитесь в банк и полицию.",
          },
          {
            kind: "p",
            text: "Встреча офлайн. Выбирайте людное место, сообщите близким, где вы, и не оставляйте напитки без присмотра. Не передавайте документы, деньги и адрес проживания.",
          },
        ],
      },
      {
        id: "privacy-settings",
        title: "Приватность и уведомления",
        blocks: [
          {
            kind: "p",
            text: "Приватный режим скрывает анкету из общей ленты. Внутри него вы отдельно настраиваете, видно ли имя, описание и местоположение.",
          },
          {
            kind: "p",
            text: "Показ расстояния можно отключить. Точные координаты другим пользователям не показываются никогда — только оценка расстояния, и только если вы её не выключили.",
          },
          {
            kind: "p",
            text: "Уведомления о лайках, совпадениях, сообщениях и новостях о продукте включаются и выключаются по отдельности в настройках уведомлений.",
          },
        ],
      },
      {
        id: "account-data",
        title: "Аккаунт и данные",
        blocks: [
          {
            kind: "todo",
            text: "TODO (продукт): удалить аккаунт самостоятельно сейчас нельзя — ни кнопки в интерфейсе, ни эндпоинта в API нет. Напишите на hello@yuni.app с адреса аккаунта, и мы удалим его вручную в срок до 30 дней.",
          },
          {
            kind: "todo",
            text: "TODO (продукт): выгрузка своих данных тоже выполняется вручную по запросу на почту — автоматического экспорта пока нет.",
          },
          {
            kind: "todo",
            text: "TODO (продукт): восстановление пароля не работает (Task 031): форма показывает успех, но письмо не отправляется. Если потеряли доступ — напишите нам.",
          },
          {
            kind: "p",
            text: "Что происходит с перепиской при удалении аккаунта. Диалоги и сообщения удаляются вместе с учётной записью. У собеседника переписка тоже перестаёт быть доступной.",
          },
        ],
      },
      {
        id: "contact",
        title: "Связаться с нами",
        blocks: [
          {
            kind: "p",
            text: "hello@yuni.app — на этот адрес приходят и вопросы по работе сервиса, и обращения о нарушении ваших прав, и запросы на удаление данных. Отвечают люди.",
          },
          {
            kind: "p",
            text: "Чтобы мы разобрались быстрее, приложите к письму хендл или ссылку на профиль, о котором идёт речь, и время события.",
          },
        ],
      },
    ],
  },

  en: {
    eyebrow: "Support",
    title: "Help centre",
    updated: "14 August 2026",
    updatedLabel: "Updated",
    tocLabel: "Sections",
    intro: [
      "Short answers to what people ask most. If your question is not here, write to hello@yuni.app — we usually reply within a few hours.",
    ],
    sections: [
      {
        id: "getting-started",
        title: "Getting started",
        blocks: [
          {
            kind: "p",
            text: "Filling in your profile. Your profile is only shown to others once the required fields are complete: name, date of birth, city, and at least one photo. Until then the profile page shows a completeness indicator pointing at what is missing.",
          },
          {
            kind: "p",
            text: "Why nobody can see me. Check two things: whether your profile is fully complete, and whether private mode is on in privacy settings — it hides your profile from discovery.",
          },
          {
            kind: "p",
            text: "Can I change my handle. Handles are unique and set when the profile is created. You cannot change it yourself right now — write to us if it does not suit you.",
          },
        ],
      },
      {
        id: "matching",
        title: "Likes and matches",
        blocks: [
          {
            kind: "p",
            text: "What happens after a like. If the other person likes you back, you get a match and a conversation opens. Until then they do not know about your like.",
          },
          {
            kind: "p",
            text: "Why a profile appeared again. Likes and passes last a limited time. When they expire the profile can show up again — this is not a bug.",
          },
          {
            kind: "p",
            text: "Why a match disappeared. Matches last seven days. If no conversation starts in that time, the match ends. It also ends if either of you blocks the other.",
          },
        ],
      },
      {
        id: "staged-chat",
        title: "Staged chat",
        blocks: [
          {
            kind: "p",
            text: "Why stages. The idea is simple: the conversation opens up gradually instead of all at once. It takes the pressure off the first messages and gives you a reason to keep going.",
          },
          {
            kind: "p",
            text: "Stage one is text only. Voice messages unlock at stage two, once you have actually been talking.",
          },
          {
            kind: "p",
            text: "Voice limits at stage two: 60 seconds per message and 90 seconds in total for the stage, per person. Stage three has no limits.",
          },
          {
            kind: "p",
            text: "What are the questions that appear. They are a game: as you talk, the service offers a question to both of you. A question can be postponed once. Reaching stage three requires both of you to answer several of them.",
          },
          {
            kind: "todo",
            text: "TODO (product): on a fresh database the list of conversation starters is empty because nothing ever populates that table (Task 045). Until that is fixed, no opening suggestions are shown.",
          },
        ],
      },
      {
        id: "safety",
        title: "Safety and reports",
        blocks: [
          {
            kind: "p",
            text: "How to block. Blocking is available from a user's profile and from the conversation. It ends the match and closes the conversation for both sides. Unblocking does not restore it: a new match is needed to talk again.",
          },
          {
            kind: "p",
            text: "How to report. Pick a reason — spam, fake profile, harassment, sexual content, hate speech, scam, suspected minor, threats — and add a comment. Reports are reviewed by hand.",
          },
          {
            kind: "p",
            text: "If you suspect a scam. Do not transfer money under any circumstances or any pretext. Report with the «scam» reason and block the user. If money has already been sent, contact your bank and the police.",
          },
          {
            kind: "p",
            text: "Meeting offline. Choose a public place, tell someone where you are, and keep an eye on your drink. Do not hand over documents, money, or your home address.",
          },
        ],
      },
      {
        id: "privacy-settings",
        title: "Privacy and notifications",
        blocks: [
          {
            kind: "p",
            text: "Private mode hides your profile from discovery. Within it you separately control whether your name, bio and location are shown.",
          },
          {
            kind: "p",
            text: "Distance display can be switched off. Exact coordinates are never shown to other users — only an estimated distance, and only if you have left it on.",
          },
          {
            kind: "p",
            text: "Notifications for likes, matches, messages and product news are toggled independently in notification settings.",
          },
        ],
      },
      {
        id: "account-data",
        title: "Account and data",
        blocks: [
          {
            kind: "todo",
            text: "TODO (product): you cannot delete your account yourself right now — there is no button in the interface and no endpoint in the API. Write to hello@yuni.app from your account address and we will delete it manually within 30 days.",
          },
          {
            kind: "todo",
            text: "TODO (product): data export is also handled manually by email — there is no automated export yet.",
          },
          {
            kind: "todo",
            text: "TODO (product): password recovery does not work (Task 031): the form reports success but no email is sent. If you have lost access, write to us.",
          },
          {
            kind: "p",
            text: "What happens to conversations when an account is deleted. Conversations and messages are deleted along with the account. They stop being available to the other person too.",
          },
        ],
      },
      {
        id: "contact",
        title: "Contact us",
        blocks: [
          {
            kind: "p",
            text: "hello@yuni.app takes questions about the service, rights-infringement notices, and data deletion requests alike. People answer it.",
          },
          {
            kind: "p",
            text: "To help us sort it out faster, include the handle or profile link in question and the time it happened.",
          },
        ],
      },
    ],
  },
}
