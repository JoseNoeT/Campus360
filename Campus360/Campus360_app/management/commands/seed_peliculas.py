from django.core.management.base import BaseCommand, CommandError

from Campus360_app.models import Libro


MAX_PELICULAS_PERMITIDAS = 300

PELICULAS_POR_CATEGORIA = {
    "Accion": [
        ("John Wick", "Chad Stahelski", 2014),
        ("Mad Max Fury Road", "George Miller", 2015),
        ("Mision Imposible", "Brian De Palma", 1996),
        ("Top Gun Maverick", "Joseph Kosinski", 2022),
        ("Gladiador", "Ridley Scott", 2000),
    ],
    "Ciencia ficcion": [
        ("Interstellar", "Christopher Nolan", 2014),
        ("Blade Runner 2049", "Denis Villeneuve", 2017),
        ("Arrival", "Denis Villeneuve", 2016),
        ("The Matrix", "Lana Wachowski", 1999),
        ("Dune", "Denis Villeneuve", 2021),
    ],
    "Drama": [
        ("Forrest Gump", "Robert Zemeckis", 1994),
        ("Whiplash", "Damien Chazelle", 2014),
        ("Green Book", "Peter Farrelly", 2018),
        ("The Pursuit of Happyness", "Gabriele Muccino", 2006),
        ("The Social Network", "David Fincher", 2010),
    ],
    "Comedia": [
        ("The Grand Budapest Hotel", "Wes Anderson", 2014),
        ("Superbad", "Greg Mottola", 2007),
        ("The Hangover", "Todd Phillips", 2009),
        ("Groundhog Day", "Harold Ramis", 1993),
        ("The Intern", "Nancy Meyers", 2015),
    ],
    "Terror": [
        ("The Conjuring", "James Wan", 2013),
        ("Hereditary", "Ari Aster", 2018),
        ("It", "Andy Muschietti", 2017),
        ("Get Out", "Jordan Peele", 2017),
        ("A Quiet Place", "John Krasinski", 2018),
    ],
    "Animacion": [
        ("Coco", "Lee Unkrich", 2017),
        ("Toy Story", "John Lasseter", 1995),
        ("Inside Out", "Pete Docter", 2015),
        ("Shrek", "Andrew Adamson", 2001),
        ("Ratatouille", "Brad Bird", 2007),
    ],
    "Romance": [
        ("La La Land", "Damien Chazelle", 2016),
        ("Pride and Prejudice", "Joe Wright", 2005),
        ("The Notebook", "Nick Cassavetes", 2004),
        ("Before Sunrise", "Richard Linklater", 1995),
        ("Her", "Spike Jonze", 2013),
    ],
    "Aventura": [
        ("Indiana Jones", "Steven Spielberg", 1981),
        ("Pirates of the Caribbean", "Gore Verbinski", 2003),
        ("The Revenant", "Alejandro Inarritu", 2015),
        ("Life of Pi", "Ang Lee", 2012),
        ("Jurassic Park", "Steven Spielberg", 1993),
    ],
}


class Command(BaseCommand):
    help = (
        "Carga peliculas por categoria en la tabla Libro para que aparezcan en filtros. "
        f"Tope permitido: {MAX_PELICULAS_PERMITIDAS}."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--max",
            type=int,
            default=150,
            help=(
                "Cantidad maxima de peliculas a agregar/actualizar. "
                f"Maximo permitido por script: {MAX_PELICULAS_PERMITIDAS}."
            ),
        )

    def handle(self, *args, **options):
        requested_max = int(options.get("max") or 0)

        if requested_max <= 0:
            raise CommandError("El valor de --max debe ser mayor que 0.")

        if requested_max > MAX_PELICULAS_PERMITIDAS:
            raise CommandError(
                f"El maximo permitido es {MAX_PELICULAS_PERMITIDAS}. "
                f"Valor recibido: {requested_max}."
            )

        peliculas = self._build_catalog(requested_max)

        created_count = 0
        updated_count = 0

        for item in peliculas:
            _, created = Libro.objects.update_or_create(
                isbn=item["isbn"],
                defaults=item,
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Peliculas procesadas: {len(peliculas)} | "
                f"creadas: {created_count} | actualizadas: {updated_count}"
            )
        )
        self.stdout.write(
            self.style.WARNING(
                f"Maximo configurable en este script: {MAX_PELICULAS_PERMITIDAS}"
            )
        )

    def _build_catalog(self, limit):
        catalog = []
        counters = {categoria: 0 for categoria in PELICULAS_POR_CATEGORIA.keys()}
        categorias = list(PELICULAS_POR_CATEGORIA.keys())

        idx = 0
        while len(catalog) < limit:
            categoria = categorias[idx % len(categorias)]
            pool = PELICULAS_POR_CATEGORIA[categoria]
            cursor = counters[categoria] % len(pool)
            titulo, director, anio = pool[cursor]
            counters[categoria] += 1

            running = len(catalog) + 1
            catalog.append(
                {
                    "isbn": self._build_isbn(running),
                    "titulo": self._fit(titulo, 50),
                    "autor": self._fit(director, 50),
                    "editorial": "Campus360 Studios",
                    "anio": anio,
                    "genero": categoria,
                    "precio": 7990 + (running % 8) * 1000,
                    "stock": 5 + (running % 16),
                    "imagen": f"https://picsum.photos/seed/campus360-movie-{running}/300/450",
                }
            )
            idx += 1

        return catalog

    @staticmethod
    def _build_isbn(number):
        # ISBN sintético de 13 dígitos para claves únicas del modelo Libro.
        return f"9{number:012d}"

    @staticmethod
    def _fit(value, max_len):
        text = str(value or "").strip()
        return text[:max_len]
