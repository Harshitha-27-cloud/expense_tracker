from django.db import models
from django.contrib.auth.models import User


class UserDetails(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    username = models.CharField(max_length=150)
    email = models.EmailField()
    date_of_birth = models.DateField()
    contact_number = models.CharField(max_length=15)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username


class Category(models.Model):
    name = models.CharField(max_length=100)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class Expense(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    title = models.CharField(max_length=255)
    date = models.DateField()
    description = models.TextField(blank=True)

    def __str__(self):
        return self.title


class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    month = models.IntegerField()
    year = models.IntegerField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_alert_sent = models.BooleanField(default=False)


class Module(models.Model):
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50)
    route = models.CharField(max_length=100)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name