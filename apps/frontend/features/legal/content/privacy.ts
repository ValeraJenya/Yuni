import type { LegalContent } from "../types"

/**
 * Task 063 — Политика конфиденциальности.
 *
 * Тексты составлены по фактическому инвентарю данных из
 * `apps/backend/prisma/schema.prisma` и реальному поведению кода, а не по
 * маркетинговым обещаниям лендинга. Блоки `todo` — это места, которые обязан
 * закрыть оператор (реквизиты юрлица) либо продукт (нереализованные функции)
 * до публикации. Черновик не проходил юридическую экспертизу.
 */
export const privacyContent: LegalContent = {
  ru: {
    eyebrow: "Правовая информация",
    title: "Политика конфиденциальности",
    updated: "14 августа 2026",
    updatedLabel: "Редакция от",
    tocLabel: "Содержание",
    intro: [
      "Yuni — сервис знакомств. Чтобы он работал, мы обрабатываем данные, которые для дейтинга по своей природе чувствительны: фотографии, возраст, местоположение, переписку и то, кто вам понравился. Этот документ объясняет, что именно мы собираем, зачем, кому передаём и как вы можете это контролировать.",
      "Документ написан так, чтобы описывать реальное поведение сервиса, а не желаемое. Там, где функция ещё не реализована, это сказано прямо.",
    ],
    sections: [
      {
        id: "operator",
        title: "Кто обрабатывает ваши данные",
        blocks: [
          {
            kind: "p",
            text: "Оператором персональных данных (в терминах GDPR — контролёром) выступает лицо, указанное ниже. Оно определяет цели и способы обработки и отвечает за соблюдение этой политики.",
          },
          {
            kind: "todo",
            text: "TODO (оператор): полное наименование юридического лица или ИП, ОГРН/ОГРНИП, ИНН, юридический адрес, адрес для корреспонденции.",
          },
          {
            kind: "todo",
            text: "TODO (оператор): контакт ответственного за обработку персональных данных; при обработке данных резидентов ЕС — необходимость назначения DPO и представителя в ЕС по ст. 27 GDPR требует отдельной юридической оценки.",
          },
          {
            kind: "p",
            text: "По любым вопросам об обработке данных пишите на hello@yuni.app — это рабочий канал, ответы приходят от людей, а не от автоответчика.",
          },
        ],
      },
      {
        id: "data-we-collect",
        title: "Какие данные мы собираем",
        blocks: [
          {
            kind: "p",
            text: "Ниже — полный перечень категорий данных, которые сервис действительно хранит. Он соответствует схеме базы данных, а не общим формулировкам.",
          },
          {
            kind: "table",
            head: ["Категория", "Что именно", "Откуда"],
            rows: [
              [
                "Учётная запись",
                "Адрес электронной почты, хеш пароля, статус аккаунта, даты регистрации, последнего входа и подтверждения почты",
                "Вы при регистрации",
              ],
              [
                "Анкета",
                "Имя для показа, публичный хендл, дата рождения, описание «о себе», пол, кого вы ищете, город и страна",
                "Вы при заполнении профиля",
              ],
              [
                "Местоположение",
                "Координаты (широта и долгота) с точностью до шести знаков после запятой",
                "Вы, если указываете местоположение",
              ],
              [
                "Фотографии",
                "Сами файлы, размеры, тип файла, порядок показа, отметка главного фото, статус модерации",
                "Вы при загрузке",
              ],
              [
                "Интересы",
                "Выбранные из общего справочника теги",
                "Вы при заполнении профиля",
              ],
              [
                "Действия в знакомствах",
                "Лайки, суперлайки и пропуски с датой и сроком действия, взаимные совпадения и их статус",
                "Ваши действия в сервисе",
              ],
              [
                "Переписка",
                "Тексты сообщений, длительность голосовых сообщений, этап диалога, ответы на вопросы игры, отметки о прочтении",
                "Вы и ваш собеседник",
              ],
              [
                "Модерация",
                "Блокировки (с указанной причиной), жалобы: код причины, комментарий, статус рассмотрения и итоговое решение",
                "Вы и наша команда",
              ],
              [
                "Настройки",
                "Приватность (режим видимости профиля, показ расстояния, статуса онлайн, имени и описания в приватном режиме) и уведомления",
                "Вы в настройках",
              ],
              [
                "Технические данные сессий",
                "IP-адрес, строка User-Agent, метка устройства, хеш токена обновления, даты выдачи, последнего использования и отзыва",
                "Автоматически при входе",
              ],
            ],
          },
          {
            kind: "note",
            text: "Пароль в открытом виде не хранится: сохраняется только его криптографический хеш (argon2). Восстановить исходный пароль из него нельзя — в том числе нам.",
          },
          {
            kind: "todo",
            text: "TODO (продукт): подтверждение адреса электронной почты пока не реализовано (Task 033) — сервис принимает любой введённый адрес. До реализации нельзя утверждать, что почта в профиле подтверждена.",
          },
        ],
      },
      {
        id: "special-categories",
        title: "Данные особых категорий",
        blocks: [
          {
            kind: "p",
            text: "Сервис знакомств по своей природе работает с данными, которые законодательство относит к особо чувствительным. То, кого вы ищете, кому ставите лайк и с кем переписываетесь, позволяет сделать выводы о вашей личной жизни и сексуальной ориентации. В терминах ст. 9 GDPR это специальные категории данных, в терминах российского законодательства — данные о личной жизни, требующие отдельного согласия.",
          },
          {
            kind: "p",
            text: "Правовое основание такой обработки — ваше явное согласие, которое вы даёте при регистрации, отмечая согласие с этим документом и с условиями использования. Согласие можно отозвать (см. раздел «Ваши права»); отзыв делает дальнейшее использование сервиса невозможным, потому что без этих данных знакомства технически не работают.",
          },
          {
            kind: "p",
            text: "Мы не запрашиваем и намеренно не собираем данные о здоровье, религиозных и политических убеждениях, членстве в профсоюзах, биометрию и генетические данные. Если вы указываете такие сведения в описании профиля или в переписке добровольно, они обрабатываются как часть соответствующего поля.",
          },
        ],
      },
      {
        id: "purposes",
        title: "Зачем мы это делаем и на каком основании",
        blocks: [
          {
            kind: "table",
            head: ["Цель", "Основание по GDPR", "Основание по 152-ФЗ"],
            rows: [
              [
                "Создание и ведение учётной записи, вход в сервис",
                "Исполнение договора (ст. 6(1)(b))",
                "Исполнение договора с субъектом (ч. 1 ст. 6, п. 5)",
              ],
              [
                "Показ вашей анкеты другим пользователям и подбор анкет для вас",
                "Явное согласие (ст. 9(2)(a)) и исполнение договора",
                "Согласие субъекта персональных данных",
              ],
              [
                "Совпадения, переписка и этапная механика чата",
                "Исполнение договора (ст. 6(1)(b))",
                "Исполнение договора с субъектом",
              ],
              [
                "Безопасность: жалобы, блокировки, борьба со спамом и мошенничеством",
                "Законный интерес (ст. 6(1)(f))",
                "Осуществление прав и законных интересов оператора",
              ],
              [
                "Уведомления о совпадениях и сообщениях",
                "Исполнение договора; для новостей о продукте — согласие",
                "Исполнение договора; для рассылок — согласие",
              ],
              [
                "Техническая работа сессий и защита от подбора паролей",
                "Законный интерес (ст. 6(1)(f))",
                "Осуществление законных интересов оператора",
              ],
              [
                "Ответы на ваши обращения",
                "Исполнение договора и законный интерес",
                "Исполнение договора с субъектом",
              ],
            ],
          },
          {
            kind: "p",
            text: "Мы не используем ваши данные для автоматизированного принятия решений, влекущих юридические последствия, и не строим на их основе рекламные профили. Подбор анкет в разделе знакомств основан на ваших собственных настройках поиска и на настройках видимости других пользователей.",
          },
        ],
      },
      {
        id: "who-sees",
        title: "Кто видит ваши данные внутри сервиса",
        blocks: [
          {
            kind: "p",
            text: "Другим пользователям в ленте знакомств видны: имя для показа, возраст (вычисляется из даты рождения — сама дата не показывается), описание, город и страна, интересы и одобренные фотографии.",
          },
          {
            kind: "p",
            text: "Точные координаты никогда не показываются другим пользователям. Они используются только для оценки расстояния, и показ расстояния вы можете отключить в настройках приватности.",
          },
          {
            kind: "p",
            text: "Приватный режим скрывает вашу анкету из общей ленты. В нём вы отдельно управляете тем, видно ли ваше имя, описание и местоположение. Переписка доступна только участникам диалога.",
          },
          {
            kind: "p",
            text: "Наша команда получает доступ к переписке только по конкретной жалобе и только к тем сообщениям, которые относятся к разбирательству. Сплошного чтения переписки не ведётся.",
          },
          {
            kind: "todo",
            text: "TODO (продукт): фотографии публикуются автоматически сразу после загрузки — предварительной ручной проверки нет. Пока это так, лендинг не должен обещать ручную верификацию и круглосуточную модерацию (Task 032), иначе обещание расходится с фактом.",
          },
        ],
      },
      {
        id: "processors",
        title: "Кому мы передаём данные",
        blocks: [
          {
            kind: "p",
            text: "Мы не продаём персональные данные и не передаём их третьим лицам для их собственного маркетинга. Привлекаются только поставщики, необходимые для работы сервиса, и они действуют по нашему поручению.",
          },
          {
            kind: "list",
            items: [
              "Хостинг-провайдер серверов приложения и базы данных.",
              "Vercel Analytics — обезличенная веб-аналитика, подключена только в производственной среде. Собирает данные о посещениях страниц без cookies и без идентификации конкретного человека.",
              "Провайдер отправки писем, когда он будет подключён.",
            ],
          },
          {
            kind: "todo",
            text: "TODO (оператор): указать конкретных поставщиков, страны размещения серверов и заключённые с ними договоры поручения обработки (ст. 28 GDPR) либо поручения по ч. 3 ст. 6 152-ФЗ.",
          },
          {
            kind: "p",
            text: "Данные могут быть раскрыты по мотивированному запросу уполномоченных органов, если запрос оформлен в соответствии с законом. В таком случае мы проверяем законность запроса и передаём минимально необходимый объём.",
          },
        ],
      },
      {
        id: "storage",
        title: "Где хранятся данные и сколько",
        blocks: [
          {
            kind: "todo",
            text: "TODO (оператор): указать страну и площадку размещения базы данных. Если сервис работает с гражданами России, требуется первичная запись, систематизация и хранение их данных на территории РФ (ч. 5 ст. 18 152-ФЗ). Для передачи данных за пределы ЕЭЗ нужно указать механизм — стандартные договорные условия или решение об адекватности.",
          },
          {
            kind: "p",
            text: "Данные учётной записи и анкеты хранятся, пока учётная запись существует. Переписка хранится, пока существует диалог. Токены сессий имеют собственный срок действия и перестают действовать после выхода из аккаунта.",
          },
          {
            kind: "todo",
            text: "TODO (продукт): автоматических сроков хранения и фонового удаления устаревших данных сейчас нет — ни одного планировщика в сервисе не запущено. До их появления данные хранятся бессрочно, пока вы не попросите их удалить, и обещать конкретные сроки в этом документе нельзя.",
          },
        ],
      },
      {
        id: "your-rights",
        title: "Ваши права",
        blocks: [
          {
            kind: "p",
            text: "Вне зависимости от того, какое законодательство к вам применимо, вы можете:",
          },
          {
            kind: "list",
            items: [
              "Получить подтверждение обработки и копию своих данных (ст. 15 GDPR, ст. 14 152-ФЗ).",
              "Исправить неточные данные — часть полей вы правите сами в профиле (ст. 16 GDPR).",
              "Потребовать удаления данных и учётной записи (ст. 17 GDPR, ст. 21 152-ФЗ).",
              "Ограничить обработку или возразить против неё, включая обработку на основании законного интереса (ст. 18 и 21 GDPR).",
              "Получить данные в машиночитаемом формате и передать их другому оператору (ст. 20 GDPR).",
              "Отозвать согласие в любой момент — это не отменяет законность обработки до отзыва (ст. 7(3) GDPR).",
            ],
          },
          {
            kind: "p",
            text: "Чтобы воспользоваться любым из этих прав, напишите на hello@yuni.app с адреса, на который зарегистрирован аккаунт. Мы отвечаем в течение 30 дней — этот срок соответствует ст. 12(3) GDPR и ст. 20 152-ФЗ.",
          },
          {
            kind: "todo",
            text: "TODO (продукт): самостоятельного удаления аккаунта и выгрузки своих данных в интерфейсе нет — соответствующих эндпоинтов в API не существует, запросы обрабатываются вручную по почте. Пока это так, кнопку «Удалить аккаунт» нельзя показывать в интерфейсе, а этот раздел описывает единственный реально работающий способ.",
          },
          {
            kind: "p",
            text: "Если вы считаете, что мы нарушили ваши права, вы можете пожаловаться в надзорный орган: в России — в Роскомнадзор, в ЕС — в орган по защите данных страны вашего проживания. Мы будем признательны, если сначала напишете нам: большинство вопросов решается быстрее напрямую.",
          },
        ],
      },
      {
        id: "security",
        title: "Как мы защищаем данные",
        blocks: [
          {
            kind: "list",
            items: [
              "Пароли хранятся в виде хешей argon2, в открытом виде не сохраняются нигде.",
              "Доступ к API требует токена доступа с ограниченным сроком жизни; токен обновления хранится в браузере в защищённой cookie, недоступной сценариям на странице.",
              "Токены обновления хранятся в базе в виде хешей и отзываются при выходе из аккаунта.",
              "Чувствительные к подбору операции — вход, регистрация, обновление сессии — ограничены по частоте запросов.",
              "Ответы API отдают только явно разрешённый набор полей, а не всю запись из базы.",
            ],
          },
          {
            kind: "todo",
            text: "TODO (оператор): описать процедуру уведомления о нарушении безопасности — ст. 33 и 34 GDPR требуют уведомить надзорный орган в течение 72 часов, а при высоком риске — и самих пользователей.",
          },
          {
            kind: "p",
            text: "Ни одна система не защищена абсолютно. Пожалуйста, не публикуйте в анкете и переписке документы, платёжные данные и адрес проживания — сервису они не нужны, а риск от их раскрытия несоразмерен.",
          },
        ],
      },
      {
        id: "minors",
        title: "Возрастное ограничение",
        blocks: [
          {
            kind: "p",
            text: "Сервис предназначен только для совершеннолетних. Регистрация лиц младше 18 лет запрещена, дата рождения проверяется при заполнении анкеты.",
          },
          {
            kind: "p",
            text: "Если вы считаете, что аккаунтом пользуется несовершеннолетний, отправьте жалобу с кодом причины «подозрение на несовершеннолетие» или напишите на hello@yuni.app. Такие обращения рассматриваются в первую очередь, а подтверждённые аккаунты удаляются вместе с данными.",
          },
        ],
      },
      {
        id: "cookies",
        title: "Cookies и аналогичные технологии",
        blocks: [
          {
            kind: "p",
            text: "Сервис использует одну строго необходимую cookie — она хранит токен обновления сессии и позволяет вам оставаться в аккаунте между визитами. Без неё вход работать не будет, поэтому согласия на неё не требуется.",
          },
          {
            kind: "p",
            text: "Токен доступа хранится только в оперативной памяти вкладки и исчезает при её закрытии. Рекламных и трекинговых cookies сервис не устанавливает. Vercel Analytics в производственной среде работает без cookies и не идентифицирует конкретного пользователя.",
          },
        ],
      },
      {
        id: "changes",
        title: "Изменения этого документа",
        blocks: [
          {
            kind: "p",
            text: "Мы можем обновлять политику: меняется сервис, меняются и правила. Дата последней редакции указана в начале страницы.",
          },
          {
            kind: "p",
            text: "О существенных изменениях — новых категориях данных, новых получателях, изменении целей — мы сообщим отдельно в сервисе или письмом, до вступления изменений в силу. Продолжая пользоваться Yuni после этого, вы принимаете новую редакцию.",
          },
        ],
      },
      {
        id: "disclaimer",
        title: "Статус документа",
        blocks: [
          {
            kind: "todo",
            text: "TODO (до публикации): это черновик, подготовленный по фактическому устройству сервиса. Он не проходил проверку юристом и не является юридической консультацией. Перед запуском его должен вычитать специалист по защите персональных данных в применимой юрисдикции, и все блоки TODO на этой странице должны быть закрыты.",
          },
        ],
      },
    ],
  },

  en: {
    eyebrow: "Legal",
    title: "Privacy Policy",
    updated: "14 August 2026",
    updatedLabel: "Last updated",
    tocLabel: "Contents",
    intro: [
      "Yuni is a dating service. To work at all, it processes data that is sensitive by nature: photos, age, location, conversations, and who you liked. This document explains what we collect, why, who we share it with, and how you can control it.",
      "It is written to describe how the service actually behaves, not how we would like it to behave. Where a feature is not implemented yet, we say so plainly.",
    ],
    sections: [
      {
        id: "operator",
        title: "Who processes your data",
        blocks: [
          {
            kind: "p",
            text: "The data controller is the entity named below. It decides the purposes and means of processing and is accountable for this policy.",
          },
          {
            kind: "todo",
            text: "TODO (operator): full legal name of the company or sole trader, registration numbers, tax ID, registered address, and postal address for correspondence.",
          },
          {
            kind: "todo",
            text: "TODO (operator): contact point for data protection matters. Whether a DPO and an EU representative under GDPR Art. 27 are required needs separate legal assessment.",
          },
          {
            kind: "p",
            text: "For any question about your data, write to hello@yuni.app. It is a monitored address answered by people.",
          },
        ],
      },
      {
        id: "data-we-collect",
        title: "What we collect",
        blocks: [
          {
            kind: "p",
            text: "The list below is the full set of categories the service actually stores. It follows the database schema rather than generic wording.",
          },
          {
            kind: "table",
            head: ["Category", "Specifically", "Source"],
            rows: [
              [
                "Account",
                "Email address, password hash, account status, sign-up date, last login, email confirmation date",
                "You, at registration",
              ],
              [
                "Profile",
                "Display name, public handle, date of birth, bio, gender, who you are looking for, city and country",
                "You, when filling in your profile",
              ],
              [
                "Location",
                "Latitude and longitude stored to six decimal places",
                "You, if you provide a location",
              ],
              [
                "Photos",
                "The image files, dimensions, file type, display order, primary-photo flag, moderation status",
                "You, when uploading",
              ],
              ["Interests", "Tags picked from a shared catalogue", "You, in your profile"],
              [
                "Dating activity",
                "Likes, superlikes and passes with timestamps and expiry, mutual matches and their status",
                "Your actions in the service",
              ],
              [
                "Conversations",
                "Message text, voice message duration, conversation stage, game answers, read receipts",
                "You and the person you talk to",
              ],
              [
                "Moderation",
                "Blocks with an optional reason; reports with a reason code, comment, review status and outcome",
                "You and our team",
              ],
              [
                "Settings",
                "Privacy (profile visibility mode, showing distance, online status, name and bio in private mode) and notifications",
                "You, in settings",
              ],
              [
                "Session technical data",
                "IP address, User-Agent string, device label, refresh token hash, issue, last-use and revocation timestamps",
                "Collected automatically at sign-in",
              ],
            ],
          },
          {
            kind: "note",
            text: "Passwords are never stored in plain text — only an argon2 hash is kept. The original password cannot be recovered from it, including by us.",
          },
          {
            kind: "todo",
            text: "TODO (product): email confirmation is not implemented (Task 033) — any address entered is accepted. Until it is, we cannot claim that the email on a profile has been verified.",
          },
        ],
      },
      {
        id: "special-categories",
        title: "Special category data",
        blocks: [
          {
            kind: "p",
            text: "A dating service inherently handles data the law treats as especially sensitive. Who you are looking for, who you like, and who you talk to allows inferences about your sex life and sexual orientation. Under GDPR Art. 9 this is special category data; under Russian law it is data concerning private life and requires separate consent.",
          },
          {
            kind: "p",
            text: "The legal basis is your explicit consent, given at registration when you accept this policy and the terms of use. You may withdraw consent at any time (see «Your rights»); withdrawing it makes further use of the service impossible, because matching cannot technically work without this data.",
          },
          {
            kind: "p",
            text: "We do not ask for and do not deliberately collect health data, religious or political beliefs, trade union membership, biometric or genetic data. If you volunteer such information in your bio or messages, it is processed as part of that field.",
          },
        ],
      },
      {
        id: "purposes",
        title: "Why we process it, and on what basis",
        blocks: [
          {
            kind: "table",
            head: ["Purpose", "GDPR basis", "Russian law basis"],
            rows: [
              [
                "Creating and running your account, signing you in",
                "Performance of a contract, Art. 6(1)(b)",
                "Performance of a contract with the data subject",
              ],
              [
                "Showing your profile to others and suggesting profiles to you",
                "Explicit consent, Art. 9(2)(a), and contract",
                "Consent of the data subject",
              ],
              [
                "Matches, messaging and the staged chat mechanic",
                "Performance of a contract, Art. 6(1)(b)",
                "Performance of a contract with the data subject",
              ],
              [
                "Safety: reports, blocks, anti-spam and anti-fraud",
                "Legitimate interest, Art. 6(1)(f)",
                "Pursuit of the operator's legitimate interests",
              ],
              [
                "Notifications about matches and messages",
                "Contract; product news requires consent",
                "Contract; marketing requires consent",
              ],
              [
                "Running sessions and resisting credential stuffing",
                "Legitimate interest, Art. 6(1)(f)",
                "Pursuit of the operator's legitimate interests",
              ],
              [
                "Answering your enquiries",
                "Contract and legitimate interest",
                "Performance of a contract with the data subject",
              ],
            ],
          },
          {
            kind: "p",
            text: "We do not use your data for automated decisions with legal effects, and we do not build advertising profiles. Discovery results are driven by your own search settings and by other people's visibility settings.",
          },
        ],
      },
      {
        id: "who-sees",
        title: "Who sees your data inside the service",
        blocks: [
          {
            kind: "p",
            text: "Other users see your display name, your age (derived from your date of birth — the date itself is never shown), your bio, city and country, interests, and approved photos.",
          },
          {
            kind: "p",
            text: "Exact coordinates are never shown to other users. They are used only to estimate distance, and you can switch distance display off in privacy settings.",
          },
          {
            kind: "p",
            text: "Private mode hides your profile from discovery. Within it you separately control whether your name, bio and location are visible. Conversations are visible only to their participants.",
          },
          {
            kind: "p",
            text: "Our team accesses conversations only in response to a specific report, and only the messages relevant to it. We do not read conversations routinely.",
          },
          {
            kind: "todo",
            text: "TODO (product): photos are published automatically on upload — there is no manual pre-moderation. While that is the case, the landing page must not promise manual verification and round-the-clock moderation (Task 032).",
          },
        ],
      },
      {
        id: "processors",
        title: "Who we share data with",
        blocks: [
          {
            kind: "p",
            text: "We do not sell personal data and do not pass it to third parties for their own marketing. We engage only the providers the service needs, and they act on our instructions.",
          },
          {
            kind: "list",
            items: [
              "The hosting provider for the application servers and database.",
              "Vercel Analytics — anonymous web analytics, enabled in production only. It records page visits without cookies and without identifying an individual.",
              "An email delivery provider, once one is connected.",
            ],
          },
          {
            kind: "todo",
            text: "TODO (operator): name the actual providers, the countries their servers are in, and the data processing agreements in place with them (GDPR Art. 28).",
          },
          {
            kind: "p",
            text: "Data may be disclosed on a lawful, properly documented request from a competent authority. We check that such a request is valid and disclose the minimum necessary.",
          },
        ],
      },
      {
        id: "storage",
        title: "Where data is stored, and for how long",
        blocks: [
          {
            kind: "todo",
            text: "TODO (operator): state the country and facility hosting the database. Serving Russian citizens requires their data to be initially recorded and stored in Russia. Transfers outside the EEA require a stated mechanism — standard contractual clauses or an adequacy decision.",
          },
          {
            kind: "p",
            text: "Account and profile data is kept while the account exists. Conversations are kept while the conversation exists. Session tokens have their own lifetime and stop working after you sign out.",
          },
          {
            kind: "todo",
            text: "TODO (product): there are no automated retention periods or background deletion jobs — no scheduler runs in the service at all. Until that changes, data is kept indefinitely until you ask us to delete it, and this document cannot promise specific retention periods.",
          },
        ],
      },
      {
        id: "your-rights",
        title: "Your rights",
        blocks: [
          {
            kind: "p",
            text: "Whichever law applies to you, you can:",
          },
          {
            kind: "list",
            items: [
              "Confirm that we process your data and get a copy of it (GDPR Art. 15).",
              "Correct inaccurate data — many fields you can edit yourself in your profile (Art. 16).",
              "Ask us to delete your data and your account (Art. 17).",
              "Restrict processing, or object to it, including processing based on legitimate interest (Art. 18 and 21).",
              "Receive your data in a machine-readable format and move it elsewhere (Art. 20).",
              "Withdraw consent at any time — this does not affect the lawfulness of processing before withdrawal (Art. 7(3)).",
            ],
          },
          {
            kind: "p",
            text: "To exercise any of these, write to hello@yuni.app from the address your account is registered with. We respond within 30 days, in line with GDPR Art. 12(3).",
          },
          {
            kind: "todo",
            text: "TODO (product): there is no self-service account deletion or data export in the interface — no such API endpoints exist, and requests are handled manually by email. While that is the case, no «Delete account» button should appear in the interface, and this section describes the only route that actually works.",
          },
          {
            kind: "p",
            text: "If you believe we have breached your rights, you may complain to a supervisory authority: Roskomnadzor in Russia, or your national data protection authority in the EU. We would appreciate hearing from you first — most issues are resolved faster directly.",
          },
        ],
      },
      {
        id: "security",
        title: "How we protect your data",
        blocks: [
          {
            kind: "list",
            items: [
              "Passwords are stored as argon2 hashes and never in plain text.",
              "API access requires a short-lived access token; the refresh token lives in a browser cookie that page scripts cannot read.",
              "Refresh tokens are stored as hashes and revoked when you sign out.",
              "Brute-force-sensitive operations — sign-in, registration, session refresh — are rate limited.",
              "API responses return an explicit allowlist of fields rather than whole database records.",
            ],
          },
          {
            kind: "todo",
            text: "TODO (operator): document the breach notification procedure — GDPR Art. 33 and 34 require notifying the supervisory authority within 72 hours, and affected users where the risk is high.",
          },
          {
            kind: "p",
            text: "No system is perfectly secure. Please do not put identity documents, payment details or your home address in your profile or messages — the service does not need them, and the downside if they leak is out of proportion.",
          },
        ],
      },
      {
        id: "minors",
        title: "Age restriction",
        blocks: [
          {
            kind: "p",
            text: "The service is for adults only. Registration by anyone under 18 is prohibited, and date of birth is checked when the profile is completed.",
          },
          {
            kind: "p",
            text: "If you believe an account is used by a minor, file a report with the «suspected minor» reason code or write to hello@yuni.app. These reports are handled first, and confirmed accounts are deleted along with their data.",
          },
        ],
      },
      {
        id: "cookies",
        title: "Cookies and similar technologies",
        blocks: [
          {
            kind: "p",
            text: "The service sets one strictly necessary cookie. It holds the session refresh token and is what keeps you signed in between visits. Sign-in cannot work without it, so no consent banner is required for it.",
          },
          {
            kind: "p",
            text: "The access token is held in the tab's memory only and disappears when the tab closes. We set no advertising or tracking cookies. Vercel Analytics runs in production without cookies and does not identify individuals.",
          },
        ],
      },
      {
        id: "changes",
        title: "Changes to this document",
        blocks: [
          {
            kind: "p",
            text: "We may update this policy: as the service changes, the rules change with it. The date of the current version is shown at the top of the page.",
          },
          {
            kind: "p",
            text: "For material changes — new categories of data, new recipients, new purposes — we will notify you in the service or by email before they take effect. Continuing to use Yuni afterwards means you accept the new version.",
          },
        ],
      },
      {
        id: "disclaimer",
        title: "Status of this document",
        blocks: [
          {
            kind: "todo",
            text: "TODO (before launch): this is a draft written from how the service actually works. It has not been reviewed by a lawyer and is not legal advice. A data protection specialist in the applicable jurisdiction must review it, and every TODO on this page must be resolved, before publication.",
          },
        ],
      },
    ],
  },
}
