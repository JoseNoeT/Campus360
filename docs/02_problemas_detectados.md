# 🚨 Problemas Detectados — Campus360

## Seguridad (CRÍTICO)
- Contraseñas guardadas en texto plano (`CharField`)
- Todos los endpoints API son públicos (sin autenticación)
- `DEBUG = True` hardcodeado en settings
- `SECRET_KEY` expuesta en settings.py
- Sin validación de email (usa `CharField`, no `EmailField`)

## Modelos
- `Usuario` no hereda de `AbstractUser` — incompatible con Django auth
- `id_usuario` es `CharField` manual en vez de AutoField/UUID
- `precio` en `Libro` es `IntegerField` — debe ser `DecimalField`
- `monto` en `Boleta` es `IntegerField` — debe ser `DecimalField`
- `Libro` no tiene campo `stock`
- `Orden` no tiene campo `estado` (pendiente/pagado/cancelado)
- `ItemCarrito` no guarda `precio_snapshot` del momento de compra
- `ItemCarrito.cantidad` no valida mínimo (puede ser negativo)
- `Boleta` y `Orden` no tienen relación entre sí
- `max_length=50` en títulos/autores es insuficiente

## Serializers
- `LibroSerializer` referencia campo `imagen_url` que no existe en el modelo (se llama `imagen`) → **error en runtime**
- `UsuarioSerializer` expone la contraseña en la API

## Views / API
- `lista_libros` crea libros sin validación ni serializer
- ViewSets exponen los 5 métodos CRUD sin restricción de rol
- Vistas HTML no tienen lógica (login, registro, perfil son páginas vacías)
- `vista_venta_libro` duplica la lógica de `venta_libro`

## Arquitectura
- Una sola app para 4+ dominios distintos
- Sin capa de servicios (`services.py`)
- Sin tests
- Sin paginación en listados
- SQLite como base de datos (no apto para producción)
- Sin separación de settings por entorno (dev/prod)
