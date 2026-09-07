## 1. Cliente Lista

- [x] 1.1 En `turnos-listado.tsx`, hacer que `getPreviousPageParam` siempre devuelva `undefined` y dejar de usar `fetchPreviousPage` / `hasPreviousPage` / `isFetchingPreviousPage` en el scroll y en el `useEffect` de lista vacía
- [x] 1.2 Quitar el snapshot de scroll y el `useLayoutEffect` que compensan el prepend de páginas anteriores, si ya no hay carga hacia atrás
- [x] 1.3 Conservar el mensaje vacío actual (`No hay turnos para mostrar con los filtros actuales.`) y el scroll infinito hacia adelante (`fetchNextPage`)

## 2. Tests

- [x] 2.1 Extender `turnos-listado.test.tsx`: con `cursorAnterior` presente, scrollear al tope o renderizar primera página vacía MUST no llamar a `fetchTurnos` con `direccion: 'anterior'`
- [x] 2.2 Cubrir que la primera carga sigue yendo sin cursor (ancla hoy) y que un `cursorSiguiente` sigue disparando la página siguiente al scrollear al fondo
