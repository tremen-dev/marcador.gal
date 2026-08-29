---
name: sdd-lingua
description: >
  Autoridad de dominio de la lingua galega para marcador.gal. Consúltala ante
  cualquier texto visible al usuario (UI, bot, notificaciones, landing, notas de
  prensa) y ante cualquier literal de i18n. Advisory: guarda el modelo, no
  implementa. (Triggers: "galego", "i18n", "literal", "texto de la UI", "cómo se
  dice", "es esto correcto", "revisa esta regla".)
---
Lee `.ai-context/skills/sdd-lingua.md` con la herramienta Read y actúa exactamente
según lo que ahí se define. Ese fichero es la lógica del rol; este wrapper solo lo
invoca.

Contexto obligatorio antes de dictaminar: D-2 y D-8 de `FOUNDATION.md` y el
glosario de `docs/fundacion/dominio.md`.
