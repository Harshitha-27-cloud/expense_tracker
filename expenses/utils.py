from sparkpost import SparkPost
from django.conf import settings

def send_budget_exceeded_email(email, username, spent, budget):
    print(f"EMAIL -> {email}: Budget exceeded ₹{spent}/{budget}")
def send_budget_exceeded_email(email, username, spent, budget):
    response = sp.transmissions.send(
        recipients=[email],
        html=f"""
        <h2>Budget Alert 🚨</h2>
        <p>Hi {username},</p>
        <p>You have exceeded your monthly budget.</p>
        <p><b>Spent:</b> ₹{spent}</p>
        <p><b>Budget:</b> ₹{budget}</p>
        """,
        from_email=settings.DEFAULT_FROM_EMAIL,
        subject="Budget Exceeded Alert"
    )
    return response