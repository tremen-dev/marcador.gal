-- 0008_admin.sql — SPEC-017, las dos tablas del panel del operador
-- (ADR-024 §7 y §8).
--
-- Escrita a mano, aplicada en orden, y SIN ROLLBACK (ADR-006): deshacer esto
-- es escribir 0009.
--
-- NINGUNA DE LAS DOS ES EL MODELO CANÓNICO, como no lo son `request_rhythm`,
-- `calendar_loads`, `alias_loads`, `ingest_attempts`, `alerts` ni las tres del
-- bot: ni entrada de paridad (SPEC-001 CA-14), ni esquema zod en `src/model/`.
-- Y ESTA MIGRACIÓN NO AÑADE NI UNA COLUMNA a `observations`, `decisions`,
-- `matches`, `competitions`, `teams` ni `alerts` (CA-4.3): la spec con más
-- poder del sistema no toca el modelo canónico.
--
-- LAS DOS SON APPEND-ONLY CON `reject_amendment` (0001, reutilizada), como
-- `decisions`, `alerts`, `calendar_loads`, `alias_loads` e `ingest_attempts`.
-- Un acuse es un hecho histórico y un acto del operador también: deshacer un
-- acuse no es borrarlo, es que la condición vuelva y el motor escriba otra
-- alerta (ADR-024 §7).
--
-- NINGUNA COLUMNA DE LAS DOS PUEDE ALBERGAR UN IDENTIFICADOR DE PERSONA
-- (CA-6.3), y eso se lee EN EL ESQUEMA y no en el código. Cada columna es una
-- de cinco cosas, y no hay una sexta:
--
--   * un entero de identidad (`operator_actions.id`);
--   * un instante (`timestamptz`);
--   * una lista cerrada de palabras (`action`, `outcome`), no texto libre;
--   * una clave ajena a datos del calendario o del motor (`match_id` →
--     `matches`, `alert_id` → `alerts`), que solo puede contener lo que ya
--     está ahí;
--   * una clave del raw store restringida por forma (`raw_ref like
--     'operador/%'`), que es un objeto archivado y no un nombre.
--
-- El `operator_id` vive en el objeto crudo redactado y en ningún otro sitio
-- durable: UN SOLO RÉGIMEN para «quién hizo esto» en todo el proyecto
-- (ADR-024 §6, ADR-022 §2 por analogía).
--
-- El tiempo es `timestamptz`; la conversión a la cadena ISO 8601 UTC ocurre en
-- la capa de acceso a datos, no en las llamadas.

-- ─────────────────────────────────────────────────────────────────────────────
-- La bandeja: el acuse de UNA FILA de `alerts`, nunca de una condición.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- `alerts` NO SE TOCA: ni columna nueva, ni trigger cambiado, ni `update`, ni
-- `delete` (ADR-021 §5 lo dejó escrito por adelantado: «la bandeja es del
-- panel, y cuando lo traiga será una tabla suya»). Esta es esa tabla.
--
-- «ABIERTA» SE CALCULA, NO SE GUARDA: una alerta está abierta si no tiene fila
-- aquí. No hay columna de estado, ni «vista», ni «resuelta» — sería el tercer
-- log mutable que ADR-021 §2 está construido para no tener.
--
-- `unique (alert_id)`: una alerta se reconoce UNA VEZ, y reconocerla dos veces
-- es idempotente (CA-6.7). Si la condición vuelve con otro motivo, el motor
-- escribe OTRA fila en `alerts` y esa vuelve a aparecer abierta (CA-6.8).
create table alert_acks (
  alert_id integer     not null references alerts (id),
  acked_at timestamptz not null,
  -- El objeto crudo del acuse (RN-10). Es también donde vive el `operator_id`
  -- y el motivo escrito por la persona: aquí no hay columna para ninguno.
  raw_ref  text        not null check (raw_ref like 'operador/%'),
  constraint alert_acks_one_per_alert unique (alert_id)
);

create index alert_acks_by_time on alert_acks (acked_at desc);

create trigger alert_acks_are_immutable
before update or delete on alert_acks
for each row
execute function reject_amendment();

-- ─────────────────────────────────────────────────────────────────────────────
-- La cuarta cifra: lo que el panel deja medible mientras la jornada ocurre.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Una fila por acción QUE LLEGÓ CON SESIÓN Y VALE VÁLIDOS (ADR-024 §8). Una
-- petición rechazada ANTES de la sesión o del vale no deja ninguna: la tabla
-- mide operación, no a quien llama a la puerta. Una rechazada por una razón
-- del dominio —motivo vacío, partido fuera de jornada— SÍ deja fila, porque
-- ocurrió DESPUÉS de que la persona llegara y escribiera, y costó tiempo.
--
-- `started_at` es el `issued_at` DEL VALE: cuándo se le puso el formulario
-- delante a la persona. Sin proceso vivo (ADR-004) es lo único que permite
-- medir tiempo sobre tarea, y lo que no se escribe mientras pasa no se
-- reconstruye después (ADR-019 §5, mismo argumento).
--
-- Y ES UNA COTA INFERIOR, declarado donde se mide (CA-8.4): no cuenta leer la
-- pantalla, ni esperar, ni decidir sin enviar, ni el tiempo entre dos
-- acciones. Quien publique la cifra tiene que publicar esa frase al lado.
create table operator_actions (
  id           integer     generated always as identity primary key,
  -- Lista cerrada, no una forma: el vocabulario de ADR-024 §6.
  action       text        not null
                 check (action in ('correccion', 'estado', 'ratificacion', 'acuse')),
  -- EL OBJETIVO, EN DOS COLUMNAS Y CON CLAVE AJENA. Es lo que hace legible en
  -- el esquema que ninguna de las dos puede albergar a una persona: solo
  -- pueden contener un partido del calendario declarado o una alerta del
  -- motor. Exactamente una de las dos, nunca las dos ni ninguna.
  match_id     text        references matches (id),
  alert_id     integer     references alerts (id),
  started_at   timestamptz not null,
  submitted_at timestamptz not null,
  outcome      text        not null
                 check (outcome in ('accepted', 'rejected_empty_reason',
                                    'rejected_out_of_matchday', 'rejected_unknown_alert',
                                    'rejected_nothing_to_ratify')),
  -- Nulo cuando la acción se rechazó ANTES de archivar nada (CA-4.2).
  raw_ref      text        check (raw_ref like 'operador/%'),
  constraint operator_actions_one_target check ((match_id is null) <> (alert_id is null)),
  constraint operator_actions_clock check (submitted_at >= started_at)
);

create index operator_actions_by_time on operator_actions (submitted_at desc);

create trigger operator_actions_are_immutable
before update or delete on operator_actions
for each row
execute function reject_amendment();
