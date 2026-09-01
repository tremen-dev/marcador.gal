/**
 * SPEC-006 CA-3a — la paridad del namespace de títulos es un TIPO, no una
 * costumbre: añadir una página y olvidar una lengua tiene que ser un fallo de
 * `npm run typecheck`, no una pestaña vacía.
 *
 * Prueba invertida, igual que `tests/site/bundles.test-d.ts`: si el invariante
 * deja de sostenerse, la directiva `@ts-expect-error` queda sin usar y `tsc`
 * falla. Se rompe tanto si un bundle incompleto empieza a compilar como si el
 * tipo deja de exigir las claves.
 */
import type { TitlesBundle } from '@/i18n/titles-bundle';
import { es } from '@/i18n/es';
import { gl } from '@/i18n/gl';

// Los dos bundles reales satisfacen el MISMO tipo. Si a uno le falta una
// clave, el error aparece en su propio fichero, no aquí.
const galego: TitlesBundle = gl.titles;
const castellano: TitlesBundle = es.titles;
void galego;
void castellano;

// Y los dos tienen exactamente el mismo tipo de espacio de nombres.
const swapped: typeof gl.titles = es.titles;
void swapped;

// A un bundle al que le falta el título de una página NO se le deja pasar.
// @ts-expect-error falta `crawler`
const incomplete: TitlesBundle = { project: 'x' };
void incomplete;

// Y una clave de más tampoco: el contrato es un título por página y nada más.
// Descripciones, `og:` y canónicas están fuera de alcance de SPEC-006.
// @ts-expect-error `description` no está en el contrato
const extra: TitlesBundle = { ...gl.titles, description: 'x' };
void extra;
