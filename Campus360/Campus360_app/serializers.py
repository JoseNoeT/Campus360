# Campus360_app/serializers.py

from rest_framework import serializers
from .models import Usuario, Libro, Boleta, Orden, Detalle_boleta, Carrito, ItemCarrito, DetalleOrden



class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)

    class Meta:
        model = Usuario
        fields = ('id', 'id_usuario', 'email', 'password', 'role', 'first_name', 'last_name')
        read_only_fields = ('id', 'id_usuario',)

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        return user

class LibroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Libro
        fields = ('isbn', 'titulo', 'autor', 'editorial', 'anio', 'genero', 'precio', 'stock', 'imagen')

class BoletaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Boleta
        fields = '__all__'

class OrdenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Orden
        fields = '__all__'

class DetalleBoletaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Detalle_boleta
        fields = '__all__'

class CarritoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Carrito
        fields = '__all__'

class ItemCarritoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemCarrito
        fields = '__all__'

class DetalleOrdenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleOrden
        fields = '__all__'

