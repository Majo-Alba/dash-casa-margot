# Casa Margot · primera conexión real de DASH

## Fuentes activas
- CLIENTES: ID_CLIENTE, NOMBRE_CLIENTE, FECHA_ALTA, ID_VENDEDOR.
- PRODUCTOS: ID_PRODUCTO, CATEGORIA, NOMBRE_PRODUCTO, PRECIO_LISTA.
- VENTAS: ID_VENTA, ID_CLIENTE, FECHA_VENTA, ESTADO_VENTA, ID_PRODUCTO, SUCURSAL, ID_VENDEDOR, CANTIDAD, MONTO_VENTA, ES_RECOMPRA.

## Fuentes visibles pero todavía sin información
- CONTACTOS_PROCESO.
- ESFUERZOS.
- Recomendación (falta ES_RECOMENDADO / registro de recomendaciones).
- Demográficos (edad, sexo y otros perfiles).

## Reglas derivadas
- Cliente Activo: última compra hace menos de 2 meses al cierre del periodo seleccionado.
- Cliente Dormido: última compra hace 2 a menos de 6 meses.
- Cliente Inactivo: última compra hace 6 meses o más.
- Producto Activo: al menos una venta en los 6 meses previos al cierre del periodo.
- Producto Inactivo: sin ventas en los 6 meses previos.

## Periodos soportados
- Mensual: Ene 2026, Feb 2026, etc.
- Bimestral: Ene-Feb 2026, Mar-Abr 2026, etc.
- Trimestral: Q1-Q4.
- Semestral: S1-S2.
- Anual.

## Importante
DASH no inventa datos faltantes. Los módulos sin información permanecen visibles con estado "Dato por activar" para mostrar al cliente qué análisis se desbloquearán cuando mejore su captura.
