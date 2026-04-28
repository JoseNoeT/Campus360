from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Boleta, Carrito, Detalle_boleta, DetalleOrden, ItemCarrito, Libro, Orden, Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
	model = Usuario
	list_display = ("email", "role", "is_staff", "is_active")
	list_filter = ("role", "is_staff", "is_superuser", "is_active")
	ordering = ("email",)
	search_fields = ("email", "username")

	fieldsets = (
		(None, {"fields": ("email", "password")}),
		("Personal info", {"fields": ("username", "first_name", "last_name", "role")}),
		(
			"Permissions",
			{"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
		),
		("Important dates", {"fields": ("last_login", "date_joined")}),
	)

	add_fieldsets = (
		(
			None,
			{
				"classes": ("wide",),
				"fields": ("email", "password1", "password2", "role", "is_staff", "is_active"),
			},
		),
	)


admin.site.register(Libro)
admin.site.register(Boleta)
admin.site.register(Orden)
admin.site.register(Detalle_boleta)
admin.site.register(Carrito)
admin.site.register(ItemCarrito)
admin.site.register(DetalleOrden)






