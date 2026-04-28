# 📓 Bitácora de Desarrollo — Campus360

> Registra aquí cada sesión de trabajo. Un registro por día.

---

## Template de Registro

```
## [FECHA] — DD/MM/AAAA

### ✅ Qué hice
-

### 🔧 Problemas encontrados
-

### 💡 Solución / Decisión tomada
-

### ⏭️ Próximo paso
-
```

---

## Registros

---

## [INICIO] — 27/04/2026

### ✅ Qué hice
- Análisis técnico completo del proyecto
- Detección de problemas críticos de seguridad y arquitectura
- Generación de documentación base en `docs/`

### 🔧 Problemas encontrados
- Contraseñas en texto plano en modelo `Usuario`
- `LibroSerializer` referencia campo `imagen_url` inexistente (bug activo)
- Sin autenticación en ningún endpoint
- Flujo de compra al 0%

### 💡 Solución / Decisión tomada
- Documentar arquitectura objetivo para guiar el desarrollo
- Priorizar migración de `Usuario` a `AbstractUser` como primer paso bloqueante

### ⏭️ Próximo paso
- Iniciar Fase 1: migrar `Usuario` a `AbstractUser` + implementar JWT

---
