from flask import Flask, render_template, request, redirect, url_for, flash
from datetime import datetime

app = Flask(__name__)
app.secret_key = "change-this-secret-key"

# נתוני הדגמה בלבד. בשלב הבא נחבר מסד נתונים.
checks = [
    {"id": 1001, "customer": "דני כהן", "amount": 5200, "date": "15/11/2026", "status": "ממתין להפקדה"},
    {"id": 1002, "customer": "שירי אביב", "amount": 3800, "date": "20/11/2026", "status": "נפרע"},
    {"id": 1003, "customer": "אבי לוי", "amount": 7600, "date": "10/11/2026", "status": "חזר"},
]

@app.route("/")
def home():
    total_amount = sum(item["amount"] for item in checks)
    return render_template("index.html", checks=checks, total_amount=total_amount, page="home")

@app.route("/checks")
def all_checks():
    return render_template("checks.html", checks=checks, page="checks")

@app.route("/upload", methods=["GET", "POST"])
def upload_check():
    if request.method == "POST":
        customer = request.form.get("customer", "").strip()
        amount_text = request.form.get("amount", "").strip()
        date = request.form.get("date", "").strip()

        if not customer or not amount_text or not date:
            flash("צריך למלא או לאשר שם לקוח, סכום ותאריך.", "error")
            return redirect(url_for("upload_check"))

        try:
            amount = float(amount_text.replace(",", ""))
            if amount <= 0:
                raise ValueError
        except ValueError:
            flash("הסכום חייב להיות מספר חיובי.", "error")
            return redirect(url_for("upload_check"))

        checks.insert(0, {
            "id": int(datetime.now().timestamp()),
            "customer": customer,
            "amount": amount,
            "date": date,
            "status": "ממתין להפקדה"
        })
        flash("הצ׳ק נוסף לרשימה בהצלחה (נתוני הדגמה).", "success")
        return redirect(url_for("all_checks"))

    return render_template("upload.html", page="upload")

@app.route("/alerts")
def alerts():
    needs_attention = [item for item in checks if item["status"] in ("חזר", "ממתין להפקדה")]
    return render_template("alerts.html", checks=needs_attention, page="alerts")

if __name__ == "__main__":
    app.run(debug=True)
