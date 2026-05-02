from django.db.models import Sum


def expense_insight(current_qs, previous_qs, month, year):
    insights = []

    # ================= TOTAL SPENDING =================
    current_total = current_qs.aggregate(total=Sum('amount'))['total'] or 0
    previous_total = previous_qs.aggregate(total=Sum('amount'))['total'] or 0

    # Compare spending
    if previous_total > 0:
        change = ((current_total - previous_total) / previous_total) * 100

        if change > 10:
            insights.append(f"⚠️ Your spending increased by {round(change)}% compared to last month.")
        elif change < -10:
            insights.append(f"✅ Great! You reduced spending by {abs(round(change))}% compared to last month.")

    # ================= CATEGORY ANALYSIS =================
    current_categories = (
        current_qs.values('category__name')
        .annotate(total=Sum('amount'))
        .order_by('-total')
    )

    previous_categories = (
        previous_qs.values('category__name')
        .annotate(total=Sum('amount'))
    )

    prev_map = {c['category__name']: c['total'] for c in previous_categories}

    if current_categories:
        top_category = current_categories[0]
        insights.append(f"📊 {top_category['category__name']} is your highest spending category.")

        # Compare category growth
        name = top_category['category__name']
        current_val = top_category['total']
        prev_val = prev_map.get(name, 0)

        if prev_val > 0:
            diff = ((current_val - prev_val) / prev_val) * 100
            if diff > 20:
                insights.append(f"⚠️ You spent {round(diff)}% more on {name} compared to last month.")

    # ================= SMART SUGGESTIONS =================
    for cat in current_categories:
        percent = (cat['total'] / current_total) * 100 if current_total else 0

        if percent > 40:
            insights.append(f"💡 {cat['category__name']} takes {round(percent)}% of your expenses. Consider reducing it.")
            break

    # ================= FALLBACK =================
    if not insights:
        insights.append("👍 Your spending looks stable this month.")

    return insights