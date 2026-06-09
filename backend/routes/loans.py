from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Loan, Customer
from utils import upload_to_cloud, delete_to_cloud

loan_bp = Blueprint("loan_bp", __name__, url_prefix="/api/loans")

# ==========================================
# CREATE OR UPDATE LOAN RECORD
# ==========================================
@loan_bp.route("/<int:customer_id>", methods=["POST"])
@jwt_required()
def create_or_update_loan(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    loan = Loan.query.filter_by(customer_id=customer_id).first()

    enabled = request.form.get("enabled") == "true"
    status = request.form.get("status")
    submission = request.form.get("submission")
    comments = request.form.get("comments")
    extra_comments = request.form.get("extra_comments")
    first_payment = float(request.form.get("first_payment", 0))
    second_payment = float(request.form.get("second_payment", 0))
    total_loan_amount = first_payment + second_payment

    
    if not enabled:
        if loan:
            if loan.ack_file:
                delete_to_cloud(loan.ack_file)
            db.session.delete(loan)
            db.session.commit()
       
        return jsonify({"message": "deleted successfully"}), 200

    file = request.files.get("ack_file")
    file_path = None
    if file and file.filename:
       
        if loan and loan.ack_file:
            delete_to_cloud(loan.ack_file)
            
        file_path = upload_to_cloud(file, folder_name="solar_flow/loans")

    if not loan:
        loan = Loan(
            customer_id=customer_id, enabled=enabled, status=status, submission=submission,
            comments=comments, extra_comments=extra_comments, first_payment=first_payment,
            second_payment=second_payment, total_loan_amount=total_loan_amount, ack_file=file_path
        )
        db.session.add(loan)
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
            loan.ack_file = file_path

    db.session.commit()
    return jsonify({
        "message": "saved successfully",
        "loan": {
            "enabled": loan.enabled, "status": loan.status, "submission": loan.submission,
            "comments": loan.comments, "extra_comments": loan.extra_comments,
            "first_payment": loan.first_payment, "second_payment": loan.second_payment,
            "total_loan_amount": loan.total_loan_amount, "ack_file": loan.ack_file
        }
    }), 200


# ==========================================
# GET LOAN RECORD BY CUSTOMER ID
# ==========================================
@loan_bp.route("/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_loan(customer_id):
    loan = Loan.query.filter_by(customer_id=customer_id).first()
    if not loan:
        return jsonify({}), 200

    return jsonify({
        "id": loan.id, "enabled": loan.enabled, "status": loan.status, "submission": loan.submission,
        "comments": loan.comments, "extra_comments": loan.extra_comments, "first_payment": loan.first_payment,
        "second_payment": loan.second_payment, "total_loan_amount": loan.total_loan_amount, "ack_file": loan.ack_file
    }), 200