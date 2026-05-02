from datetime import datetime,timedelta

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import DecimalField, Sum, Value
from django.db.models.functions import Coalesce

from rest_framework import permissions, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .utils import send_budget_exceeded_email
from .ai_services import expense_insight


from .models import Budget, Category, Expense, Module, UserDetails
from .serializers import (
    BudgetSerializer,
    CategorySerializer,
    ExpenseSerializer,
    ModuleSerializer,
)


# ==================== EXPENSE ====================
class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Expense.objects.filter(user=self.request.user).order_by('-date')

    def perform_create(self, serializer):
        expense = serializer.save(user=self.request.user)
        self.check_budget_and_notify(expense)

    def perform_update(self, serializer):
        expense = serializer.save(user=self.request.user)
        self.check_budget_and_notify(expense)

    def check_budget_and_notify(self, expense):
        user = expense.user
        month = expense.date.month
        year = expense.date.year

        total_spent = (
            Expense.objects.filter(
                user=user,
                date__month=month,
                date__year=year
            ).aggregate(total=Sum('amount'))['total'] or 0
        )

        budget = Budget.objects.filter(
            user=user,
            month=month,
            year=year
        ).first()

        if not budget:
            return

        if total_spent > budget.amount and not budget.is_alert_sent:
            try:
                user_details = UserDetails.objects.get(user=user)
                email = user_details.email
                username = user_details.username
            except UserDetails.DoesNotExist:
                email = user.email
                username = user.username

            send_budget_exceeded_email(
                email,
                username,
                total_spent,
                budget.amount
            )

            budget.is_alert_sent = True
            budget.save()


# ==================== CATEGORY ====================
class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ==================== BUDGET ====================
class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        month = serializer.validated_data["month"]
        year = serializer.validated_data["year"]
        amount = serializer.validated_data["amount"]

        budget, _ = Budget.objects.update_or_create(
            user=request.user,
            month=month,
            year=year,
            defaults={
                "amount": amount,
                "is_alert_sent": False,
            },
        )

        return Response(self.get_serializer(budget).data, status=201)


# ==================== REGISTER USER ====================
@api_view(['POST'])
def register_user(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    dob = request.data.get('date_of_birth')
    phone = request.data.get('contact_number')

    if not all([username, email, password, dob, phone]):
        return Response({"error": "All fields required"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({"error": "Email already exists"}, status=400)

    try:
        dob = datetime.strptime(dob, "%Y-%m-%d").date()
    except:
        return Response({"error": "Invalid date format"}, status=400)

    with transaction.atomic():
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )

        UserDetails.objects.create(
            user=user,
            username=username,
            email=email,
            date_of_birth=dob,
            contact_number=phone,
        )

    refresh = RefreshToken.for_user(user)

    return Response({
        "message": "User registered successfully",
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        },
    }, status=201)



# ==================== MONTHLY REPORT ====================
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def monthly_report(request):
    month = request.GET.get("month")
    year = request.GET.get("year")

    if not month or not year:
        return Response({"error": "Month and year required"}, status=400)

    data = (
        Expense.objects.filter(
            user=request.user,
            date__month=month,
            date__year=year
        )
        .exclude(category__isnull=True)
        .values("category__name")
        .annotate(total=Sum("amount"))
        .order_by("-total")
    )

    return Response(data)

# ==================== BUDGET SUMMARY ====================
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def budget_summary(request):
    month = request.GET.get("month")
    year = request.GET.get("year")

    total_spent = (
        Expense.objects.filter(
            user=request.user,
            date__month=month,
            date__year=year
        ).aggregate(
            total=Coalesce(
                Sum("amount"),
                Value(0),
                output_field=DecimalField(max_digits=10, decimal_places=2),
            )
        )["total"]
    )

    budget = Budget.objects.filter(
        user=request.user,
        month=month,
        year=year
    ).first()

    budget_amount = budget.amount if budget else 0
    remaining = budget_amount - total_spent
    progress = float((total_spent / budget_amount) * 100) if budget_amount else 0

    return Response({
        "month": int(month) if month else None,
        "year": int(year) if year else None,
        "budget_amount": budget_amount,
        "spent": total_spent,
        "remaining": remaining,
        "progress": min(progress, 100),
    })


# ==================== BUDGET ALERT ====================
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def budget_alert(request):
    today = datetime.now()

    total = Expense.objects.filter(
        user=request.user,
        date__month=today.month,
        date__year=today.year
    ).aggregate(total=Sum("amount"))["total"] or 0

    budget = Budget.objects.filter(
        user=request.user,
        month=today.month,
        year=today.year
    ).first()

    if not budget:
        return Response({"show": False})

    if total > budget.amount:
        return Response({
            "show": True,
            "type": "exceeded",
            "spent": total,
            "budget": budget.amount
        })

    return Response({"show": False})
# ==================== AI DASHBOARD ====================
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def ai_dashboard(request):
    month = request.GET.get("month")
    year = request.GET.get("year")

    today = datetime.now()

    if month and year:
        month = int(month)
        year = int(year)
    else:
        month = today.month
        year = today.year

    previous_month = 12 if month == 1 else month - 1
    previous_year = year - 1 if month == 1 else year

    current_expenses = Expense.objects.filter(
        user=request.user,
        date__month=month,
        date__year=year
    )

    previous_expenses = Expense.objects.filter(
        user=request.user,
        date__month=previous_month,
        date__year=previous_year
    )

    return Response(
        expense_insight(current_expenses, previous_expenses, month, year)
    )
# ==================== CURRENT USER ====================
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_superuser": user.is_superuser
    })


