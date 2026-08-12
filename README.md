# Campus360

Campus360 es una plataforma web académica desarrollada con Django que integra herramientas de apoyo al estudiante, búsqueda de material bibliográfico, catálogo de libros y cálculo académico en un mismo entorno.

## Descripción

El proyecto nació como una plataforma académica y posteriormente fue retomado y modernizado para mejorar su arquitectura, experiencia de usuario y presentación profesional.

Campus360 busca centralizar distintas necesidades habituales de un estudiante: consultar material de apoyo, explorar libros, gestionar información académica y calcular escenarios de notas.

## Funcionalidades principales

- Página principal con accesos directos a los módulos principales.
- Biblioteca360 para búsqueda y consulta de referencias académicas.
- Catálogo de libros conectado a base de datos.
- Búsqueda, filtros, ordenamiento y paginación de libros.
- Flujo de carrito y compra.
- Perfil académico del usuario.
- Calculadora de notas.
- Simulación de escenarios académicos.
- Autenticación de usuarios.
- Registro e inicio de sesión.
- Interfaz responsive.
- Soporte para modo claro y oscuro.
- Estados visuales y manejo de contenido sin resultados.
- Portadas alternativas para libros sin imagen disponible.

## Biblioteca360

Biblioteca360 permite realizar búsquedas de referencias y material académico.

El módulo contempla consultas a fuentes externas y mecanismos de respaldo local para mantener una experiencia útil cuando una fuente externa no entrega resultados.

## Calculadora académica

La calculadora permite ingresar evaluaciones, ponderaciones y notas para analizar el rendimiento académico.

Entre sus funciones se incluyen:

- cálculo de promedio;
- validación de ponderaciones;
- simulación de evaluaciones;
- estimación de resultados;
- apoyo para planificación académica.

## Catálogo

El catálogo permite explorar libros almacenados en la base de datos mediante:

- búsqueda;
- filtros;
- ordenamiento;
- paginación;
- visualización de información del libro;
- carrito de compra.

## Tecnologías

- Python
- Django
- Django REST Framework
- django-filter
- django-cors-headers
- HTML5
- CSS3
- Bootstrap
- JavaScript
- SQLite
- APIs REST

## Arquitectura

Campus360 utiliza una arquitectura basada en Django con separación entre:

- configuración del proyecto;
- vistas;
- modelos;
- plantillas;
- archivos estáticos;
- lógica JavaScript;
- servicios y endpoints REST;
- persistencia de datos.

El proyecto dispone además de documentación técnica interna sobre su evolución, problemas detectados, arquitectura objetivo y plan de mejora.

## Evolución del proyecto

Campus360 fue desarrollado inicialmente como proyecto académico entre aproximadamente 2023 y 2024.

Posteriormente fue retomado y modernizado para incorporarlo al portafolio profesional.

La modernización incluyó mejoras en:

- experiencia de usuario;
- interfaz;
- navegación;
- Biblioteca360;
- calculadora académica;
- página principal;
- footer responsive;
- manejo de imágenes;
- organización del repositorio;
- documentación;
- seguridad básica de configuración.

## Estado actual

Estado: **MVP funcional modernizado y preparado para portafolio.**

La versión actual fue validada mediante:

- `python manage.py check`;
- revisión de migraciones;
- ejecución local;
- revisión visual de las principales pantallas.

Actualmente Django no detecta errores de configuración ni migraciones pendientes.

El proyecto todavía no dispone de una suite de pruebas automatizadas propia.

## Evidencias visuales

Se dispone de capturas actualizadas de:

- Inicio;
- Biblioteca360;
- Catálogo de libros;
- Calculadora de notas;
- Inicio de sesión.

Estas evidencias se conservan como material del portafolio profesional.

## Ejecución local

Crear entorno virtual:

    python -m venv .venv

Activar en Windows:

    .venv\Scripts\activate

Instalar dependencias:

    pip install -r requirements.txt

Entrar al proyecto Django:

    cd Campus360

Aplicar migraciones:

    python manage.py migrate

Ejecutar:

    python manage.py runserver

Abrir en el navegador:

    http://127.0.0.1:8000/

## Repositorio

GitHub:

    https://github.com/JoseNoeT/Campus360

## Información para portafolio

**Nombre:** Campus360

**Tipo:** Plataforma web académica.

**Descripción corta:** Plataforma académica desarrollada con Django que integra biblioteca, catálogo de libros, perfil estudiantil y herramientas de cálculo de notas.

**Tecnologías principales:** Python, Django, Django REST Framework, JavaScript, HTML, CSS, Bootstrap y SQLite.

**Estado:** MVP funcional modernizado para portafolio.

**Origen:** Proyecto académico desarrollado inicialmente entre 2023 y 2024 y posteriormente actualizado para presentación profesional.

**Rol:** Desarrollo y evolución técnica del proyecto.

**Repositorio:** https://github.com/JoseNoeT/Campus360

## Documentación

El directorio `docs/` incluye documentación sobre:

- planificación general;
- estado del proyecto;
- problemas detectados;
- plan de acción;
- arquitectura objetivo;
- bitácora de evolución.

## Autor

José Miguel Noé Torres
