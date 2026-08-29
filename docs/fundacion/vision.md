# Visión — marcador.gal

> Migrado de `docs/01-vision.md` (2026-08-29) sin cambios de contenido.

## En una frase
**Todo o fútbol galego nunha pantalla**: resultados en directo de las categorías
galegas y de las divisiones nacionales, en galego, sin ruido.

## El problema

marcadorgalego.gal fue durante años el tablero online del fútbol galego
(Primeira, Primeira/Segunda/Terceira RFEF grupo 1, Primeira galega femenina).
Cerró, y nadie ocupó el hueco.

Flashscore y BeSoccer cubren bien Primera y Segunda. **Nadie cubre bien Preferente
y Primeira Galega en directo.** Un sábado por la tarde, el aficionado del fútbol
modesto no tiene dónde mirar cómo va el partido de su comarca y el de Primera a la
vez, en el móvil, en galego.

Este proyecto retoma la idea con nombre, imagen y tecnología propios. Es
inspiración, no sucesión: no se usa la marca anterior ni se presenta como
continuación (D-1).

## Para quién

- El aficionado del fútbol modesto que quiere saber cómo van los partidos de su
  comarca y de Primera a la vez, en el móvil, un sábado por la tarde.
- Familias del fútbol base y del femenino.
- Periodistas y radios comarcales que necesitan Preferente cada fin de semana.
- Clubes, para enlazar su resultado.

## La promesa

Qué será verdad cuando esto funcione:

1. **Una pantalla.** Densidad, no tarjetas.
2. **Las ligas galegas al mismo nivel que Primera.** El nicho, no el todo:
   "o marcador do fútbol galego". Ese hueco es el foso.
3. **En directo o casi.** Provisional a tiempo antes que confirmado tarde.
4. **En galego**, con castellano opcional.

Las métricas norte del spike (EPIC-001) son la primera prueba de que la promesa
es alcanzable: latencia < 120 s en directo, cobertura > 90 %, operación manual
< 30 min por jornada.

## Principios

- Fútbol en galego, urbano o no. Nada de tópicos rurales en imagen ni tono.
  La Preferente se juega en Vigo, A Coruña, Ourense y Ferrol igual que en
  cualquier vila.
- Fiabilidad trazable: cada marcador publicado sabe de dónde viene.
- Móvil primero, con mala cobertura.
- Sostenible: el proyecto debe pagarse (ver `docs/negocio/monetizacion.md`).

## Qué NO es este producto

No un medio. No una red social. No un Flashscore galego. No una app de apuestas.

## Autor
Proyecto de tremen.dev.
