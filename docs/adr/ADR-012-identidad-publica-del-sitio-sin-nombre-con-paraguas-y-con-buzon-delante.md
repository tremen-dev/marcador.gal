---
id: ADR-012
tipo: adr
estado: aprobada
historial:
  - {estado: borrador, fecha: 2026-09-01, por: sdd-arquitecto}
  - {estado: aprobada, fecha: 2026-09-01, por: Alberto Fojo}
aprobada-por: Alberto Fojo
---
# ADR-012: Identidad pública del sitio: sin nombre, con paraguas y con buzón delante

- Deciders: propone `sdd-arquitecto` el 2026-09-01, a partir de una petición
  explícita de **Alberto Fojo** ese mismo día, aclarada por él en la misma
  jornada: *«no me preocupa la carta, me preocupa el texto de la web
  marcador.gal. La carta saldrá con mi nombre pero no quiero que la web lo
  publique»*. Aprueba **Alberto Fojo** en el gate. El matiz que hay que registrar
  en la aprobación no es *si* se quita el nombre —eso ya está pedido— sino **con
  qué se compensa**: con el **buzón**, punto 3.
- Specs relacionadas: **SPEC-007** (lo ejecuta). Modula cláusulas de **SPEC-004**
  (`hecho`, GREEN) y no toca SPEC-005 ni SPEC-006.

## Contexto

El sitio está **en producción** en `https://marcador.gal` desde el 2026-09-01, y
su única razón de existir es ser el **respaldo público y verificable** de la
carta a la RFGF (`docs/negocio/carta-rfgf-acceso.md`, que ya enlaza `/robot` y
`/proxecto`). Eso es lo que hace que esta decisión no sea de estilo: la página
existe para que un desconocido pueda comprobar que esto es serio.

Hoy `/proxecto` dice, en la sección «Quen está detrás»:

> «marcador.gal é un proxecto de tremen.dev, levado por **Alberto Fojo**. Non hai
> empresa nin equipo detrás: **unha soa persoa** traballando por conta propia. O
> enderezo de contacto é ola@tremen.dev.»

Y no lo dice por casualidad: **SPEC-004 CA-7 y CA-8.1 lo exigen**, con test
(`tests/site/i18n.test.ts`, caso 6). Es contenido verificado en GREEN.

**Alberto Fojo pidió el 2026-09-01 lo contrario**: *«No quiero que salga mi
nombre de momento en la web. Si enlazamos a tremen.dev, allí ya aparece mi nombre
en los textos legales; prefiero que marcador.gal quede bajo el paraguas de
tremen.dev sin especificar quién hay detrás (ni si soy uno o mil)».*

La petición es **una sola cosa** —el nombre no sale en `marcador.gal`— y el
proyecto no tiene ninguna regla que obligue a publicarlo. La frase sobre los
textos legales de tremen.dev venía como explicación al pasar, no como condición;
aun así se comprobó, porque una explicación que va a quedar escrita en un ADR se
comprueba antes de apoyar nada en ella.

### Comprobación del 2026-09-01: la explicación no describe el sitio de hoy

`sdd-arquitecto` comprobó `tremen.dev` el 2026-09-01, antes de escribir esta
decisión:

| Recurso | Resultado |
|---|---|
| `https://tremen.dev/` | `200`. No contiene `Alberto`, `Fojo`, `NIF`, `CIF`, «aviso legal», «titular» ni «responsable» |
| `https://tremen.dev/contact.html` | `200`. Formulario y `mailto:hola@tremen.dev`. Ningún nombre, ninguna identificación |
| `https://tremen.dev/work.html` | `200`. Ídem |
| `/legal`, `/legal.html`, `/aviso-legal.html`, `/privacy.html`, `/privacidad.html`, `/terms.html` | **`404` las seis** |

Las únicas coincidencias de `nif`/`cif` en el HTML eran subcadenas de
«ma**nif**iesto» y «espe**cif**ic». **Hoy `tremen.dev` no publica textos legales y
no nombra a nadie.**

**Qué se hace con este hecho, y qué no.** No se hace de él una condición: exigir
que `tremen.dev` identifique a un responsable ataría este cambio a escribir y
publicar un aviso legal —trabajo que nadie ha pedido— y bloquearía lo que sí se
ha pedido. Se hace lo contrario: **la decisión deja de apoyarse en esa premisa**.
El enlace a `tremen.dev` se queda porque un paraguas que se nombra y no se enlaza
es media frase, y basta con que **resuelva**. Y lo que compensa la retirada del
nombre pasa a ser lo que siempre estuvo ahí y sí es del proyecto: **el buzón**.

