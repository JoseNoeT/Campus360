
# Campus360

## Descripción breve
Campus360 es una plataforma web profesional para gestión y venta de libros universitarios, con catálogo avanzado, carrito, perfil de usuario y administración.

## Funcionalidades principales
- Catálogo de libros con búsqueda, filtros, ordenamiento y paginación
- Carrito de compras y proceso de checkout
- Gestión de perfil de usuario
- Autenticación y registro
- API RESTful para frontend moderno
- Panel de administración Django

## Tecnologías usadas
- Python 3.12
- Django 6.x
- Django REST Framework
- django-filter
- django-cors-headers
- HTML5, CSS3, Bootstrap
- JavaScript (ES Modules)

## Cómo ejecutar el proyecto
1. Clona el repositorio y entra al directorio principal.
2. Crea y activa un entorno virtual:
	```
	python -m venv Entorno360
	# En Windows:
	Entorno360\Scripts\activate
	# En Linux/Mac:
	source Entorno360/bin/activate
	```
3. Instala dependencias:
	```
	pip install -r requirements.txt
	```
4. Aplica migraciones y carga datos de ejemplo:
	```
	python manage.py migrate
	python manage.py seed_libros
	```
5. Ejecuta el servidor:
	```
	python manage.py runserver
	```
6. Accede a http://127.0.0.1:8000/

## Estado del proyecto
- En producción interna. Código limpio, sin legacy ni dependencias innecesarias.
- Catálogo, carrito, perfil y APIs funcionales y probados.
- Listo para despliegue o ampliación.
