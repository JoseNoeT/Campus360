# 🏗️ Arquitectura Objetivo — Campus360

## Estructura de Apps Propuesta

```
Campus360/
├── config/                  ← Configuración del proyecto
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   └── urls.py
│
├── apps/
│   ├── users/               ← Usuarios, auth, perfiles, roles
│   ├── catalog/             ← Libros, categorías, búsqueda
│   ├── cart/                ← Carrito e ítems del carrito
│   ├── orders/              ← Órdenes, checkout, pagos
│   ├── billing/             ← Boletas y facturación
│   └── academic/            ← Cursos, clases, inscripciones, notas
│
└── common/                  ← Permisos, paginación, utils compartidos
```

---

## Responsabilidad por App

| App | Modelos | Responsabilidad |
|-----|---------|-----------------|
| `users` | `Usuario` (AbstractUser), `Perfil` | Auth, JWT, roles |
| `catalog` | `Libro`, `Categoria` | CRUD libros, búsqueda, filtros |
| `cart` | `Carrito`, `ItemCarrito` | Agregar/quitar libros, calcular total |
| `orders` | `Orden`, `DetalleOrden` | Checkout, estados, historial |
| `billing` | `Boleta`, `DetalleBoleta` | Generación de boleta, descarga PDF |
| `academic` | `Curso`, `Clase`, `Inscripcion`, `Progreso`, `Evaluacion`, `Nota` | Campus educativo |

---

## Capas por App

```
apps/{nombre}/
├── models.py       ← Entidades y reglas de datos
├── services.py     ← Lógica de negocio (casos de uso)
├── views.py        ← Solo orquesta: llama services, devuelve respuesta
├── serializers.py  ← Validación de entrada/salida
├── urls.py         ← Rutas de la app
├── permissions.py  ← Permisos específicos del dominio
└── tests/
    ├── test_models.py
    ├── test_services.py
    └── test_views.py
```

---

## Roles de Usuario

| Rol | Permisos |
|-----|----------|
| `ADMIN` | Acceso total |
| `DOCENTE` | Gestionar cursos y evaluaciones |
| `ALUMNO` | Comprar libros, ver cursos, ver notas |
