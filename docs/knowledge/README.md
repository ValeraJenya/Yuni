# Yuni knowledge guide

Учебный навигатор для команды. Он объясняет термины, но не является вторым источником архитектурной истины. Актуальные CURRENT/TARGET/PROPOSED/OPEN статусы и evidence находятся в [Architecture](../architecture/README.md).

## Network basics

IP и маршрутизация — L3: как пакет находит сеть назначения. TCP/UDP и порты — L4: как различить соединения и приложения. HTTP и маршрутизация по host/path — L7. NAT переводит адреса; firewall разрешает или запрещает трафик. IPv4 и IPv6 требуют согласованных правил. DNS сопоставляет имя с сетевым адресом; это не load balancer и не authorization.

В Yuni локальный браузер обращается к frontend/API, а API — к PostgreSQL. Клиенту не нужен DB URL. Сетевой порт, слушающий только loopback, и сервис, опубликованный на всех интерфейсах, имеют разные границы доступа. Точные текущие привязки смотрите в [request flow](../architecture/program-flow-map.md).

## HTTP, TLS, REST и WSS

HTTP задаёт запросы/ответы; TLS защищает транспорт. Корректные названия: HTTP/1.1, HTTP/2, HTTP/3 и отдельно TLS 1.2/1.3; версии HTTP/1.2 нет. HTTP/1.1 и HTTP/2 обычно работают поверх TCP; HTTP/3 использует QUIC поверх UDP. HTTPS — HTTP с защищённым транспортом. Поддержка версии зависит от реально настроенных endpoints и не следует из картинки архитектуры ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Evolution_of_HTTP)).

REST — подход к HTTP API, а не отдельный сетевой слой. WebSocket поддерживает длительное двустороннее соединение; WSS — его защищённый вариант. Существование REST chat не означает существование WSS. TLS termination — место расшифровки внешнего соединения; защищённость следующего hop нужно решать отдельно.

## Backend request lifecycle и реальный Yuni flow

Пример: изменение своего профиля идёт через frontend API client → JWT guard → DTO validation → `CurrentUser` → service → Prisma → safe response. Браузерное поле `userId` не заменяет authenticated identity. Подробные auth/profile/media пути и конкретные файлы — в [Program Flow Map](../architecture/program-flow-map.md); API endpoint inventory — в [API reference](../api/README.md).

## PostgreSQL basics

Таблица хранит данные; PK идентифицирует строку, FK связывает владельца/ресурс, UNIQUE предотвращает дубли. Транзакция объединяет операции с БД, но не превращает удаление файла или внешний payout в часть той же атомарной операции. Индекс ускоряет определённые запросы и имеет цену при записи. Source of truth схемы Yuni — [Prisma и миграции](../database/schema-and-migrations.md), не старый SQL reference.

## S3 / object storage

Object storage хранит bytes по key, а база — владельца и metadata. S3 — storage API; наличие поля `storageKey` не означает работающий S3. Backend upload и presigned upload имеют разные границы доверия. Выбор provider/upload/privacy и текущее локальное хранение — в [Scaling Roadmap](../architecture/scaling-roadmap.md).

## Redis / cache

Cache — временная копия с правилами freshness и eviction, не автоматически authoritative data. Pub/Sub передаёт события, но само по себе не доказывает durable delivery. Перед Redis нужно определить problem/data/TTL/source of truth/failure/consistency; конкретные Yuni candidates собраны в [candidate gate](../architecture/scaling-roadmap.md).

## Load balancing

L4 распределяет соединения, L7 может учитывать HTTP host/path. Health checks позволяют не отправлять новые запросы на неподготовленный backend. Draining даёт завершить старые соединения; WSS требует reconnect-плана. Несколько backend не устраняют одиночную точку отказа БД. CURRENT и TARGET схемы не следует смешивать: см. [Scaling Roadmap](../architecture/scaling-roadmap.md).

## Docker / Kubernetes

Docker запускает контейнеры; Compose описывает группу локальных сервисов. Kubernetes оркестрирует приложения: Pod — единица запуска, Service — стабильная сеть к Pod, Ingress/Gateway — входная маршрутизация. Эти понятия не означают, что Yuni использует Kubernetes. Условия его рассмотрения и более простые альтернативы находятся в [orchestration decisions](../architecture/scaling-roadmap.md).
