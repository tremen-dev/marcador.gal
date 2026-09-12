---
tipo: legal
asunto: Consentimiento expreso de la CRTVG para captar, archivar y tratar la emisión de Radio Galega
fecha-registro: 2026-09-12
declarado-por: Alberto Fojo
estado: alcance declarado; copia del documento PENDIENTE de adjuntar
---
# Consentimiento de la CRTVG — Radio Galega como fuente (EPIC-005)

> Este registro existe porque `docs/fundacion/reglas.md` y el rol
> `sdd-legal-datos` exigen que toda autorización de un titular esté **escrita,
> fechada y localizable** antes de que una spec se apoye en ella (mismo patrón
> que ADR-023 §6.4 con el DPA del proveedor de LLM). Lo que hay hoy es el
> **alcance declarado por Alberto Fojo el 2026-09-12** en la conversación que
> hizo nacer EPIC-005. **La copia del documento original no está aquí todavía**:
> hasta que se adjunte, esta página es una declaración, no una prueba, y así lo
> debe tratar quien la cite.

## Qué autoriza, según lo declarado

| Ámbito | Cubierto | Consecuencia en el diseño |
|---|---|---|
| **Grabar y archivar el audio** de la emisión | **Sí** | RN-10 se cumple archivando cada segmento tal como lo sirve el CDN, antes de tocarlo. No hace falta la variante «archivar solo la transcripción» prevista en la épica |
| **Transcribir** | Sí | — |
| **Tratamiento automático**, incluido enviar audio y texto a proveedores terceros de ASR y LLM | **Sí** | Cada proveedor sigue necesitando su propio DPA en `docs/legal/` (ADR-023 §3 ter): el consentimiento del titular de la emisión no sustituye el contrato con el encargado del tratamiento |
| **Uso comercial** | **Sí** | La fuente no queda limitada a la fase de medición. Lo que sí la limita hoy es ADR-019 §3: solo se escucha dentro de jornadas declaradas, por diseño del sistema y no por el consentimiento |
| **Atribución** («Fonte: Radio Galega» o similar) | **No se exige de momento** | Ningún texto de interfaz, bot ni snapshot tiene que nombrar a la CRTVG. Ver disparador abajo |

## Qué no cubre o no se ha dicho

- **Alcance de programas y horas.** No se ha declarado si el consentimiento
  nombra un programa (*Galicia en goles*) o la emisión entera. Mientras no se
  lea el documento, el oyente se limita a **partidos en ventana de jornadas
  declaradas**, que es más estrecho que cualquiera de las dos lecturas.
- **Vigencia y revocación.** No declaradas. Se leen del documento cuando se
  adjunte.
- **URL del stream.** No forma parte del consentimiento; se pide a la CRTVG en
  vez de usar la pública de listados de terceros.

## Disparadores escritos

1. **Adjuntar la copia.** Cuando el documento esté en esta carpeta, se actualiza
   el frontmatter (`estado: documento adjunto`) y se comprueban las dos filas
   «no se ha dicho» de arriba. **Ninguna spec de código de EPIC-005 pasa a
   `en-progreso` antes de eso.**
2. **Renegociación de la atribución.** Alberto Fojo anota que la atribución
   «quizás se tiene que renegociar». Si la CRTVG la pide, es un literal nuevo en
   los bundles de i18n (D-2, galego y castellano con paridad) y una entrada en el
   inventario de EPIC-004 para la interfaz definitiva; no toca el motor ni el
   registro de fuentes.
3. **Cambio de alcance.** Si el documento dice menos de lo declarado aquí, se
   escribe un ADR que supersede parcialmente al ADR de la fuente y se ajusta
   RN-10 antes de la siguiente jornada declarada.

## Contexto legal de referencia (consultado el 2026-09-12)

El aviso legal de la CRTVG (`https://www.crtvg.es/aviso-legal`) declara suyos
los contenidos, incluidos «clips de audio», prohíbe «a reprodución ... nin o
seu tratamento informático ... sen o permiso previo» y limita el uso a «persoal
e privado, quedando prohibido o seu uso con fins comerciais». Sin este
consentimiento la fuente estaría bloqueada exactamente como `futgal.es` lo está
por su `robots.txt` (ADR-008 §1). El consentimiento es lo que la desbloquea, y
por eso su copia tiene que vivir aquí.
