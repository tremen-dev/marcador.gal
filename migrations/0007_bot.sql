-- 0007_bot.sql — SPEC-015, las tres tablas del bot del corresponsal
-- (ADR-022 §4, ADR-023 §4).
--
-- Escrita a mano, aplicada en orden, y SIN ROLLBACK (ADR-006): deshacer esto
-- es escribir 0008.
--
-- NINGUNA DE LAS TRES ES EL MODELO CANÓNICO, como no lo son `request_rhythm`,
-- `calendar_loads`, `alias_loads`, `ingest_attempts` ni `alerts`: ni entrada de
-- paridad (SPEC-001 CA-14), ni esquema zod en `src/model/`.
--
-- Y NINGUNA DE LAS TRES ES APPEND-ONLY, que es lo que las distingue de todo lo
-- anterior de este esquema. `bot_proposals` registra un acto EN CURSO y SE
-- BORRA al resolverse; `correspondent_state` es preferencia y estado, que
-- cambian por definición. Por eso no llevan `reject_amendment`: RN-13 habla del
-- log de hechos históricos, y ninguna de estas dos lo es (ADR-022 §4).
--
-- EL `correspondent_id` NO ESTÁ EN NINGUNA TABLA APPEND-ONLY (CA-10.1). Su
-- único domicilio durable es el objeto crudo redactado; estas dos tablas lo
-- nombran mientras la propuesta vive o mientras la persona está de alta, y la
-- primera se vacía al resolverse. La forma `corresponsal-\d+` se impone aquí
-- también, con la misma razón que en zod: `corresponsal-<localidad>` en un
-- repositorio público, cruzado con el calendario, identifica a una persona.
--
-- El tiempo es `timestamptz`; la conversión a la cadena ISO 8601 UTC ocurre en
-- la capa de acceso a datos, no en las llamadas.

-- ─────────────────────────────────────────────────────────────────────────────
-- La conversación que no vive: una propuesta pendiente, durable y transitoria.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- SIN NINGÚN IDENTIFICADOR DE TELEGRAM, y no le hace falta: para contestar el
-- callback y editar la tarjeta basta con lo que el propio callback trae. Lo
-- único que necesita del remitente es el `correspondent_id`, y sirve para lo
-- que importa — SOLO EL MISMO CORRESPONSAL PUEDE CONFIRMAR SU PROPIA PROPUESTA
-- (CA-7.4).
create table bot_proposals (
  id                text        primary key check (length(id) > 0),
  correspondent_id  text        not null check (correspondent_id ~ '^corresponsal-[0-9]+$'),
  -- NULO MIENTRAS LA IDENTIDAD LA DECIDE LA PERSONA. Si el modelo no
  -- identifica ninguno de los candidatos, la propuesta se guarda SIN partido y
  -- la persona elige en un teclado con los nombres canónicos: adivinar es
  -- exactamente lo que ADR-022 §5 prohíbe. Hasta que elige y confirma no hay
  -- ninguna fila en `observations` (CA-6.4, CA-7.1).
  match_id          text        references matches (id),
  status            text        not null
                      check (status in ('scheduled', 'live', 'finished', 'postponed', 'suspended')),
  -- La misma regla de marcador que protege `Observation` y `Decision`
  -- (SPEC-001 CA-18): o los dos marcadores, o ninguno, y siempre según la rama.
  home_score        integer     check (home_score >= 0),
  away_score        integer     check (away_score >= 0),
  minute            integer     check (minute >= 0),
  -- Las referencias a los dos objetos crudos YA ARCHIVADOS (RN-10). La del
  -- mensaje es la que hereda la `Observation`; la de la propuesta queda
  -- colgante, y eso es estado legítimo declarado (ADR-020 §4, CA-4.3).
  message_raw_ref   text        not null check (length(message_raw_ref) > 0),
  proposal_raw_ref  text        not null check (length(proposal_raw_ref) > 0),
  created_at        timestamptz not null,
  expires_at        timestamptz not null check (expires_at > created_at),
  constraint bot_proposals_scoreboard check (
    (status in ('live', 'finished', 'suspended'))
      = (home_score is not null and away_score is not null)
  )
);

create index bot_proposals_by_correspondent on bot_proposals (correspondent_id);
create index bot_proposals_by_expiry on bot_proposals (expires_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- Lo que el bot recuerda de una persona entre conversaciones.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- LA LENGUA ES PREFERENCIA EXPLÍCITA, NUNCA EL `language_code` DEL CLIENTE
-- (ADR-022 §8). Telegram no ofrece galego, así que inferirla del cliente
-- pondría a casi todos en castellano y vaciaría D-2 sin que nadie lo viese.
-- `null` significa galego, que es el defecto (CA-11.4).
--
-- `opted_out_at` ES EL DERECHO DE OPOSICIÓN EJERCIDO EN EL ACTO (art. 21,
-- ADR-023 §4): desde que hay fecha, esa persona se trata como un remitente no
-- autorizado. El borrado del mapeo es otra cosa y es un acto manual del
-- operador, con acuse escrito.
create table correspondent_state (
  correspondent_id text        primary key check (correspondent_id ~ '^corresponsal-[0-9]+$'),
  locale           text        check (locale in ('gl', 'es')),
  notice_sent_at   timestamptz,
  opted_out_at     timestamptz
);

-- ─────────────────────────────────────────────────────────────────────────────
-- El contador agregado de lo rechazado (CA-2.1).
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Un update rechazado YA HA SIDO RECIBIDO —Telegram empuja antes de que
-- nosotros decidamos—, así que lo único que la spec puede garantizar es que NO
-- DEJA RASTRO. Se cuenta, y el contador es un agregado SIN PERSONA DENTRO:
-- ninguna de sus tres columnas puede albergar un identificador de nadie, y un
-- caso lo afirma LEYENDO EL ESQUEMA DE LA TABLA y no el código.
--
--   * `day`    es una fecha;
--   * `reason` es una lista cerrada de tres valores, no texto libre;
--   * `count`  es un entero.
--
-- Sin `id` de fila, sin instante exacto y sin origen: un rechazo por minuto con
-- su instante sería, con un solo corresponsal, un rastro de actividad de una
-- persona identificable por quien tenga el mapeo.
create table bot_rejections (
  day    date    not null,
  reason text    not null check (reason in ('unauthorised', 'out_of_matchday', 'notice_pending')),
  count  integer not null default 0 check (count >= 0),
  primary key (day, reason)
);
