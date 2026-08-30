# marcador.gal

**Todo o fútbol galego nunha pantalla.**

Resultados en directo del fútbol galego (Preferente, Primeira e Segunda Galega,
femenino) y de las divisiones nacionales, en una sola pantalla y en galego.
Retoma la idea de marcadorgalego.gal con nombre, imagen y tecnología propios:
inspiración, no sucesión.

Proyecto de [tremen.dev](https://tremen.dev). Dominio `.gal` aún sin contratar.

## Estado

**Sin código todavía.** El trabajo en curso es `EPIC-001 — Spike de ingesta`: una
semana de medición sobre Tercera RFEF G1 + Preferente Futgal G1 para responder con
números si el proyecto es viable. Ver `docs/tablero.md` y `docs/roadmap.md`.

## Cómo se trabaja aquí

Estándar **tremen-sdd**: nada se implementa sin una SPEC aprobada por un humano;
las decisiones técnicas se registran como ADR; la evidencia de verificación vive
en el ledger de cada spec. Empieza por `FOUNDATION.md`.

| Fichero | Contenido |
|---|---|
| `FOUNDATION.md` | Constitución: decisiones locked D-1..D-8, alcance, no-negociables |
| `docs/tablero.md` | Estado agregado (**generado**, no editar; `/sdd-tablero`) |
| `docs/roadmap.md` | Secuencia de épicas e intención |
| `docs/runbook-configuracion.md` | **Cómo levantar el entorno en una máquina limpia** |
| `docs/fundacion/contexto.md` | Contexto maestro: dónde estamos y por qué |
| `docs/fundacion/vision.md` | Problema, público, promesa, qué no somos |
| `docs/fundacion/dominio.md` | Glosario canónico (Observation, Decision, *sen sinal*…) |
| `docs/fundacion/reglas.md` | Reglas de negocio RN-01..RN-13 (motor de decisiones e invariantes) |
| `docs/fundacion/retos.md` | Análisis de retos: legal, datos, técnico, diseño, operativo |
| `docs/fundacion/spike-ingesta-propuesta.md` | Documento fuente del spike (referencia histórica) |
| `docs/epicas/` | Épicas |
| `docs/adr/` | ADRs (los cinco, **aprobados** y por tanto inmutables) |
| `docs/negocio/` | Monetización y marca |

## Arranque

```bash
git checkout ft/SPEC-001-modelo-canonico-y-raw-store   # el código NO está en main
npm install
npm test
```

**El código vive en la rama de su spec, no en `main`** — lo exige el gate
`require-spec`. Para configurar Neon y Blob en una máquina limpia, sigue
`docs/runbook-configuracion.md`.

Node 22 o superior. Stack y plataforma en `docs/adr/ADR-001-stack.md` y
`ADR-004-plataforma.md`.
