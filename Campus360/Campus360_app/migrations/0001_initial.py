# Generated by Django 5.0.6 on 2024-07-05 02:30

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Boleta',
            fields=[
                ('id_boleta', models.CharField(max_length=50, primary_key=True, serialize=False)),
                ('fecha', models.DateField()),
                ('detalle', models.CharField(max_length=50)),
                ('monto', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Carrito',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
            ],
        ),
        migrations.CreateModel(
            name='Libro',
            fields=[
                ('isbn', models.CharField(max_length=13, primary_key=True, serialize=False)),
                ('titulo', models.CharField(max_length=50)),
                ('autor', models.CharField(max_length=50)),
                ('editorial', models.CharField(max_length=50)),
                ('anio', models.IntegerField()),
                ('genero', models.CharField(max_length=50)),
                ('precio', models.IntegerField()),
                ('imagen', models.URLField()),
            ],
        ),
        migrations.CreateModel(
            name='Orden',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha', models.DateTimeField(auto_now_add=True)),
                ('total', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
            ],
        ),
        migrations.CreateModel(
            name='Usuario',
            fields=[
                ('id_usuario', models.CharField(max_length=50, primary_key=True, serialize=False)),
                ('tipo_usuario', models.CharField(max_length=50)),
                ('nombre', models.CharField(max_length=50)),
                ('apellido', models.CharField(max_length=50)),
                ('correo', models.CharField(max_length=50)),
                ('contrasena', models.CharField(max_length=50)),
            ],
        ),
        migrations.CreateModel(
            name='ItemCarrito',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cantidad', models.IntegerField()),
                ('carrito', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='Campus360_app.carrito')),
                ('libro', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items_carrito', to='Campus360_app.libro')),
            ],
        ),
        migrations.CreateModel(
            name='Detalle_boleta',
            fields=[
                ('id_detalle_boleta', models.CharField(max_length=50, primary_key=True, serialize=False)),
                ('cantidad', models.IntegerField()),
                ('id_boleta', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='detalles_boleta', to='Campus360_app.boleta')),
                ('id_libro', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='detalles_boleta', to='Campus360_app.libro')),
            ],
        ),
        migrations.CreateModel(
            name='DetalleOrden',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cantidad', models.PositiveIntegerField(default=1)),
                ('precio_unitario', models.DecimalField(decimal_places=2, max_digits=10)),
                ('libro', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='detalles_orden', to='Campus360_app.libro')),
                ('orden', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='detalles_orden', to='Campus360_app.orden')),
            ],
        ),
        migrations.AddField(
            model_name='orden',
            name='usuario',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ordenes', to='Campus360_app.usuario'),
        ),
        migrations.AddField(
            model_name='carrito',
            name='usuario',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='carrito', to='Campus360_app.usuario'),
        ),
        migrations.AddField(
            model_name='boleta',
            name='id_usuario',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='boletas', to='Campus360_app.usuario'),
        ),
    ]
