/**
 * SPEC-018 CA-3.8, CA-3.9 y CA-19 — lo que NO sostiene el código, escrito donde
 * se va a leer.
 *
 * ESTE FICHERO NO PROMETE MÁS DE LO QUE VE, y es importante decirlo porque es
 * justo la clase de test que se confunde con una barrera: **afirma que la línea
 * está escrita en el runbook, no que alguien la cumpla**. Ninguna de estas
 * comprobaciones impide un despliegue anticipado, ninguna detecta que el aviso
 * a la RFGF no se dio, y ninguna detecta que se cruzó un umbral del
 * re-dictamen. **Son compromisos escritos, no barreras** (CA-19.6), y el propio
 * `calendario-de-compromisos.md` lo declara en su cierre.
 *
 * Lo que sí compra: que la línea no desaparezca en silencio de un fichero que
 * nadie relee.
 */
import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';

const CALENDAR = 'docs/procedimientos/carga-del-calendario.md';
const COMMITMENTS = 'docs/procedimientos/calendario-de-compromisos.md';

async function read(path: string): Promise<string> {
  return await readFile(path, 'utf8');
}

describe('CA-3.8 y CA-3.9 — las dos líneas del runbook de carga del calendario', () => {
  test('1. el calendario declarado NO se deriva de ninguna fuente rastreada', async () => {
    const runbook = await read(CALENDAR);

    expect(runbook).toContain(
      'no se deriva de ninguna fuente rastreada, ni a mano ni\ncon un LLM sobre su HTML',
    );
    // Y la precisión que evita la lectura mala: teclearlo de la web pública de
    // la RFGF con un navegador NO incumple nada.
    expect(runbook).toContain('RN-11 gobierna la petición automatizada, no la lectura humana');
    // Y por qué importa: nada en el código lo protege.
    expect(runbook).toContain('nada en el código lo protege');
  });

  test('2. PARAR ES VACIAR `MEASUREMENT_WINDOWS`, con esas palabras', async () => {
    const runbook = await read(CALENDAR);

    expect(runbook).toContain('parar es vaciar la lista de `src/ingest/measurement.ts`');
    expect(runbook).toContain('se para primero y se dictamina\ndespués');
    expect(runbook).toContain('En la duda, se para');
    // Y las dos consecuencias, para que quien lo haga sepa qué queda apagado.
    expect(runbook).toContain('el cron no pide nada');
    expect(runbook).toContain('cero consultas');
  });

  test('3. y el cambio de hora de finales de octubre tiene su línea', async () => {
    const runbook = await read(CALENDAR);

    expect(runbook).toContain('horario de invierno');
    expect(runbook).toContain('Disparador: el cambio de hora');
  });
});

describe('CA-19 — los compromisos que ningún test sostiene, en el calendario', () => {
  test('4. CA-19.1 — no se despliega antes del 08, y no antes de avisar a la RFGF', async () => {
    const commitments = await read(COMMITMENTS);

    expect(commitments).toContain(
      'No se despliega el marcador antes de esta fecha, y no antes de que la RFGF haya sido avisada',
    );
    expect(commitments).toContain('lo que ocurra MÁS TARDE de los dos');
    // Y la ordenación de los tres días, escrita para no descubrirla sobre la marcha.
    expect(commitments).toContain('06 verificar · 07 ajustar · 08 desplegar');
  });

  test('5. CA-19.2 — avisar a la RFGF es un compromiso humano, y NO es el correo prohibido', async () => {
    const commitments = await read(COMMITMENTS);

    expect(commitments).toContain('Avisar a la RFGF de que el marcador se publica');
    expect(commitments).toContain('lo prohibido es un RECORDATORIO');
    expect(commitments).toContain('Este aviso **no pide nada**');
    // La respuesta honesta en la cuarta columna.
    expect(commitments).toContain('Nada se pone rojo, y nadie detecta que el aviso no se dio');
  });

  test('6. CA-19.3 — el disparador de re-dictamen entra con sus OCHO puntos', async () => {
    const commitments = await read(COMMITMENTS);

    const section = commitments.slice(
      commitments.indexOf('## El disparador de re-dictamen'),
      commitments.indexOf('## Por qué existe este documento'),
    );

    expect(section.length).toBeGreaterThan(500);
    for (const point of [1, 2, 3, 4, 5, 6, 7, 8]) {
      expect(section, `falta el punto ${point}`).toContain(`\n${point}. `);
    }
    expect(section).not.toContain('\n9. ');

    // Enlazarla desde `/proxecto` y `/robot` NO dispara: es obligatorio.
    expect(section).toContain('NO dispara: es\n   obligatorio');
    // La cláusula permanente, y la regla de clasificación de la respuesta.
    expect(section).toContain('se para primero y se dictamina después');
    expect(section).toContain('En la duda, se para');
    expect(section).toContain('«no nos rastreéis» NO detiene la\npublicación');
  });

  test('7. CA-19.4 — el punto de tráfico se sustituye por algo que alguien puede observar', async () => {
    const commitments = await read(COMMITMENTS);

    // Se cuenta EL DOCUMENTO y no la ruta de refresco.
    expect(commitments).toContain('las cargas del DOCUMENTO');
    expect(commitments).toContain('no** la ruta de refresco');
    expect(commitments).toContain('primera aparición de un `Referer` que no sea este origen');
    expect(commitments).toContain('Umbral: **100 cargas**');
    // Y una fila más: al día siguiente de cada jornada, una persona lo mira.
    expect(commitments).toContain('Al día siguiente de cada jornada declarada');
    // Lo que se declara NO vigilable, sin eufemismos.
    expect(commitments).toContain('no sabemos ni sabremos quién abre esta pantalla');
  });

  test('8. CA-19.5 — el párrafo de cierre ya no dice «cuatro de estas cinco fechas»', async () => {
    const commitments = await read(COMMITMENTS);

    expect(commitments).not.toContain('Cuatro de estas cinco fechas');
    expect(commitments).toContain('Ocho de estas nueve fechas');

    // La cuenta cuadra con la tabla: nueve filas de fecha.
    const rows = [...commitments.matchAll(/^\| \*\*[^|]+\*\*[^|]*\|/gm)];
    expect(rows).toHaveLength(9);
  });

  test('9. CA-19.6 — y se declara que NO son barreras', async () => {
    const commitments = await read(COMMITMENTS);

    expect(commitments).toContain('Son\ncompromisos escritos, no barreras');
    expect(commitments).toContain('para que nadie los cuente como barreras al leer la matriz');
  });
});
