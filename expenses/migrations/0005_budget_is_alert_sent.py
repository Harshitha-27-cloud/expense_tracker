# Generated manually to align the database schema with the Budget model.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("expenses", "0004_seed_modules"),
    ]

    operations = [
        migrations.AddField(
            model_name="budget",
            name="is_alert_sent",
            field=models.BooleanField(default=False),
        ),
    ]
