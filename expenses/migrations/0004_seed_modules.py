from django.db import migrations


def seed_modules(apps, schema_editor):
    Module = apps.get_model("expenses", "Module")

    modules = [
        {"name": "Dashboard", "icon": "dashboard", "route": "/dashboard", "order": 1},
        {"name": "Expenses", "icon": "expenses", "route": "/expenses", "order": 2},
        {"name": "Categories", "icon": "categories", "route": "/categories", "order": 3},
        {"name": "Budgets", "icon": "budgets", "route": "/budgets", "order": 4},
        {"name": "Reports", "icon": "reports", "route": "/reports", "order": 5},
        {"name": "AI Insights", "icon": "insights", "route": "/ai-insights", "order": 6},
        {"name": "Budget Alert", "icon": "alert", "route": "/budget-alert", "order": 7},
    ]

    for module in modules:
        Module.objects.update_or_create(route=module["route"], defaults=module)


def unseed_modules(apps, schema_editor):
    Module = apps.get_model("expenses", "Module")
    Module.objects.filter(
        route__in=[
            "/dashboard",
            "/expenses",
            "/categories",
            "/budgets",
            "/reports",
            "/ai-insights",
            "/budget-alert",
        ]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("expenses", "0003_module"),
    ]

    operations = [
        migrations.RunPython(seed_modules, unseed_modules),
    ]