**Y no hay ninguna restricción de orden.** La carta a la RFGF sale firmada por
Alberto Fojo con nombre y `ola@tremen.dev`: quien la recibe sabe exactamente
quién escribe, por la carta misma. Ni el cambio espera a la carta ni la carta
espera al cambio.

## Decisión

**1. El sitio público de marcador.gal no nombra a ninguna persona física, y
tampoco declara cuántas personas hay detrás ni bajo qué forma jurídica.** La
identidad pública del proyecto es **tremen.dev**. Alcanza a *todo* el sitio
—`/proxecto`, `/robot`, sus gemelas `/es`, y todo lo que se publique después,
incluida la landing de `marca.md` y el bot—, no solo a la sección que hoy lo
incumple. La cláusula de «ni uno ni mil» es parte de la decisión: frases como
«unha soa persoa» o «non hai empresa nin equipo detrás» quedan igual de fuera que
el nombre, porque describen exactamente lo que se ha pedido no especificar.

**2. El proyecto se acoge a `tremen.dev`, y el acogimiento se enlaza.**
`/proxecto` nombra `tremen.dev` en prosa y lo enlaza con un `<a href>` de verdad,
dentro de la sección «quen está detrás». Un paraguas que se nombra y no se enlaza
es media frase: el lector no puede ni mirar qué es. Lo que se le exige a esa URL
es **que resuelva**, y nada más. **No se le exige que identifique a nadie**: eso
convertiría una decisión sobre el texto de esta web en una dependencia de que
alguien escriba un aviso legal en otra, y ni se ha pedido ni hace falta.

**3. El acoplamiento que de verdad no se puede romper es otro: sin nombre, el
buzón va delante.** No es «anonimato ⇄ tremen.dev identifica»; es **«anonimato ⇄
buzón delante»**. `ola@tremen.dev` sigue en `/proxecto` y en el **primer bloque**
de `/robot` (SPEC-005 CA-5). Con el nombre fuera, es **lo único** que le da a un
operador dónde quejarse, que es exactamente lo que pide **RN-11** —dónde
quejarse, no dónde navegar— y es la compensación del riesgo que el gate aceptó en
**ADR-011** al sacar el `mailto:` de la cabecera del user-agent. La regla que se
deriva, y que es la razón de que esto sea un ADR y no una línea de una spec que se
cerrará: **quitar el nombre está bien mientras haya una vía de contacto que se
lee; quitar el nombre *y* el buzón dejaría la página sin responsable y sin
destinatario, y eso no lo autoriza esta decisión.** No son dos cambios
independientes que puedan tomarse por separado dentro de seis meses: son las dos
mitades de una sola decisión. **RN-11 se sigue cumpliendo sin nombre porque el
buzón sigue delante.**

**4. Lo que no cambia, y conviene dejarlo escrito para que nadie lo lea como
incoherencia.** **La carta a la RFGF se sigue firmando con nombre y correo**:
quien la recibe sabe perfectamente quién escribe. Anonimizar la web no anonimiza
al remitente; son dos canales distintos con dos destinatarios distintos —uno es
público e indiscriminado, el otro es una persona concreta a la que se pide algo—.
No hay contradicción, y esta es la línea a la que remitir el día que alguien crea
que la hay. Tampoco hay orden entre las dos cosas: la carta puede salir antes,
después o a la vez.

## Consecuencias

### Positivas

- **La petición de Alberto se cumple entera y sin bloquearse en nada**: no espera
  a la carta, no espera a un aviso legal y no espera a otro sitio. Todo lo que
  hace falta está dentro de este repositorio.
- **La página no se queda sin responsable ni sin destinatario**: dice bajo qué
  paraguas está, lo enlaza, y mantiene el buzón delante. Lo que un técnico de la
  federación necesita para escribir y para que le contesten sigue en su sitio.
- **La regla vale para todo lo que venga después.** La landing, el bot y el
  producto heredan el criterio sin volver a discutirlo, que es justamente lo que
  una spec cerrada no puede garantizar.
- **El acoplamiento queda escrito, y es el correcto.** Que el buzón sea la
  condición del anonimato es el tipo de razón que se pierde en seis meses y que,
  al perderse, hace que alguien mueva el buzón «a la página de contacto» sin
  saber que había un ADR apoyado en que estuviera delante.