# ==================== EXPENSE SUMMARY ====================
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def expense_summary(request):
    total = Expense.objects.filter(user=request.user).aggregate(total=Sum('amount'))
    return Response(total)


# ==================== SIDEBAR MODULES ====================
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def sidebar_modules(request):
    modules = Module.objects.filter(is_active=True).order_by('order')
    serializer = ModuleSerializer(modules, many=True)
    return Response(serializer.data)
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def dashboard_data(request):
    user = request.user
    today = datetime.now()

    month = today.month
    year = today.year

    total_expense = Expense.objects.filter(
        user=user, date__month=month, date__year=year
    ).aggregate(total=Sum("amount"))["total"] or 0

    budget = Budget.objects.filter(user=user, month=month, year=year).first()

    budget_amount = budget.amount if budget else 0
    remaining = budget_amount - total_expense if budget else 0

    progress = (total_expense / budget_amount * 100) if budget_amount else 0

    return Response({
        "total_expense": total_expense,
        "budget": budget_amount,
        "remaining": remaining,
        "progress": round(progress, 2),
    })


# ==================== MONTHLY REPORT ====================
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def monthly_report(request):
    month = request.GET.get("month")
    year = request.GET.get("year")

    data = (
        Expense.objects.filter(user=request.user, date__month=month, date__year=year)
        .values("category__name")
        .annotate(total=Sum("amount"))
    )

    return Response(data)


# ==================== BUDGET SUMMARY ====================
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def budget_summary(request):
    month = request.GET.get("month")
    year = request.GET.get("year")

    total_spent = Expense.objects.filter(
        user=request.user, date__month=month, date__year=year
    ).aggregate(
        total=Coalesce(
            Sum("amount"),
            Value(0),
            output_field=DecimalField(max_digits=10, decimal_places=2),
        )
    )["total"]

    budget = Budget.objects.filter(user=request.user, month=month, year=year).first()

    budget_amount = budget.amount if budget else 0

    return Response({
        "budget": budget_amount,
        "spent": total_spent,
        "remaining": budget_amount - total_spent,
    })


# ==================== AI ====================
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def ai_dashboard(request):
    today = datetime.now()

    return Response(
        expense_insight(
            Expense.objects.filter(user=request.user),
            Expense.objects.filter(user=request.user),
            today.month,
            today.year
        )
    )

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def dashboard_data(request):
    user = request.user
    today = datetime.now()

    month = today.month
    year = today.year

    # TOTAL EXPENSE
    total_expense = Expense.objects.filter(
        user=user, date__month=month, date__year=year
    ).aggregate(total=Sum("amount"))["total"] or 0

    # BUDGET
    budget = Budget.objects.filter(user=user, month=month, year=year).first()
    budget_amount = budget.amount if budget else 0
    remaining = budget_amount - total_expense if budget else 0
    progress = (total_expense / budget_amount * 100) if budget_amount else 0

    # CATEGORY SPLIT
    category_data = (
        Expense.objects.filter(user=user, date__month=month, date__year=year)
        .values("category__name")
        .annotate(total=Sum("amount"))
        .order_by("-total")
    )

    category_list = list(category_data)

    # HIGHEST CATEGORY
    highest_category = category_list[0] if category_list else None

    # MONTHLY TREND (last 6 months)
    monthly_data = []
    for i in range(1, 7):
        date_obj = today - timedelta(days=30 * i)

        total = Expense.objects.filter(
            user=user,
            date__month=date_obj.month,
            date__year=date_obj.year
        ).aggregate(total=Sum("amount"))["total"] or 0

        monthly_data.append({
            "month": date_obj.strftime("%b"),
            "total": total
        })

    monthly_data.reverse()

    # RECENT TRANSACTIONS
    recent = Expense.objects.filter(user=user).order_by("-date")[:5]

    recent_list = [
        {
            "title": r.title,
            "category": r.category.name if r.category else None,
            "amount": r.amount,
            "date": r.date,
        }
        for r in recent
    ]

    # AI INSIGHTS
    ai_data = expense_insight(
        Expense.objects.filter(user=user, date__month=month, date__year=year),
        Expense.objects.filter(user=user),
        month,
        year
    )

    return Response({
        "total_expense": total_expense,
        "budget": budget_amount,
        "remaining": remaining,
        "progress": round(progress, 2),

        "highest_category": highest_category,
        "category_split": category_list,

        "monthly_trend": monthly_data,
        "recent_transactions": recent_list,

        "ai_insights": ai_data   # ✅ IMPORTANT
    })