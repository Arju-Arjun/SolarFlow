from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Customer, Payment, Loan, SiteVisit
from werkzeug.utils import secure_filename
import os
import uuid

payment_bp = Blueprint(
    "payment_bp",
    __name__,
    url_prefix="/api/payments"
)

UPLOAD_FOLDER = "backend/static/uploads/payments"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ================= SAVE FILE =================
def save_payment_file(file, customer_name):
    if not file:
        return None

    ext = file.filename.rsplit(".", 1)[-1]
    unique_id = str(uuid.uuid4())[:8]

    filename = f"{customer_name}_payment_{unique_id}.{ext}"
    filename = secure_filename(filename)

    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    return f"/{UPLOAD_FOLDER}/{filename}"


# ================= DELETE FILE =================
def delete_file(filepath):
    if filepath:
        full_path = filepath.replace("/backend/", "backend/")
        if os.path.exists(full_path):
            os.remove(full_path)


# ================= GET BY CUSTOMER =================
@payment_bp.route("/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_payment_by_customer(customer_id):
    try:
        payment = Payment.query.filter_by(customer_id=customer_id).first()

        if not payment:
            return jsonify({"error": "Payment not found"}), 404

        return jsonify({
            "id": payment.id,
            "customer_id": payment.customer_id,
            "advance": payment.advance,
            "second": payment.second,
            "third": payment.third,
            "total_received": payment.total_received,
            "balance_due": payment.balance_due,
            "comments": payment.comments,
            "images": payment.payment_proofs or []
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ================= CREATE =================
@payment_bp.route("/", methods=["POST"])
@jwt_required()
def create_payment():
    try:
        data = request.form
        customer_id = int(data.get("customer_id"))

        existing = Payment.query.filter_by(customer_id=customer_id).first()
        if existing:
            return jsonify({"error": "Payment already exists"}), 400

        customer = Customer.query.get(customer_id)
        if not customer:
            return jsonify({"error": "Customer not found"}), 404

        advance = float(data.get("advance", 0))
        second = float(data.get("second", 0))
        third = float(data.get("third", 0))

        loan = Loan.query.filter_by(customer_id=customer_id).first()
        loan_amount = float(loan.total_loan_amount or 0) if loan else 0

        site_visit = SiteVisit.query.filter_by(customer_id=customer_id).first()
        project_cost = float(site_visit.project_cost or 0) if site_visit else 0

        total_received = advance + second + third + loan_amount
        balance_due = project_cost - total_received

        payment = Payment(
            customer_id=customer_id,
            advance=advance,
            second=second,
            third=third,
            total_received=total_received,
            balance_due=balance_due,
            comments=data.get("comments", "")
        )

        db.session.add(payment)
        db.session.commit()

        files = request.files.getlist("files")
        images = []

        for file in files:
            if file and file.filename:
                path = save_payment_file(file, customer.name)
                if path:
                    images.append(path)

        payment.payment_proofs = images
        db.session.commit()

        return jsonify({
            "message": "Payment created",
            "payment": {
                "id": payment.id,
                "customer_id": payment.customer_id,
                "advance": payment.advance,
                "second": payment.second,
                "third": payment.third,
                "total_received": payment.total_received,
                "balance_due": payment.balance_due,
                "comments": payment.comments,
                "images": images
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ================= UPDATE (FIXED) =================
@payment_bp.route("/<int:customer_id>", methods=["PUT"])
@jwt_required()
def update_payment(customer_id):
    try:
        payment = Payment.query.filter_by(customer_id=customer_id).first()

        if not payment:
            return jsonify({"error": "Payment not found"}), 404

        data = request.form

        payment.advance = float(data.get("advance", payment.advance or 0))
        payment.second = float(data.get("second", payment.second or 0))
        payment.third = float(data.get("third", payment.third or 0))
        payment.comments = data.get("comments", payment.comments)

        loan = Loan.query.filter_by(customer_id=customer_id).first()
        loan_amount = float(loan.total_loan_amount or 0) if loan else 0

        site_visit = SiteVisit.query.filter_by(customer_id=customer_id).first()
        project_cost = float(site_visit.project_cost or 0) if site_visit else 0

        payment.total_received = (
            float(payment.advance or 0) +
            float(payment.second or 0) +
            float(payment.third or 0) +
            loan_amount
        )

        payment.balance_due = project_cost - payment.total_received

        files = request.files.getlist("files")
        images = payment.payment_proofs or []

        for file in files:
            if file and file.filename:
                path = save_payment_file(file, Customer.query.get(customer_id).name)
                if path:
                    images.append(path)

        payment.payment_proofs = images

        db.session.commit()

        return jsonify({
            "message": "Payment updated",
            "payment": {
                "id": payment.id,
                "customer_id": payment.customer_id,
                "advance": payment.advance,
                "second": payment.second,
                "third": payment.third,
                "total_received": payment.total_received,
                "balance_due": payment.balance_due,
                "comments": payment.comments,
                "images": images
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ================= GET =================
@payment_bp.route("/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_payment(customer_id):
    try:
        payment = Payment.query.filter_by(customer_id=customer_id).first()

        if not payment:
            return jsonify({"error": "Payment not found"}), 404

        return jsonify({
            "id": payment.id,
            "customer_id": payment.customer_id,
            "advance": payment.advance,
            "second": payment.second,
            "third": payment.third,
            "total_received": payment.total_received,
            "balance_due": payment.balance_due,
            "comments": payment.comments,
            "images": payment.payment_proofs or []
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ================= DELETE =================
@payment_bp.route("/<int:customer_id>", methods=["DELETE"])
@jwt_required()
def delete_payment(customer_id):
    try:
        payment = Payment.query.filter_by(customer_id=customer_id).first()

        if not payment:
            return jsonify({"error": "Payment not found"}), 404

        db.session.delete(payment)
        db.session.commit()

        return jsonify({"message": "Deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500