import type { LegalContent } from "../types"

/**
 * Task 063 — Пользовательское соглашение.
 *
 * Механика знакомств описана по фактическому коду: сроки жизни лайков и
 * совпадений, этапный чат, лимиты голосовых сообщений, блокировки и жалобы.
 * Блоки `todo` — обязательства оператора и нереализованные функции, которые
 * должны быть закрыты до публикации. Черновик без юридической экспертизы.
 */
export const termsContent: LegalContent = {
  ru: {
    eyebrow: "Правовая информация",
    title: "Условия использования",
    updated: "14 августа 2026",
    updatedLabel: "Редакция от",
    tocLabel: "Содержание",
    intro: [
      "Это соглашение между вами и оператором сервиса Yuni. Оно описывает, что вы получаете, что от вас ожидается и что происходит, когда правила нарушены.",
      "Мы старались писать понятным языком и без формулировок, которые нужно расшифровывать. Если что-то осталось неясным — напишите на hello@yuni.app, и мы объясним.",
    ],
    sections: [
      {
        id: "acceptance",
        title: "Принятие условий",
        blocks: [
          {
            kind: "p",
            text: "Регистрируясь в Yuni, вы подтверждаете, что прочитали это соглашение и политику конфиденциальности и согласны с ними. Если вы с чем-то не согласны — не создавайте аккаунт.",
          },
          {
            kind: "p",
            text: "Соглашение действует всё время, пока существует ваш аккаунт. Отдельные разделы — об ответственности, о вашем контенте и о разрешении споров — продолжают действовать и после удаления аккаунта в той части, в какой это необходимо.",
          },
        ],
      },
      {
        id: "eligibility",
        title: "Кто может пользоваться сервисом",
        blocks: [
          {
            kind: "list",
            items: [
              "Вам исполнилось 18 лет. Это жёсткое требование, а не формальность: сервис предназначен для знакомств между взрослыми людьми.",
              "Вы регистрируете аккаунт на себя и указываете о себе достоверные сведения — имя, возраст, фотографии.",
              "У вас один аккаунт. Несколько анкет на одного человека вводят в заблуждение других пользователей.",
              "Ранее ваш аккаунт не удалялся нами за нарушение этих условий.",
            ],
          },
          {
            kind: "p",
            text: "Мы вправе запросить подтверждение возраста, если есть основания сомневаться, и ограничить доступ к аккаунту до получения ответа.",
          },
        ],
      },
      {
        id: "account",
        title: "Ваш аккаунт",
        blocks: [
          {
            kind: "p",
            text: "Доступ к аккаунту защищён паролем. Пароль храните в секрете и не передавайте его никому — действия, совершённые под вашей учётной записью, считаются вашими.",
          },
          {
            kind: "p",
            text: "Если вы подозреваете, что кто-то получил доступ к вашему аккаунту, немедленно напишите на hello@yuni.app: мы отзовём активные сессии.",
          },
          {
            kind: "todo",
            text: "TODO (продукт): самостоятельное восстановление пароля не реализовано (Task 031) — форма на странице «Забыли пароль» показывает успех, но письма не отправляет. Пока функция не работает, восстановление доступа возможно только через обращение на почту, и интерфейс не должен утверждать обратное.",
          },
        ],
      },
      {
        id: "rules",
        title: "Правила поведения",
        blocks: [
          {
            kind: "p",
            text: "Yuni держится на том, что людям в нём спокойно. Поэтому запрещено:",
          },
          {
            kind: "list",
            items: [
              "Выдавать себя за другого человека, использовать чужие фотографии или заведомо ложные сведения о себе.",
              "Домогательства, угрозы, преследование, разжигание ненависти по любому признаку.",
              "Сексуальный контент в открытой части анкеты и любые сексуальные материалы с участием несовершеннолетних — это влечёт немедленное удаление аккаунта и обращение в правоохранительные органы.",
              "Спам, реклама, продвижение сторонних сервисов, вербовка и просьбы о деньгах в любой форме, включая «инвестиции» и «помощь в трудной ситуации».",
              "Сбор данных других пользователей, автоматизированный обход сервиса, скрейпинг, попытки обойти лимиты и ограничения этапного чата.",
              "Публикация чужих персональных данных и переписки без согласия.",
              "Использование сервиса для любой деятельности, запрещённой применимым правом.",
            ],
          },
          {
            kind: "p",
            text: "Если вы столкнулись с нарушением — пожалуйтесь на пользователя. Жалоба доходит до нас с кодом причины и вашим комментарием, и мы разбираем её вручную.",
          },
        ],
      },
      {
        id: "your-content",
        title: "Ваш контент",
        blocks: [
          {
            kind: "p",
            text: "Фотографии, описание профиля и сообщения остаются вашими. Мы не претендуем на права на них.",
          },
          {
            kind: "p",
            text: "Загружая контент, вы даёте нам ограниченную лицензию: хранить его, обрабатывать технически (менять размер, готовить превью) и показывать другим пользователям в том объёме, который задан вашими настройками приватности. Лицензия нужна только для работы сервиса, она безвозмездная и действует, пока контент находится в сервисе.",
          },
          {
            kind: "p",
            text: "Вы отвечаете за то, что имеете право публиковать загружаемое: что на фотографиях вы, а не другой человек без его согласия, и что вы не нарушаете чужие авторские права.",
          },
          {
            kind: "p",
            text: "Мы вправе удалить контент, нарушающий эти правила, без предварительного предупреждения — и сообщим вам, что и почему было удалено.",
          },
          {
            kind: "todo",
            text: "TODO (продукт): при удалении фотографии запись удаляется из базы, но ошибка удаления самого файла молча проглатывается, и файл может остаться доступным по прямой ссылке (Task 047). До исправления сервис не может обещать, что удаление фотографии необратимо.",
          },
        ],
      },
      {
        id: "how-it-works",
        title: "Как устроены знакомства",
        blocks: [
          {
            kind: "p",
            text: "Мы описываем механику здесь, чтобы поведение сервиса не было для вас сюрпризом.",
          },
          {
            kind: "list",
            items: [
              "Лайк и пропуск действуют ограниченное время: по истечении срока анкета может снова появиться в вашей ленте.",
              "Взаимный лайк создаёт совпадение. Совпадение действует семь дней — если за это время диалог не начался, оно завершается.",
              "Диалог открывается поэтапно. На первом этапе доступен текст; голосовые сообщения появляются на втором этапе, когда переписка уже состоялась.",
              "На втором этапе действуют лимиты голосовых: не более 60 секунд на одно сообщение и не более 90 секунд суммарно на этап для каждого участника.",
              "По ходу диалога сервис предлагает вопросы-игры. Вопрос можно отложить один раз; переход на третий этап требует, чтобы вы вдвоём ответили на несколько вопросов.",
              "На третьем этапе ограничения снимаются.",
            ],
          },
          {
            kind: "p",
            text: "Мы можем менять эту механику, чтобы улучшать сервис. О существенных изменениях — например, об изменении сроков жизни совпадений — предупредим заранее.",
          },
        ],
      },
      {
        id: "moderation",
        title: "Модерация, блокировки и жалобы",
        blocks: [
          {
            kind: "p",
            text: "Вы можете заблокировать любого пользователя. Блокировка завершает совпадение с ним и закрывает общий диалог: переписка перестаёт быть доступной обеим сторонам, и снятие блокировки её не возвращает — для нового общения потребуется новое совпадение.",
          },
          {
            kind: "p",
            text: "Жалобы рассматриваются вручную. По итогам разбирательства мы можем удалить контент, вынести предупреждение, временно ограничить доступ или удалить аккаунт. Мы стараемся сообщать о решении и его причине.",
          },
          {
            kind: "p",
            text: "Ложные жалобы, поданные, чтобы навредить другому пользователю, сами являются нарушением этих правил.",
          },
          {
            kind: "todo",
            text: "TODO (продукт): пожаловаться сейчас можно только на пользователя целиком — привязка жалобы к конкретному сообщению или фотографии в API не принимается, хотя база данных это поддерживает (Task 062).",
          },
        ],
      },
      {
        id: "termination",
        title: "Приостановка и прекращение",
        blocks: [
          {
            kind: "p",
            text: "Вы можете прекратить пользоваться сервисом в любой момент и потребовать удаления аккаунта и данных.",
          },
          {
            kind: "todo",
            text: "TODO (продукт): кнопки удаления аккаунта в интерфейсе нет, эндпоинта в API тоже — удаление выполняется вручную по запросу на hello@yuni.app в срок до 30 дней. До появления самостоятельного удаления интерфейс не должен показывать неработающую кнопку.",
          },
          {
            kind: "p",
            text: "Мы можем ограничить или прекратить доступ, если вы нарушаете эти условия, если этого требует закон или если ваши действия создают риск для других пользователей. При грубых нарушениях — в первую очередь связанных с безопасностью несовершеннолетних — доступ прекращается немедленно и без предупреждения.",
          },
        ],
      },
      {
        id: "payments",
        title: "Платные функции",
        blocks: [
          {
            kind: "p",
            text: "На текущий момент сервис бесплатный. Платных подписок и покупок внутри сервиса нет, платёжные данные мы не принимаем и не храним.",
          },
          {
            kind: "p",
            text: "Если платные функции появятся, их условия — стоимость, порядок оплаты, возврата и отказа — будут опубликованы отдельно и вступят в силу только после вашего явного согласия.",
          },
          {
            kind: "todo",
            text: "TODO (продукт): в интерфейсе профиля присутствуют неработающие элементы, намекающие на премиум-возможности (Task 050). Их следует убрать или отключить, пока платных функций фактически нет.",
          },
        ],
      },
      {
        id: "disclaimer-liability",
        title: "Отказ от гарантий и ответственность",
        blocks: [
          {
            kind: "p",
            text: "Мы не гарантируем, что вы кого-то встретите, что собеседник ответит и что совпадение к чему-то приведёт. Сервис предоставляет площадку, а не результат.",
          },
          {
            kind: "p",
            text: "Мы не проверяем личность пользователей и не можем ручаться за достоверность того, что они о себе пишут. Относитесь к встречам офлайн с обычной осторожностью: выбирайте людное место, предупредите близких, не передавайте деньги и документы.",
          },
          {
            kind: "p",
            text: "Сервис предоставляется «как есть». Мы прилагаем разумные усилия к его бесперебойной работе, но не гарантируем отсутствие сбоев, перерывов в доступе и потери данных вследствие обстоятельств вне нашего контроля.",
          },
          {
            kind: "p",
            text: "Мы не отвечаем за действия других пользователей и за последствия ваших встреч с ними вне сервиса. Ничто в этом разделе не ограничивает ответственность, которую по закону ограничить нельзя, — включая ответственность за умышленные действия и за вред жизни и здоровью.",
          },
          {
            kind: "todo",
            text: "TODO (оператор): предел ответственности и его допустимость зависят от юрисдикции. Для потребителей в ЕС и в России ряд ограничений ничтожен — формулировку должен согласовать юрист.",
          },
        ],
      },
      {
        id: "changes",
        title: "Изменение условий",
        blocks: [
          {
            kind: "p",
            text: "Мы можем менять это соглашение. Дата действующей редакции указана в начале страницы.",
          },
          {
            kind: "p",
            text: "О существенных изменениях сообщим в сервисе или письмом до их вступления в силу. Если вы не согласны с новой редакцией, вы можете прекратить пользоваться сервисом и потребовать удаления аккаунта.",
          },
        ],
      },
      {
        id: "law",
        title: "Применимое право и споры",
        blocks: [
          {
            kind: "todo",
            text: "TODO (оператор): указать применимое право и порядок разрешения споров. Обратите внимание: для потребителей в ЕС нельзя лишить их права обращаться в суд по месту жительства, а в России действует обязательный претензионный порядок и подсудность по выбору потребителя.",
          },
          {
            kind: "p",
            text: "Прежде чем идти в суд, напишите нам на hello@yuni.app. Мы отвечаем на претензии и в большинстве случаев вопрос решается без разбирательства.",
          },
        ],
      },
      {
        id: "contacts",
        title: "Контакты",
        blocks: [
          {
            kind: "p",
            text: "По любым вопросам, включая жалобы и обращения о нарушении прав: hello@yuni.app.",
          },
          {
            kind: "todo",
            text: "TODO (оператор): реквизиты и адрес для официальной корреспонденции — те же, что в разделе «Кто обрабатывает ваши данные» политики конфиденциальности.",
          },
        ],
      },
      {
        id: "status",
        title: "Статус документа",
        blocks: [
          {
            kind: "todo",
            text: "TODO (до публикации): черновик, составленный по фактическому устройству сервиса. Юридической экспертизы не проходил и юридической консультацией не является. Перед запуском требуется вычитка юристом и закрытие всех блоков TODO на этой странице.",
          },
        ],
      },
    ],
  },

  en: {
    eyebrow: "Legal",
    title: "Terms of Use",
    updated: "14 August 2026",
    updatedLabel: "Last updated",
    tocLabel: "Contents",
    intro: [
      "This is an agreement between you and the operator of Yuni. It sets out what you get, what is expected of you, and what happens when the rules are broken.",
      "We tried to write it in plain language. If anything is unclear, write to hello@yuni.app and we will explain.",
    ],
    sections: [
      {
        id: "acceptance",
        title: "Accepting these terms",
        blocks: [
          {
            kind: "p",
            text: "By registering with Yuni you confirm that you have read and accept these terms and the privacy policy. If you disagree with any of it, do not create an account.",
          },
          {
            kind: "p",
            text: "These terms apply for as long as your account exists. Some sections — liability, your content, and dispute resolution — survive deletion of your account to the extent necessary.",
          },
        ],
      },
      {
        id: "eligibility",
        title: "Who may use the service",
        blocks: [
          {
            kind: "list",
            items: [
              "You are 18 or older. This is a hard requirement, not a formality: the service is for dating between adults.",
              "You register for yourself and give truthful information — name, age, photos.",
              "You hold one account. Multiple profiles for one person mislead other users.",
              "We have not previously deleted your account for breaching these terms.",
            ],
          },
          {
            kind: "p",
            text: "We may ask you to confirm your age where there is reason to doubt it, and may restrict access to the account until you respond.",
          },
        ],
      },
      {
        id: "account",
        title: "Your account",
        blocks: [
          {
            kind: "p",
            text: "Your account is protected by a password. Keep it secret and do not share it — actions taken under your account are treated as yours.",
          },
          {
            kind: "p",
            text: "If you suspect someone has gained access to your account, write to hello@yuni.app immediately and we will revoke active sessions.",
          },
          {
            kind: "todo",
            text: "TODO (product): self-service password recovery is not implemented (Task 031) — the «Forgot password» form reports success but sends no email. Until it works, access recovery is only possible by email, and the interface must not claim otherwise.",
          },
        ],
      },
      {
        id: "rules",
        title: "Rules of conduct",
        blocks: [
          {
            kind: "p",
            text: "Yuni only works if people feel safe in it. The following is prohibited:",
          },
          {
            kind: "list",
            items: [
              "Impersonating anyone, using someone else's photos, or giving knowingly false information about yourself.",
              "Harassment, threats, stalking, or hate speech on any ground.",
              "Sexual content in the public part of a profile, and any sexual material involving minors — which results in immediate account deletion and referral to law enforcement.",
              "Spam, advertising, promoting other services, recruitment, and requests for money in any form, including «investments» and hardship appeals.",
              "Harvesting other users' data, automated access, scraping, or circumventing the limits of the staged chat.",
              "Publishing other people's personal data or private conversations without consent.",
              "Using the service for anything unlawful under applicable law.",
            ],
          },
          {
            kind: "p",
            text: "If you encounter a breach, report the user. Your report reaches us with a reason code and your comment, and we review it by hand.",
          },
        ],
      },
      {
        id: "your-content",
        title: "Your content",
        blocks: [
          {
            kind: "p",
            text: "Your photos, bio and messages remain yours. We claim no ownership of them.",
          },
          {
            kind: "p",
            text: "By uploading content you grant us a limited licence: to store it, process it technically (resizing, generating previews) and display it to other users to the extent your privacy settings allow. The licence exists solely to run the service, is royalty-free, and lasts while the content is in the service.",
          },
          {
            kind: "p",
            text: "You are responsible for having the right to publish what you upload: that the photos are of you rather than another person without their consent, and that you are not infringing anyone's copyright.",
          },
          {
            kind: "p",
            text: "We may remove content that breaches these rules without prior warning, and will tell you what was removed and why.",
          },
          {
            kind: "todo",
            text: "TODO (product): deleting a photo removes the database record, but a failure to delete the underlying file is silently swallowed and the file may remain reachable by direct link (Task 047). Until that is fixed, the service cannot promise that photo deletion is irreversible.",
          },
        ],
      },
      {
        id: "how-it-works",
        title: "How matching works",
        blocks: [
          {
            kind: "p",
            text: "We describe the mechanics here so that the service's behaviour is not a surprise.",
          },
          {
            kind: "list",
            items: [
              "Likes and passes last a limited time; once they expire, a profile may reappear in your discovery feed.",
              "A mutual like creates a match. A match lasts seven days — if no conversation starts in that time, it ends.",
              "Conversations open in stages. Stage one is text only; voice messages become available at stage two, once you have actually been talking.",
              "At stage two voice messages are limited to 60 seconds each and 90 seconds in total per participant for that stage.",
              "As you talk, the service offers question games. A question can be postponed once; moving to stage three requires both of you to answer several of them.",
              "At stage three the restrictions are lifted.",
            ],
          },
          {
            kind: "p",
            text: "We may change these mechanics to improve the service. We will give advance notice of material changes, such as changes to how long matches last.",
          },
        ],
      },
      {
        id: "moderation",
        title: "Moderation, blocks and reports",
        blocks: [
          {
            kind: "p",
            text: "You can block any user. Blocking ends your match with them and closes the shared conversation: it becomes unavailable to both sides, and unblocking does not bring it back — a new match is required to talk again.",
          },
          {
            kind: "p",
            text: "Reports are reviewed by hand. Depending on the outcome we may remove content, issue a warning, temporarily restrict access, or delete the account. We aim to tell you the decision and the reason for it.",
          },
          {
            kind: "p",
            text: "False reports filed to harm another user are themselves a breach of these rules.",
          },
          {
            kind: "todo",
            text: "TODO (product): reports can currently only target a whole user — the API does not accept a specific message or photo, although the database supports it (Task 062).",
          },
        ],
      },
      {
        id: "termination",
        title: "Suspension and termination",
        blocks: [
          {
            kind: "p",
            text: "You may stop using the service at any time and ask us to delete your account and data.",
          },
          {
            kind: "todo",
            text: "TODO (product): there is no delete-account button in the interface and no endpoint in the API — deletion is carried out manually on request to hello@yuni.app within 30 days. Until self-service deletion exists, the interface must not show a button that does nothing.",
          },
          {
            kind: "p",
            text: "We may restrict or terminate access if you breach these terms, where the law requires it, or where your conduct puts other users at risk. For serious breaches — above all those involving the safety of minors — access ends immediately and without warning.",
          },
        ],
      },
      {
        id: "payments",
        title: "Paid features",
        blocks: [
          {
            kind: "p",
            text: "The service is currently free. There are no paid subscriptions or in-service purchases, and we neither accept nor store payment details.",
          },
          {
            kind: "p",
            text: "If paid features appear, their terms — price, payment, refunds and cancellation — will be published separately and will take effect only with your explicit agreement.",
          },
          {
            kind: "todo",
            text: "TODO (product): the profile screen contains non-functional elements hinting at premium features (Task 050). They should be removed or disabled while no paid features actually exist.",
          },
        ],
      },
      {
        id: "disclaimer-liability",
        title: "Disclaimers and liability",
        blocks: [
          {
            kind: "p",
            text: "We do not guarantee that you will meet anyone, that a match will reply, or that anything will come of it. The service provides a place to meet, not an outcome.",
          },
          {
            kind: "p",
            text: "We do not verify users' identities and cannot vouch for what they say about themselves. Treat meeting offline with ordinary caution: pick a public place, tell someone where you are going, and do not hand over money or documents.",
          },
          {
            kind: "p",
            text: "The service is provided «as is». We make reasonable efforts to keep it running but do not guarantee freedom from faults, interruptions, or data loss caused by circumstances outside our control.",
          },
          {
            kind: "p",
            text: "We are not responsible for other users' conduct or for what happens when you meet them outside the service. Nothing here limits liability that cannot be limited by law, including for intentional acts and for death or personal injury.",
          },
          {
            kind: "todo",
            text: "TODO (operator): whether a liability cap is enforceable depends on the jurisdiction. Several such limitations are void for consumers in the EU and in Russia — the wording needs a lawyer's approval.",
          },
        ],
      },
      {
        id: "changes",
        title: "Changes to these terms",
        blocks: [
          {
            kind: "p",
            text: "We may change this agreement. The date of the current version is shown at the top of the page.",
          },
          {
            kind: "p",
            text: "We will announce material changes in the service or by email before they take effect. If you do not accept the new version, you may stop using the service and ask us to delete your account.",
          },
        ],
      },
      {
        id: "law",
        title: "Governing law and disputes",
        blocks: [
          {
            kind: "todo",
            text: "TODO (operator): state the governing law and dispute resolution route. Note that EU consumers cannot be deprived of the right to sue in their country of residence, and Russian law gives consumers a choice of venue and requires a pre-action claim.",
          },
          {
            kind: "p",
            text: "Before going to court, please write to hello@yuni.app. We answer complaints, and most matters are resolved without proceedings.",
          },
        ],
      },
      {
        id: "contacts",
        title: "Contact",
        blocks: [
          {
            kind: "p",
            text: "For anything, including complaints and rights-infringement notices: hello@yuni.app.",
          },
          {
            kind: "todo",
            text: "TODO (operator): registration details and postal address for formal correspondence — the same as in the «Who processes your data» section of the privacy policy.",
          },
        ],
      },
      {
        id: "status",
        title: "Status of this document",
        blocks: [
          {
            kind: "todo",
            text: "TODO (before launch): a draft written from how the service actually works. It has not been reviewed by a lawyer and is not legal advice. Legal review and resolution of every TODO on this page are required before launch.",
          },
        ],
      },
    ],
  },
}
