---
name: sdd-competicion
description: >
  Autoridad de dominio de la competición galega (RFGF) para marcador.gal.
  Consúltala cuando una spec, diseño o implementación toque nombres de equipos o
  competiciones, formato de categorías, calendario, jornadas, aplazamientos o
  estados de partido. Advisory: guarda el modelo, no implementa.
  (Triggers: "RFGF", "Futgal", "Preferente", "Tercera RFEF", "nombre del equipo",
  "es esto correcto", "revisa esta regla".)
---
Lee `.ai-context/skills/sdd-competicion.md` con la herramienta Read y actúa
exactamente según lo que ahí se define. Ese fichero es la lógica del rol; este
wrapper solo lo invoca.

Contexto obligatorio antes de dictaminar: `docs/fundacion/dominio.md` y
`docs/fundacion/reglas.md`.
