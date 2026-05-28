from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Loan, Customer,Payment
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime

# =========================
# BLUEPRINT
# =========================
loan_bp = Blueprint(
    "loan_bp",
    __name__,
    url_prefix="/api/loans"
)

# =========================
# CONFIG
UPLOAD_BASE = "backend/static/uploads/loans"
os.makedirs(UPLOAD_BASE, exist_ok=True)

# =========================
# HELPER FUNCTIONS
def save_file(file, customer_name):
    ext = file.filename.split(".")[-1]
    filename = f"{customer_name}_ack_{uuid.uuid4().hex[:4]}.{ext}"
    filename = secure_filename(filename)

    filepath = os.path.join(UPLOAD_BASE, filename)
    file.save(filepath)

    return f"/{UPLOAD_BASE}/{filename}"


def delete_file(filepath):
    if filepath:
        full_path = filepath.lstrip("/")
        if os.path.exists(full_path):
            os.remove(full_path)


# =========================
# CREATE / UPDATE (SINGLE API)
# =========================
@loan_bp.route("/<int:customer_id>", methods=["POST"])
@jwt_required()
def create_or_update_loan(customer_id):

    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    # check existing
    loan = Loan.query.filter_by(customer_id=customer_id).first()

    # FORM DATA (for file upload)
    enabled = request.form.get("enabled") == "true"
    status = request.form.get("status")
    submission = request.form.get("submission")
    comments = request.form.get("comments")
    extra_comments = request.form.get("extra_comments")
    first_payment = float(request.form.get("first_payment", 0))
    second_payment = float(request.form.get("second_payment", 0))
    total_loan_amount = first_payment + second_payment

    # 🔴 IF DISABLED → DELETE
    if not enabled:
        if loan:
            delete_file(loan.ack_file)
            db.session.delete(loan)
            db.session.commit()
        return jsonify({"message": "Bank loan removed (disabled)"}), 200

    # FILE
    file = request.files.get("ack_file")
    file_path = None

    if file:
        file_path = save_file(file, customer.name)

    # =========================
    # CREATE
    if not loan:
        loan = Loan(
            customer_id=customer_id,
            enabled=enabled,
            status=status,
            submission=submission,
            comments=comments,
            extra_comments=extra_comments,
            first_payment=first_payment,
            second_payment=second_payment,
            total_loan_amount=total_loan_amount,
            ack_file=file_path
        )
        db.session.add(loan)

    # =========================
    # UPDATE
    else:
        loan.enabled = enabled
        loan.status = status
        loan.submission = submission
        loan.comments = comments
        loan.extra_comments = extra_comments
        loan.first_payment = first_payment
        loan.second_payment = second_payment
        loan.total_loan_amount = total_loan_amount
        if file_path:
            delete_file(loan.ack_file)
            loan.ack_file = file_path

    db.session.commit()

    

    return jsonify({
        "message": "Bank loan saved successfully",
        "loan": {
            "enabled": loan.enabled,
            "status": loan.status,
            "submission": loan.submission,
            "comments": loan.comments,
            "extra_comments": loan.extra_comments,
            "first_payment": loan.first_payment,
            "second_payment": loan.second_payment,
            "total_loan_amount": loan.total_loan_amount,
            "ack_file": loan.ack_file,
            "created_at": loan.created_at,
            "updated_at": loan.updated_at
        }
    }), 200


# =========================
# GET
# =========================
@loan_bp.route("/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_loan(customer_id):

    loan = Loan.query.filter_by(customer_id=customer_id).first()

    if not loan:
        return jsonify({}), 200
    
    

    return jsonify({
        "id": loan.id,
        "enabled": loan.enabled,
        "status": loan.status,
        "submission": loan.submission,
        "comments": loan.comments,
        "extra_comments": loan.extra_comments,
        "first_payment": loan.first_payment,
        "second_payment": loan.second_payment,
        "total_loan_amount": loan.total_loan_amount,
        "ack_file": loan.ack_file,
        "created_at": loan.created_at,
        "updated_at": loan.updated_at
    }), 200