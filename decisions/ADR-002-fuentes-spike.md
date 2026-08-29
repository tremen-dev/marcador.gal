# ADR-002 — Fuentes del spike

Estado: aceptada · Fecha: 2026-08-29

## Decisión
Tres fuentes: futgal.es (oficial para Preferente Futgal G1 y Tercera RFEF G1, ambas organizadas por la RFGF), ceroacero (contraste para ambas) y bot de Telegram (corresponsal). API-Football, BeSoccer API y X API quedan fuera.

## Motivo
futgal cubre las dos competiciones del spike como fuente oficial; un proveedor de pago solo aporta valor cuando entren Primera y Segunda. X API es cara para lo que da. Dos agregadores solo cuentan como independientes si no beben de la misma fuente: parte del spike es medir si ceroacero es fuente o espejo de futgal.

## Consecuencias
El backend de la app de la RFGF se explora solo para conocer datos y latencia; producción requiere acuerdo con la federación.
