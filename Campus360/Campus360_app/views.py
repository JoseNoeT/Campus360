from rest_framework import viewsets
from rest_framework.generics import ListAPIView
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, NumberFilter, CharFilter
from .models import Usuario, Libro, Boleta, Orden, Detalle_boleta, Carrito, ItemCarrito, DetalleOrden
from .serializers import UsuarioSerializer, LibroSerializer, BoletaSerializer, OrdenSerializer, DetalleBoletaSerializer, CarritoSerializer, ItemCarritoSerializer, DetalleOrdenSerializer
from django.shortcuts import render, get_object_or_404
from django.shortcuts import redirect
from django.http import JsonResponse
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.db import transaction
from django.db.models import Q
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie
from decimal import Decimal
import requests


SESSION_CART_KEY = 'campus360_cart'


def _serialize_cart(session_cart):
    items = []
    total = 0
    for isbn, data in session_cart.items():
        cantidad = int(data.get('cantidad', 1))
        precio = int(data.get('precio', 0))
        subtotal = cantidad * precio
        total += subtotal
        items.append({
            'isbn': isbn,
            'titulo': data.get('titulo', ''),
            'precio': precio,
            'imagen': data.get('imagen', ''),
            'cantidad': cantidad,
            'subtotal': subtotal,
        })

    return {
        'success': True,
        'items': items,
        'count': sum(item['cantidad'] for item in items),
        'total': total,
    }


class RegistroUsuarioAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UsuarioSerializer(data=request.data)
        if serializer.is_valid():
            usuario = serializer.save()
            return Response(
                {
                    'id': str(usuario.id),
                    'id_usuario': usuario.id_usuario,
                    'email': usuario.email,
                    'role': usuario.role,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ViewSets para la API REST
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer


class LibroFilter(FilterSet):
    min = NumberFilter(field_name="precio", lookup_expr="gte")
    max = NumberFilter(field_name="precio", lookup_expr="lte")
    genero = CharFilter(field_name="genero", lookup_expr="iexact")

    class Meta:
        model = Libro
        fields = ["genero", "min", "max"]


class CatalogPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 48

class CatalogoLibroListView(ListAPIView):
    queryset = Libro.objects.all()
    serializer_class = LibroSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = LibroFilter
    search_fields = ["titulo", "autor"]
    ordering_fields = ["precio", "titulo"]
    ordering = ["titulo"]
    pagination_class = CatalogPagination

class BoletaViewSet(viewsets.ModelViewSet):
    queryset = Boleta.objects.all()
    serializer_class = BoletaSerializer

class OrdenViewSet(viewsets.ModelViewSet):
    queryset = Orden.objects.all()
    serializer_class = OrdenSerializer

class DetalleBoletaViewSet(viewsets.ModelViewSet):
    queryset = Detalle_boleta.objects.all()
    serializer_class = DetalleBoletaSerializer

class CarritoViewSet(viewsets.ModelViewSet):
    queryset = Carrito.objects.all()
    serializer_class = CarritoSerializer

class ItemCarritoViewSet(viewsets.ModelViewSet):
    queryset = ItemCarrito.objects.all()
    serializer_class = ItemCarritoSerializer

class DetalleOrdenViewSet(viewsets.ModelViewSet):
    queryset = DetalleOrden.objects.all()
    serializer_class = DetalleOrdenSerializer

# Vistas para renderizar plantillas HTML

def index(request):
    return render(request, 'Campus360_app/pages/home.html')

def biblioteca360(request):
    return render(request, 'Campus360_app/pages/biblioteca.html')

@ensure_csrf_cookie
def venta_libro(request):
    libros = Libro.objects.all()
    context = {'libros': libros}
    return render(request, 'Campus360_app/pages/catalog.html', context)

def calculo_nota(request):
    return render(request, 'Campus360_app/pages/calculo_nota.html')

def forgot_password(request):
    return render(request, 'Campus360_app/pages/forgot_password.html')

def login(request):
    if request.method == 'POST':
        email = (request.POST.get('email') or '').strip().lower()
        password = request.POST.get('password') or ''

        user = authenticate(request, email=email, password=password)
        if user is None:
            return render(
                request,
                'Campus360_app/pages/login.html',
                {'auth_error': 'Credenciales inválidas.'},
                status=401,
            )

        django_login(request, user)
        return redirect('index')

    return render(request, 'Campus360_app/pages/login.html')


def logout(request):
    if request.method == 'POST':
        django_logout(request)
    return redirect('index')

@login_required(login_url='/login/')
def perfil(request):
    return render(request, 'Campus360_app/pages/perfil.html')

def registro(request):
    if request.method == 'POST':
        payload = {
            'email': (request.POST.get('email') or '').strip().lower(),
            'password': request.POST.get('password') or '',
            'first_name': (request.POST.get('nombre') or '').strip(),
            'last_name': (request.POST.get('apellido') or '').strip(),
        }

        serializer = UsuarioSerializer(data=payload)
        if serializer.is_valid():
            user = serializer.save()
            django_login(request, user)
            return redirect('index')

        return render(
            request,
            'Campus360_app/pages/register.html',
            {'register_errors': serializer.errors},
            status=400,
        )

    return render(request, 'Campus360_app/pages/register.html')

def admin_view(request):
    return render(request, 'Campus360_app/admin.html')

def book_view(request):
    return render(request, 'Campus360_app/pages/book.html')


def checkout_confirmacion(request):
    order_id = request.GET.get('order')
    orden = None

    if order_id and request.user.is_authenticated:
        orden = (
            Orden.objects
            .filter(id=order_id, usuario=request.user)
            .prefetch_related('detalles_orden__libro')
            .first()
        )

    return render(request, 'Campus360_app/pages/checkout_success.html', {'orden': orden})

# Vistas para la API REST

@api_view(['GET', 'POST'])
def lista_libros(request):
    if request.method == 'GET':
        libros = Libro.objects.all()  # Recupera todos los libros
        libros_lista = list(libros.values('isbn', 'titulo', 'autor', 'editorial', 'anio', 'genero', 'precio', 'stock', 'imagen'))  # Usa 'isbn' como identificador
        return JsonResponse(libros_lista, safe=False)
    
    elif request.method == 'POST':
        # Procesar datos para crear un nuevo libro
        titulo = request.data.get('titulo')
        autor = request.data.get('autor')
        editorial = request.data.get('editorial')
        
        # Validar y guardar el nuevo libro
        nuevo_libro = Libro.objects.create(titulo=titulo, autor=autor, editorial=editorial)
        
        # Devolver una respuesta con el libro creado
        return JsonResponse({'mensaje': 'Libro creado correctamente', 'libro': {
            'id': nuevo_libro.id,
            'titulo': nuevo_libro.titulo,
            'autor': nuevo_libro.autor,
            'editorial': nuevo_libro.editorial
        }}, status=201)  # Status 201 indica creación exitosa
    
    else:
        return JsonResponse({'error': 'Método no permitido'}, status=405)

def vista_venta_libro(request):
    libros = Libro.objects.all()  # Obtén todos los libros desde la base de datos
    return render(request, 'Campus360_app/pages/catalog.html', {'libros': libros})


@api_view(['GET'])
def detalle_libro(request, pk):
    """
    Vista para obtener detalles de un libro específico.
    """
    libro = get_object_or_404(Libro, pk=pk)
    serializer = LibroSerializer(libro)
    return Response(serializer.data)


@api_view(['GET'])
def buscar_libros(request):
    """
    Vista para buscar libros según ciertos criterios.
    """
    # Obtener parámetros de consulta
    titulo = request.query_params.get('titulo', None)
    autor = request.query_params.get('autor', None)
    # Puedes añadir más parámetros de búsqueda según sea necesario

    # Filtrar libros según los parámetros recibidos
    libros = Libro.objects.all()

    if titulo:
        libros = libros.filter(titulo__icontains=titulo)  # Filtrar por título (insensible a mayúsculas)
    if autor:
        libros = libros.filter(autor__icontains=autor)  # Filtrar por autor (insensible a mayúsculas)

    # Serializar los resultados
    serializer = LibroSerializer(libros, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def mostrar_libros_api(request):
    # URL de la API REST donde se encuentran los datos de los libros
    url = 'http://tu-dominio.com/api/lista_libros/'

    try:
        # Realiza una solicitud GET a la API REST
        response = requests.get(url)

        # Verifica si la solicitud fue exitosa (código de estado 200)
        if response.status_code == 200:
            # Convierte la respuesta JSON en un objeto Python
            libros = response.json()

            # Puedes procesar los datos aquí según tus necesidades
            # Por ejemplo, guardarlos en tu base de datos local si es necesario
            for libro_data in libros:
                Libro.objects.update_or_create(
                    isbn=libro_data['isbn'],  # Ajusta según los campos de tu modelo Libro
                    defaults={
                        'titulo': libro_data['titulo'],
                        'autor': libro_data['autor'],
                        'editorial': libro_data['editorial'],
                        'anio': libro_data['anio'],
                        'genero': libro_data['genero'],
                        'precio': libro_data['precio'],
                        'imagen': libro_data['imagen']
                    }
                )

            # Renderiza una plantilla HTML con los datos obtenidos
            return render(request, 'tu_app/mostrar_libros.html', {'libros': libros})

        else:
            # Manejo de errores si la solicitud no fue exitosa
            return render(request, 'tu_app/error.html', {'mensaje': 'Error al obtener los datos de la API'})

    except requests.exceptions.RequestException as e:
        # Manejo de excepciones generales de solicitud
        return render(request, 'tu_app/error.html', {'mensaje': f'Error de conexión: {str(e)}'})


def _map_libro_to_google_item(libro):
    return {
        'id': str(libro.isbn),
        'volumeInfo': {
            'title': libro.titulo,
            'authors': [libro.autor] if libro.autor else ['Autor desconocido'],
            'publisher': libro.editorial,
            'publishedDate': str(libro.anio),
            'categories': [libro.genero] if libro.genero else [],
            'imageLinks': {
                'thumbnail': libro.imagen or '',
            },
            'previewLink': '#',
        },
    }


def _map_open_library_doc_to_item(doc):
    cover_id = doc.get('cover_i')
    thumbnail = f'https://covers.openlibrary.org/b/id/{cover_id}-M.jpg' if cover_id else ''
    key = doc.get('key') or ''

    return {
        'id': str(doc.get('cover_edition_key') or key or doc.get('title') or ''),
        'volumeInfo': {
            'title': doc.get('title') or 'Sin titulo',
            'authors': doc.get('author_name') or ['Autor desconocido'],
            'publisher': (doc.get('publisher') or [''])[0],
            'publishedDate': str(doc.get('first_publish_year') or ''),
            'categories': doc.get('subject') or [],
            'imageLinks': {
                'thumbnail': thumbnail,
            },
            'previewLink': f'https://openlibrary.org{key}' if key else '#',
        },
    }


@api_view(['GET'])
def biblioteca_search(request):
    query = (request.query_params.get('q') or '').strip()
    max_results_raw = request.query_params.get('maxResults', 20)

    try:
        max_results = max(1, min(int(max_results_raw), 40))
    except (TypeError, ValueError):
        max_results = 20

    open_library_url = f'https://openlibrary.org/search.json?q={query}&limit={max_results}'

    # 1) Intento API externa principal (Open Library)
    if query:
        try:
            response = requests.get(open_library_url, timeout=8)
            if response.status_code == 200:
                data = response.json()
                docs = data.get('docs') or []
                total_items = int(data.get('numFound') or 0)
                items = [_map_open_library_doc_to_item(doc) for doc in docs]
                if items:
                    return Response(
                        {
                            'success': True,
                            'source': 'openlibrary',
                            'totalItems': total_items,
                            'items': items,
                        }
                    )
        except requests.exceptions.RequestException:
            pass

    # 2) Fallback local (BD)
    libros = Libro.objects.all()
    if query:
        libros = libros.filter(
            Q(titulo__icontains=query)
            | Q(autor__icontains=query)
            | Q(genero__icontains=query)
            | Q(editorial__icontains=query)
        )

    libros = libros.order_by('titulo')
    total_local = libros.count()
    items_local = [_map_libro_to_google_item(libro) for libro in libros[:max_results]]

    # 3) Si no hay coincidencias, devolver recomendados locales para mantener la API útil
    if query and total_local == 0:
        recomendados_qs = Libro.objects.all().order_by('titulo')[:max_results]
        recomendados = [_map_libro_to_google_item(libro) for libro in recomendados_qs]
        return Response(
            {
                'success': True,
                'source': 'local_recommended',
                'totalItems': len(recomendados),
                'items': recomendados,
                'queryMatched': 0,
            }
        )

    return Response(
        {
            'success': True,
            'source': 'local',
            'totalItems': total_local,
            'items': items_local,
        }
    )


@api_view(['GET'])
def get_cart(request):
    if not request.user.is_authenticated:
        return Response(
            {'success': False, 'detail': 'Debes iniciar sesión para acceder al carrito.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    session_cart = request.session.get(SESSION_CART_KEY, {})
    return Response(_serialize_cart(session_cart))


@api_view(['POST'])
def add_cart_item(request):
    if not request.user.is_authenticated:
        return Response(
            {'success': False, 'detail': 'Debes iniciar sesión para agregar al carrito.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    isbn = request.data.get('isbn')
    cantidad = int(request.data.get('cantidad', 1))

    if not isbn:
        return Response({'success': False, 'detail': 'isbn es obligatorio'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        libro = Libro.objects.get(pk=isbn)
    except Libro.DoesNotExist:
        return Response({'success': False, 'detail': 'Libro no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    session_cart = request.session.get(SESSION_CART_KEY, {})
    current = session_cart.get(isbn, {
        'titulo': libro.titulo,
        'precio': int(libro.precio),
        'imagen': libro.imagen,
        'cantidad': 0,
    })
    current['cantidad'] = max(1, int(current.get('cantidad', 0)) + max(1, cantidad))
    session_cart[isbn] = current

    request.session[SESSION_CART_KEY] = session_cart
    request.session.modified = True

    return Response(_serialize_cart(session_cart), status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
def remove_cart_item(request, isbn):
    if not request.user.is_authenticated:
        return Response(
            {'success': False, 'detail': 'Debes iniciar sesión para modificar el carrito.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    session_cart = request.session.get(SESSION_CART_KEY, {})

    if isbn in session_cart:
        del session_cart[isbn]
        request.session[SESSION_CART_KEY] = session_cart
        request.session.modified = True

    return Response(_serialize_cart(session_cart))


@api_view(['POST'])
def checkout_order(request):
    if not request.user.is_authenticated:
        return Response(
            {'success': False, 'detail': 'Debes iniciar sesión para finalizar la compra.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    session_cart = request.session.get(SESSION_CART_KEY, {})
    if not session_cart:
        return Response(
            {'success': False, 'detail': 'El carrito está vacío.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    isbns = list(session_cart.keys())

    with transaction.atomic():
        libros = {
            libro.isbn: libro
            for libro in Libro.objects.select_for_update().filter(isbn__in=isbns)
        }

        for isbn, payload in session_cart.items():
            libro = libros.get(isbn)
            if not libro:
                return Response(
                    {'success': False, 'detail': f'Libro {isbn} no encontrado.'},
                    status=status.HTTP_404_NOT_FOUND,
                )

            cantidad = max(1, int(payload.get('cantidad', 1)))
            if libro.stock < cantidad:
                return Response(
                    {
                        'success': False,
                        'detail': f'Stock insuficiente para "{libro.titulo}". Disponible: {libro.stock}.',
                    },
                    status=status.HTTP_409_CONFLICT,
                )

        orden = Orden.objects.create(usuario=request.user, total=Decimal('0.00'))
        total = Decimal('0.00')

        for isbn, payload in session_cart.items():
            libro = libros[isbn]
            cantidad = max(1, int(payload.get('cantidad', 1)))
            precio_unitario = Decimal(str(libro.precio))

            DetalleOrden.objects.create(
                orden=orden,
                libro=libro,
                cantidad=cantidad,
                precio_unitario=precio_unitario,
            )

            libro.stock = libro.stock - cantidad
            libro.save(update_fields=['stock'])

            total += precio_unitario * cantidad

        orden.total = total
        orden.save(update_fields=['total'])

    request.session[SESSION_CART_KEY] = {}
    request.session.modified = True

    return Response(
        {
            'success': True,
            'order_id': orden.id,
            'total': str(orden.total),
            'confirmation_url': f'/checkout/confirmacion/?order={orden.id}',
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
def login_api(request):
    email = (request.data.get('email') or '').strip().lower()
    password = request.data.get('password') or ''

    user = authenticate(request, email=email, password=password)
    if user is None:
        return Response(
            {'success': False, 'detail': 'Credenciales inválidas.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.is_active:
        return Response(
            {'success': False, 'detail': 'Tu cuenta está inactiva.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    django_login(request, user)
    return Response(
        {
            'success': True,
            'user': {
                'id': str(user.id),
                'id_usuario': user.id_usuario,
                'email': user.email,
                'role': user.role,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        }
    )


@api_view(['POST'])
def logout_api(request):
    django_logout(request)
    return Response({'success': True})


@api_view(['GET', 'PUT'])
def session_me(request):
    if not request.user.is_authenticated:
        return Response({'is_authenticated': False}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'PUT':
        user = request.user
        first_name = (request.data.get('first_name') or '').strip()
        last_name = (request.data.get('last_name') or '').strip()

        if not first_name:
            return Response(
                {'success': False, 'detail': 'El nombre no puede estar vacío.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.first_name = first_name
        user.last_name = last_name
        user.save(update_fields=['first_name', 'last_name'])

        return Response(
            {
                'success': True,
                'user': {
                    'id': str(user.id),
                    'id_usuario': user.id_usuario,
                    'email': user.email,
                    'role': user.role,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }
            }
        )

    return Response(
        {
            'is_authenticated': True,
            'user': {
                'id': str(request.user.id),
                'id_usuario': request.user.id_usuario,
                'email': request.user.email,
                'role': request.user.role,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
            }
        }
    )

