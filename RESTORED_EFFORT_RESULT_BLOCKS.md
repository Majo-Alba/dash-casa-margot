# DASH Casa Margot — restauración de análisis esfuerzo-resultado

Cambios de esta iteración:

- Se conservan todos los módulos de la versión Casa Margot.
- Se restauran en Tablero General:
  - Impacto de esfuerzos (Antes / Durante / Después).
  - Medios que atraen y convierten (Contactos vs Clientes convertidos).
  - Esfuerzos con mayor respuesta (Contactos, Clientes, Ventas).
- Los tres módulos permanecen visibles aunque Casa Margot aún no tenga CONTACTOS_PROCESO o ESFUERZOS.
  En ese caso muestran un estado 'Dato por activar', sin inventar ceros.
- intelligenceService.js ahora prepara estos análisis automáticamente cuando existan datos.
- Se amplió la normalización de VENTAS y CLIENTES para conservar ID_ESFUERZO y MEDIO_ORIGEN.
- El selector de periodo se rediseñó como popover premium manteniendo Mensual, Bimestral,
  Trimestral, Semestral y Anual.
- Node validó intelligenceService.js y @babel/parser validó la sintaxis JSX de dashboardScreen.jsx.
