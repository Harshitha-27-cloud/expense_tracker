from rest_framework import serializers

from .models import Budget, Category, Expense, Module


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"
        read_only_fields = ("user",)


class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.none(),
        allow_null=True,
        required=False,
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            self.fields['category'].queryset = Category.objects.filter(user=request.user)
        else:
            self.fields['category'].queryset = Category.objects.none()

    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['user']

class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = "__all__"
        read_only_fields = ("user",)

class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = '__all__'


