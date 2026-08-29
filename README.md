# Marcador (nombre pendiente)

Todo o fútbol galego nunha pantalla.

Proyecto para retomar la idea de marcadorgalego.gal con nombre, imagen y tecnología propios: resultados del fútbol galego (Preferente, Primeira e Segunda Galega, femenino) y de las divisiones nacionales, en directo, en una sola pantalla y en galego.

## Estado
Spike de ingesta (semana 1). Ver `docs/05-spike-ingesta.md` y `CLAUDE.md`.

## Documentos
| Fichero | Contenido |
|---|---|
| `docs/01-vision.md` | Qué es, para quién, posicionamiento, principios |
| `docs/02-analisis-retos.md` | Retos legal, datos, técnico, diseño, operativo |
| `docs/03-monetizacion.md` | Patrocinio, ayudas públicas, socios, datos B2B |
| `docs/04-marca.md` | Nombre, identidad visual, landing (pendiente) |
| `docs/05-spike-ingesta.md` | Propuesta técnica del spike |
| `specs/` | Especificaciones (SDD) |
| `decisions/` | ADRs |

## Arranque
```bash
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
```
