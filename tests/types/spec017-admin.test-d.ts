/**
 * CA-9.1, CA-9.3, CA-9.7 y CA-2.5 — los invariantes de TIPO de SPEC-017.
 *
 * Prueba invertida, como el resto de `tests/types/`: si el invariante deja de
 * sostenerse, la directiva `@ts-expect-error` queda sin usar y `npm run
 * typecheck` falla. Aquí eso significa cuatro cosas:
 *
 *   1. una lengua incompleta NO COMPILA (CA-9.1, CA-9.7);
 *   2. un literal visible escrito en `src/admin/` NO COMPILA (CA-9.3) — que es
 *      el control positivo que el criterio pide, en la forma en la que este
 *      mecanismo es exacto: `Publicar` es una palabra ASCII sin acento,
 *      indistinguible de un identificador para cualquier escaneo de prosa;
 *   3. NINGÚN MIEMBRO DE `AdminPorts` ES UN ALMACÉN (CA-2.5): el motor entra
 *      como función y la lectura del log también;
 *   4. y la puerta de lectura devuelve VALORES, no puertos.
 */
import type { AdminBundle } from '@/i18n/admin-bundle';
import type { AdminText } from '@/i18n/admin';
import type { AdminPorts } from '@/admin/ports';
import type { MatchDecisionLog } from '@/decide/read-entry';
import type { EngineOutcomeSummary } from '@/decide/engine-entry';
import { adminBundle } from '@/i18n/admin';
import { es } from '@/i18n/es';
import { gl } from '@/i18n/gl';

// ── CA-9.1 y CA-9.7 — las dos lenguas satisfacen el MISMO contrato ───────────
const galego: AdminBundle = gl.admin;
const castelan: AdminBundle = es.admin;
void galego;
void castelan;

const swapped: typeof gl.admin = es.admin;
void swapped;

// @ts-expect-error CA-9.7: a un bundle al que le falta todo lo demás no se le deja pasar
const incomplete: AdminBundle = { formSubmit: 'Publicar' };
void incomplete;

// @ts-expect-error CA-9.1: y una clave de más tampoco: el contrato es cerrado
const extra: AdminBundle = { ...gl.admin, formEmoji: '⚽' };
void extra;

// ── CA-9.3 — un literal visible en `src/admin/` NO COMPILA ───────────────────
declare function paragraph(value: AdminText, className?: string): string;

// El camino legítimo: el texto sale del bundle.
const fromBundle = paragraph(adminBundle('gl').formSubmit);
void fromBundle;

// @ts-expect-error CA-9.3: un literal en galego impecable es incumplimiento de D-2 igual
const hardcodedGalego = paragraph('Publicar');
void hardcodedGalego;

declare const anyString: string;
// @ts-expect-error CA-9.3: y una cadena cualquiera tampoco es texto del bundle
const hardcodedAny = paragraph(anyString);
void hardcodedAny;

// Y `AdminText` sí es una cadena: se interpola y se compara como tal.
declare const branded: AdminText;
const asString: string = branded;
void asString;

// ── CA-2.5 — ningún miembro de `AdminPorts` es un almacén de decisiones ──────
declare const ports: AdminPorts;

// El motor entra COMO FUNCIÓN: lo que el panel tiene es la capacidad de PEDIR.
const ask: (matchId: never, now: never) => Promise<EngineOutcomeSummary> = ports.runEngine;
void ask;

// @ts-expect-error CA-2.5: no hay ningún `DecisionStore` entre los puertos
void ports.decisions;

// @ts-expect-error CA-2.5: ni `EnginePorts`
void ports.engine;

// @ts-expect-error CA-2.5: ni un `sql` por el que colarse
void ports.sql;

// @ts-expect-error CA-2.5: y `runEngine` no es un almacén: no tiene `append`
void ports.runEngine.append;

// @ts-expect-error CA-2.5: ni `readDecisions`
void ports.readDecisions.append;

// ── La puerta de LECTURA devuelve valores, nunca un puerto ───────────────────
declare const read: MatchDecisionLog;

// @ts-expect-error CA-12: no devuelve `DecisionStore`
void read.decisions.append;

// @ts-expect-error CA-12: ni `EnginePorts`
void read.ports;

// @ts-expect-error CA-12: ni la conexión
void read.sql;
