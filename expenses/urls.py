from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ExpenseViewSet,
    CategoryViewSet,
    BudgetViewSet,
    current_user,
    register_user,
    monthly_report,
    budget_summary,
    budget_alert,
    sidebar_modules,
    ai_dashboard,
    dashboard_data, 
)

router = DefaultRouter()
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'budgets', BudgetViewSet, basename='budget')

urlpatterns = [
    path('register/', register_user),
    path('current-user/', current_user),
    path('reports/monthly/', monthly_report),
    path('budgets/summary/', budget_summary),
    path('budgets/alert/', budget_alert),
    path('sidebar/', sidebar_modules),
     path('ai/insights/', ai_dashboard),  
    path('dashboard/', dashboard_data, name='dashboard'),
    path('', include(router.urls)),

]