### Negativas / follow-ups

- **El paraguas es hoy poco más que un nombre de dominio.** `tremen.dev` no
  identifica a nadie (comprobación de arriba), así que quien siga el enlace no va
  a saber quién hay detrás: va a ver otro proyecto del mismo autor. Es una pérdida
  real frente al estado anterior y se asume **a sabiendas**, porque el requisito
  es del dueño y porque la vía de contacto sigue abierta. **Riesgo escrito con
  disparador, no precondición** — *el día que se quiera que el nombre sea
  recuperable a un clic, o el día que `/sdd-legal-datos` lo pida, la
  identificación se publica en `tremen.dev` y `marcador.gal` no cambia una sola
  línea, porque el enlace ya está puesto*. Destino: **EPIC-MEJORA**.
- **Se introduce una dependencia de un sitio que este repositorio no controla**,
  aunque mínima: si `tremen.dev` deja de responder, el paraguas queda en un enlace
  roto y **ningún test de aquí se enterará** —misma forma de fallo que la
  retención publicada en `/robot` y que «non republicamos os datos de ninguén»
  (riesgos de EPIC-003)—. Disparador compartido con el anterior: cualquier trabajo
  sobre el sitio, y el re-dictamen entero de `/robot` previo a producción, miran
  también este enlace.
- **Queda una pregunta legal abierta que no resuelve este ADR**, y va **acotada**:
  si un sitio público **sin recogida de datos, sin cookies y sin actividad
  económica** —lo que SPEC-004 CA-6, CA-9 y CA-10 dejan comprobado con test—
  necesita identificar a su titular, y si **el buzón basta** como vía de contacto.
  Se delega en `/sdd-legal-datos` como dictamen **bloqueante** de SPEC-007. No se
  le pregunta por `tremen.dev`, que es otro sitio. Si el dictamen exige
  identificación en el propio sitio, esta decisión vuelve al arquitecto: no se
  parchea a mano.
- **Se pierde una frase que daba confianza barata.** «Unha soa persoa traballando
  por conta propia» era honesta y desarmaba al lector. Alberto la retira a
  sabiendas; queda anotado que la pérdida es deliberada y no un descuido de
  redacción.

## Alternativas consideradas

- **Dejar el nombre como está (statu quo, SPEC-004 CA-8.1).** Rechazada: es una
  petición explícita del dueño del proyecto sobre su propio nombre, y no hay
  ninguna regla del proyecto que obligue a publicarlo. La verificabilidad que
  EPIC-003 exige es sobre *cómo rastreamos*, no sobre el DNI de quien rastrea.
- **Quitar el nombre y no enlazar nada.** Rechazada, y es la alternativa
  peligrosa porque es la más fácil de implementar: deja al lector sin nada que
  mirar. Es el motivo de que el enlace sea CA y no recomendación.
- **Condicionar el cambio a que `tremen.dev` publique una identificación**, y no
  desplegarlo hasta entonces. **Rechazada, y fue el primer borrador de este ADR.**
  Convierte una petición de una línea sobre el texto de esta web en una
  dependencia de escribir y publicar un aviso legal en otra, que es trabajo que
  nadie ha pedido, y bloquea lo que sí se ha pedido a cambio de una garantía que
  el proyecto no necesita: la identidad frente al único destinatario que importa
  hoy —la RFGF— la da la firma de la carta, no la web. Queda como el riesgo con
  disparador de la sección anterior.
- **Sustituir el nombre por una descripción sin nombre («unha persoa por conta
  propia»).** Rechazada por la propia petición: *«ni si soy uno o mil»*. Además
  no compra nada: sigue sin poder comprobarse y sigue sin llevar a ningún sitio.
- **Enlazar solo el `mailto:` y suprimir toda referencia a tremen.dev.**
  Rechazada: un buzón dice a quién escribir, no quién es. Y `tremen.dev` ya
  aparece dentro de la dirección de correo, así que negarlo en la prosa sería a
  la vez menos informativo y transparente para cualquiera que lea el `mailto:`.
- **Publicar la identificación legal en `marcador.gal` en vez de en tremen.dev.**
  Rechazada por la petición, pero merece quedar escrita porque es la salida si
  `/sdd-legal-datos` dictamina que hace falta: en ese caso el sitio tendría su
  propio aviso legal y esta decisión se supersede con otro ADR, no se corrige.
