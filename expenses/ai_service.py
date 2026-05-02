from collections import defaultdict

def expense_insight(expenses):
    if not expenses:
        return "No expenses found."

    total = 0
    category_sum = defaultdict(float)

    for e in expenses:
        total += float(e.amount)
        cat = e.category.name if e.category else "Other"
        category_sum[cat] += float(e.amount)

    top_category = max(category_sum, key=category_sum.get)

    return {
        "total": total,
        "top_category": top_category,
        "message": f"You spend most on {top_category}. Try to reduce it."
    }