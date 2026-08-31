/**
 * CA-4a — la paridad de bundles es un TIPO, no una costumbre.
 *
 * Prueba invertida, como `tests/mirror/analysis/modes.test-d.ts`: si el
 * invariante deja de sostenerse, la directiva `@ts-expect-error` queda sin
 * usar y `npm run typecheck` falla. Es decir, esto se rompe tanto si un bundle
 * incompleto empieza a compilar como si el tipo deja de exigir las claves.
 */
import type { SiteBundle } from '@/i18n/site-bundle';
import { es } from '@/i18n/es';
import { gl } from '@/i18n/gl';

// Los dos bundles reales satisfacen el MISMO tipo. Si a uno le falta una
// clave, el error aparece en su propio fichero, no aquí.
const galego: SiteBundle = gl.site;
const castellano: SiteBundle = es.site;
void galego;
void castellano;

// Y los dos tienen exactamente el mismo tipo de espacio de nombres.
const swapped: typeof gl.site = es.site;
void swapped;

// A un bundle al que le falta una clave NO se le deja pasar.
// @ts-expect-error falta todo salvo `documentTitle`
const incomplete: SiteBundle = { documentTitle: 'x' };
void incomplete;

// Y una clave de más tampoco: el sitio no dice nada más (CA-8).
// @ts-expect-error `tagline` no está en el contrato
const extra: SiteBundle = { ...gl.site, tagline: 'x' };
void extra;
