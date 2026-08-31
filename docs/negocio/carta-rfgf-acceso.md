# Carta a la RFGF — petición de acceso técnico

> Borrador para que lo mande **Alberto Fojo**. No es la conversación del acuerdo
> de datos (`retos.md`, «objetivo estratégico»): es un ask mucho más pequeño y
> por eso puede ir antes de tener cifras.
>
> **Contexto de por qué existe:** `futgal.es` termina su `robots.txt` en
> `User-agent: *` / `Disallow: /`, RN-11 obliga a respetarlo y ADR-008 §1 saca la
> fuente oficial del conjunto capturable. Con besoccer descartada por servir
> armazones vacíos (`hallazgos/fontes-capturables.md`), queda **una sola fuente
> automática**, y sin dos no hay forma automática de publicar *confirmado*.
>
> **El argumento fuerte, y conviene no perderlo:** su `robots.txt` permite a
> `Twitterbot`, `Mediapartners-Google` y `AmazonAdBot`, y **Googlebot no está en
> la lista**, así que cae en el comodín y queda bloqueado. Le están diciendo a
> Google que no los indexe mientras dejan entrar a los rastreadores de
> publicidad. Comprobado el 2026-08-31: buscando «Preferente Futgal grupo 1
> resultados» salen ocho agregadores y **ningún enlace a futgal.es**. No pedimos
> un favor: avisamos de algo que les cuesta visibilidad.
>
> **Dos cosas que NO hay que hacer en este correo:** prometer un producto que aún
> no existe, y pedir el acuerdo de datos. Esto es solo permiso técnico.

---

**Asunto:** robots.txt de futgal.es — les está bloqueando también en Google

Bos días:

Escríbolles desde un proxecto persoal, aínda sen publicar, que está a medir se é
viable amosar os resultados do fútbol galego en directo nunha soa pantalla.

Antes de nada, algo que quizais lles interese máis ca a min. O ficheiro
`robots.txt` de futgal.es remata así:

```
User-agent: *
Disallow: /
```

Permite explicitamente a `Twitterbot`, a `Mediapartners-Google` (o rastrexador de
publicidade) e a `AmazonAdBot`. **`Googlebot` non está na lista**, así que cae no
comodín e queda bloqueado: o ficheiro está a dicirlle ao buscador de Google que
non indexe a web. Buscando hoxe «Preferente Futgal grupo 1 resultados» aparecen
oito agregadores privados e ningunha ligazón a futgal.es. Se é intencionado,
perfecto e desculpen a intromisión; se non, é un cambio dunha liña.

**A miña petición é pequena e concreta.** Para poder medir latencia e cobertura
necesito ler as páxinas públicas de Terceira RFEF G1 e Preferente Futgal G1 a
**unha petición por minuto e competición**, cun user-agent identificado. Hoxe non
o fago, precisamente porque o seu `robots.txt` non mo permite e respectalo é
unha norma do proxecto.

Abondaríame con que engadisen dúas liñas:

```
User-agent: marcador.gal
Allow: /
```

Queda público e auditable, e poden revertelo cando queiran.

**O que fago e o que non.** Non republico os seus datos: isto é medición, e o
resultado é un informe interno. Non uso a app nin ningunha API interna, só as
páxinas públicas. Identifícome en cada petición con `marcador.gal/0.0.1
(+mailto:ola@tremen.dev; medicion RN-11)` e respondo nese enderezo. E se prefiren
que non o faga, dígano e non o fago: é máis doado preguntar antes.

Se máis adiante ten sentido falar de algo maior —un feed, un acordo de datos,
levar o resultado oficial a máis xente— encantaríame, pero non é o que veño pedir
hoxe.

Grazas polo tempo.

Alberto Fojo
ola@tremen.dev

---

## Notas para quien lo manda

- **Va en galego a propósito.** Es la lengua de la federación y del proyecto
  (D-2). Si prefieres castellano, se traduce sin perder nada.
- **El contacto `ola@tremen.dev` tiene que seguir leyéndose.** Es el mismo que
  viaja en la User-Agent y lo confirmaste el 2026-08-31; si deja de leerse, RN-11
  vuelve a estar incumplida y ningún test lo detectará.
- **Si dicen que sí por robots.txt**, no hay nada que cambiar en el código:
  `robotsRegistry` resuelve por origen y lo recogería solo. ADR-008 §1 ya
  contempla ese levantamiento como una de las dos únicas vías, así que tampoco
  hace falta un ADR nuevo — basta anotarlo en el ledger.
- **Si dicen que sí por escrito pero sin tocar el robots.txt**, la autorización
  desplaza al `robots.txt` entre las partes, pero **el código seguirá omitiendo
  futgal**: habría que cargar una política que nos permita, y eso sí merece
  quedar registrado para que nadie crea que nos saltamos el fichero.
- **Si no contestan**, no hay plan B dentro del código: el bloqueo solo se
  levanta con una de esas dos cosas.
