# DASH - Refactor esfuerzo-resultado

## Nueva tesis del producto
DASH deja de ser un tablero centrado en dinero y se convierte en una capa de inteligencia que relaciona:

**Objetivo -> Producto/Promoción -> Esfuerzo -> Medio -> Periodo/Lugar -> Resultado verificable**

El tablero principal conserva una lectura ejecutiva fuerte y muestra de inmediato:
- Las cuatro palancas comerciales.
- Impacto antes, durante y después de esfuerzos.
- Conversión de contacto a recompra.
- Medios que atraen frente a medios que convierten.
- Esfuerzos con mayor respuesta observable.
- Preguntas para decisión y calidad de información.

DASH muestra coincidencias y comparaciones; no afirma causalidad ni calcula ROI, utilidad o rendimiento publicitario.

## Rutas del MVP
- `/dashboard`: tablero general de inteligencia.
- `/palancas`: resumen ejecutivo de las cuatro palancas.
- `/esfuerzos`: registro y cierre de esfuerzos.
- `/productos-promociones`: catálogos y resultados.
- `/medios`: medios de llegada.
- `/proceso`: contacto, prospecto, cita, cotización y cliente.
- `/comparador`: cruce por periodo y variables.
- `/eventos`: asistentes y resultados posteriores.
- `/ventas`: microscopio cuantitativo existente.
- `/calidad`: faltantes, desconocidos y actualización.
- `/notas`: preguntas, observaciones y aprendizajes.

## Próxima implementación de backend
El endpoint `/api/intelligence/overview` usa datos demostrativos para visualizar la nueva dirección. Debe sustituirse por un servicio que lea las hojas de la plantilla Excel y genere:
1. Ventanas antes/durante/después de cada esfuerzo.
2. Conteos y conversiones por etapas comerciales.
3. Resultados por esfuerzo, medio, producto, promoción, sucursal y vendedor.
4. Recompra y recomendación por cohortes sencillas.
5. Indicadores de completitud y datos desconocidos.

## Regla de relaciones
Nunca inferir una relación inexistente. Un resultado puede asociarse a un esfuerzo únicamente si existe `ID_ESFUERZO`, o mostrarse como "sin esfuerzo vinculado".
