
# Campus360

Campus360 is a Django web platform focused on academic support and book commerce for students.

## Main modules
- Home dashboard with featured content
- Biblioteca360 for academic reference search (external source with local fallback)
- Catalog with search, filters, ordering, pagination, and cart flow
- Academic profile dashboard
- Grade calculator (student tools)
- Authentication (login, register, session)

## Tech stack
- Python 3.12+
- Django 6.x
- Django REST Framework
- django-filter
- django-cors-headers
- HTML, CSS, Bootstrap
- JavaScript (ES modules)

## Run locally
1. Clone this repository.
2. Create and activate a virtual environment.

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux / macOS
source .venv/bin/activate
```

3. Install dependencies.

```bash
pip install -r requirements.txt
```

4. Move into the Django project folder.

```bash
cd Campus360
```

5. Apply migrations and optional seed data.

```bash
python manage.py migrate
python manage.py seed_libros
python manage.py seed_peliculas
```

6. Run the development server.

```bash
python manage.py runserver
```

7. Open http://127.0.0.1:8000/

## Notes
- `.gitignore` already excludes virtual environments, local DB files, IDE folders, and temporary files.
- For production, configure secrets and environment variables outside the repository.
