from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from Campus360_app import views

# Definir un router para las vistas de la API
router = DefaultRouter()
router.register(r'usuarios', views.UsuarioViewSet)
router.register(r'libros', views.LibroViewSet)
router.register(r'boletas', views.BoletaViewSet)
router.register(r'ordenes', views.OrdenViewSet)
router.register(r'detalles-boleta', views.DetalleBoletaViewSet)
router.register(r'carritos', views.CarritoViewSet)
router.register(r'items-carrito', views.ItemCarritoViewSet)
router.register(r'detalles-orden', views.DetalleOrdenViewSet)

urlpatterns = [
    path('', views.index, name='index'),
    path('admin/', admin.site.urls),
    path('biblioteca360/', views.biblioteca360, name='biblioteca'),
    path('venta-libro/', views.venta_libro, name='venta_libro'),
    path('calculo-nota/', views.calculo_nota, name='calculo_nota'),
    path('forgot_password/', views.forgot_password, name='forgot_password'),
    path('login/', views.login, name='login'),
    path('perfil/', views.perfil, name='perfil'),
    path('registro/', views.registro, name='registro'),
    path('admin_view/', views.admin_view, name='admin_view'),  # Cambiado para evitar conflictos
    path('api/libros/', views.lista_libros, name='lista_libros'),  # Endpoint de la API para listar libros
    path('book/', views.book_view, name='book'), 
]

