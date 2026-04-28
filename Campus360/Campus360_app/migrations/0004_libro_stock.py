from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Campus360_app', '0003_usuario_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='libro',
            name='stock',
            field=models.PositiveIntegerField(default=10),
        ),
    ]
