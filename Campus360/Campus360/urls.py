# Campus360/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from Campus360_app import views  # Asegúrate de importar las vistas de tu aplicación

urlpatterns = [
    path('', views.index, name='index'),  # Ruta raíz principal
    path('home/', views.index, name='home'),  # Alias limpio
    path('perfil/', views.perfil, name='perfil'),
    path('calculo-nota/', views.calculo_nota, name='calculo_nota'),
    path('biblioteca/', views.biblioteca360, name='biblioteca360'),
    path('catalogo/', views.venta_libro, name='venta_libro'),
    path('book/', views.book_view, name='book_view'),
    path('registro/', views.registro, name='registro'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('forgot_password/', views.forgot_password, name='forgot_password'),
    path('admin/', admin.site.urls),
    path('api/libros/', views.lista_libros, name='lista_libros'),  # Ruta para la vista lista_libros
    path('api/catalogo/', views.CatalogoLibroListView.as_view(), name='catalogo_libros'),
    path('api/biblioteca/search/', views.biblioteca_search, name='biblioteca_search'),
    path('api/libros/<int:pk>/', views.detalle_libro, name='detalle_libro'),  # Ruta para detalle de libro por ID
    path('api/buscar-libros/', views.buscar_libros, name='buscar_libros'),  # Ruta para buscar libros por criterios
    path('api/cart/', views.get_cart, name='get_cart'),
    path('api/cart/items/', views.add_cart_item, name='add_cart_item'),
    path('api/cart/items/<str:isbn>/', views.remove_cart_item, name='remove_cart_item'),
    path('api/orders/checkout/', views.checkout_order, name='checkout_order'),
    path('checkout/confirmacion/', views.checkout_confirmacion, name='checkout_confirmacion'),
    path('api/auth/login/', views.login_api, name='login_api'),
    path('api/auth/logout/', views.logout_api, name='logout_api'),
    path('api/auth/me/', views.session_me, name='session_me'),
    path('api/auth/register/', views.RegistroUsuarioAPIView.as_view(), name='registro_usuario_api'),
     
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
