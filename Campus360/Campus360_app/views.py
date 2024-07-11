from rest_framework import viewsets
from .models import Usuario, Libro, Boleta, Orden, Detalle_boleta, Carrito, ItemCarrito, DetalleOrden
from .serializers import UsuarioSerializer, LibroSerializer, BoletaSerializer, OrdenSerializer, DetalleBoletaSerializer, CarritoSerializer, ItemCarritoSerializer, DetalleOrdenSerializer
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view
import requests

# ViewSets para la API REST
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

class LibroViewSet(viewsets.ModelViewSet):
    queryset = Libro.objects.all()
    serializer_class = LibroSerializer

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
    return render(request, 'Campus360_app/index.html')

def biblioteca360(request):
    return render(request, 'Campus360_app/Biblioteca360.html')

def venta_libro(request):
    libros = Libro.objects.all()
    context = {'libros': libros}
    return render(request, 'Campus360_app/Venta_libro.html', context)

def calculo_nota(request):
    return render(request, 'Campus360_app/Calculo_nota.html')

def forgot_password(request):
    return render(request, 'Campus360_app/forgot_password.html')

def login(request):
    return render(request, 'Campus360_app/login.html')

def perfil(request):
    return render(request, 'Campus360_app/Perfil.html')

def registro(request):
    return render(request, 'Campus360_app/Registro.html')

def admin_view(request):
    return render(request, 'Campus360_app/admin.html')

def book_view(request):
    return render(request, 'Campus360_app/book.html')

# Vistas para la API REST

@api_view(['GET', 'POST'])
def lista_libros(request):
    if request.method == 'GET':
        libros = Libro.objects.all()  # Recupera todos los libros
        libros_lista = list(libros.values('isbn', 'titulo', 'autor', 'editorial', 'anio', 'genero', 'precio', 'imagen'))  # Usa 'isbn' como identificador
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
    return render(request, 'Venta_libro.html', {'libros': libros})


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

