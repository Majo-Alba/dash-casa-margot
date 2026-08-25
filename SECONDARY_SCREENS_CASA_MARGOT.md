# Casa Margot · Secondary screens update

This iteration moves Ventas, Clientes and Canales into the primary DASH navigation and connects Productos y Promociones, Clientes and Ventas to the Casa Margot intelligence service.

## New endpoints
- GET /api/intelligence/products?type=month&index=8&year=2026
- GET /api/intelligence/clients?type=month&index=8&year=2026
- GET /api/intelligence/sales?type=month&index=8&year=2026

All accept the same period model as Tablero General: month, bimonth, quarter, semester and year.

## Derived rules
- Client Active: purchase within 60 days of selected period end.
- Client Dormido: 61–182 days without purchase.
- Client Inactivo: 183+ days without purchase.
- Product Active: sold within 182 days of selected period end.
- Product Inactive: no sale within 183+ days / no prior sale.

## Missing-data behavior
Promotions, reliable channel attribution, demographics, effort correlations and goals remain visible as locked/activation modules when the source sheets do not contain the required data. No synthetic values are invented.
