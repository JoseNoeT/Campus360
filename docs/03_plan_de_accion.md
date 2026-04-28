# ✅ Plan de Acción — Campus360

## FASE 1 — Fundamentos de Seguridad y Auth
> Objetivo: Sistema usable con usuarios reales

- [ ] Migrar `Usuario` a `AbstractUser` (herencia de Django auth)
- [ ] Eliminar campo `contrasena` — usar `set_password()` / `check_password()`
- [ ] Cambiar `correo` de `CharField` a `EmailField` con `unique=True`
- [ ] Instalar `djangorestframework-simplejwt`
- [ ] Crear endpoint `POST /api/auth/register/`
- [ ] Crear endpoint `POST /api/auth/login/` → devuelve JWT
- [ ] Crear endpoint `POST /api/auth/refresh/`
- [ ] Agregar `IsAuthenticated` a todos los ViewSets
- [ ] Mover `SECRET_KEY` y `DEBUG` a variables de entorno (python-decouple)
- [ ] Corregir `LibroSerializer`: `imagen_url` → `imagen`
- [ ] Corregir `precio` en `Libro` → `DecimalField`
- [ ] Agregar campo `stock = PositiveIntegerField` a `Libro`
- [ ] Agregar campo `estado` con choices a `Orden`

---

## FASE 2 — Carrito Funcional
> Objetivo: Usuario puede agregar libros y ver su carrito

- [ ] Endpoint `GET /api/cart/` — ver carrito del usuario autenticado
- [ ] Endpoint `POST /api/cart/items/` — agregar libro al carrito
- [ ] Endpoint `PATCH /api/cart/items/{id}/` — cambiar cantidad
- [ ] Endpoint `DELETE /api/cart/items/{id}/` — eliminar ítem
- [ ] Endpoint `DELETE /api/cart/clear/` — vaciar carrito
- [ ] Agregar `precio_snapshot` a `ItemCarrito`
- [ ] Agregar `unique_together = ('carrito', 'libro')` en `ItemCarrito`
- [ ] Validar `cantidad >= 1` en `ItemCarrito`
- [ ] Método `calcular_total()` en modelo `Carrito`
- [ ] Validar stock disponible al agregar al carrito

---

## FASE 3 — Órdenes y Pago
> Objetivo: Flujo de compra completo

- [ ] Endpoint `POST /api/orders/checkout/` — crear orden desde carrito
- [ ] Endpoint `GET /api/orders/` — historial de órdenes
- [ ] Endpoint `GET /api/orders/{id}/` — detalle de orden
- [ ] Lógica: validar stock antes de confirmar orden
- [ ] Lógica: descontar stock al confirmar pago
- [ ] Lógica: vaciar carrito al confirmar orden
- [ ] Integrar pasarela de pago (Stripe o WebPay Transbank)
- [ ] Lógica: generar `Boleta` automáticamente al pagar
- [ ] Relacionar `Orden` con `Boleta` (OneToOne)
- [ ] Endpoint `GET /api/billing/receipts/{id}/` — ver boleta

---

## FASE 4 — Arquitectura y Producción
> Objetivo: Código limpio, escalable y deployable

- [ ] Separar en apps: `users`, `catalog`, `cart`, `orders`, `billing`, `academic`
- [ ] Crear `services.py` por app (sacar lógica de views)
- [ ] Migrar de SQLite a PostgreSQL
- [ ] Crear `settings/base.py`, `settings/development.py`, `settings/production.py`
- [ ] Agregar paginación a todos los listados
- [ ] Instalar `drf-spectacular` — documentación Swagger automática
- [ ] Escribir tests unitarios por app (mínimo: auth, carrito, checkout)
- [ ] Crear modelos académicos: `Curso`, `Clase`, `Inscripcion`, `Progreso`, `Evaluacion`, `Nota`
- [ ] Configurar Docker + docker-compose
- [ ] Deploy inicial en Railway o Render
