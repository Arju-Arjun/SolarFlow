from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Customer, Payment, Loan, SiteVisit
from werkzeug.utils import secure_filename
import os
import uuid
import json

# =========================
# BLUEPRINT
# =========================
payment_bp = Blueprint(
    "payment_bp",
    __name__,
    url_prefix="/api/payments"
)

# =========================
# UPLOAD CONFIG
# =========================
UPLOAD_FOLDER = "backend/static/uploads/payments"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# =========================
# SAVE FILE
# =========================
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


# =========================
# DELETE FILE
# =========================
def delete_file(filepath):
    if filepath:
        full_path = filepath.replace("/backend/", "backend/")
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
            except Exception as e:
                print(f"Error deleting file: {e}")


# =========================
# CREATE PAYMENT (NEW)
# =========================
@payment_bp.route("/", methods=["POST"])
@jwt_required()
def create_payment():
    try:
        data = request.form
        customer_id = int(data.get("customer_id"))

        existing = Payment.query.filter_by(customer_id=customer_id).first()
        if existing:
            return jsonify({"error": "Payment already exists. Use PUT to update."}), 400

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

        # FILES
        files = request.files.getlist("files")
        file_paths = []

        for file in files:
            if file and file.filename:
                path = save_payment_file(file, customer.name)
                if path:
                    file_paths.append(path)

        if file_paths:
            payment.payment_proofs = file_paths
        else:
            payment.payment_proofs = []
        db.session.commit()

        # Ensure payment_proofs is always a list
        proofs = payment.payment_proofs if isinstance(payment.payment_proofs, list) else []

        return jsonify({
            "message": "Payment created successfully",
            "payment": {
                "id": payment.id,
                "customer_id": payment.customer_id,
                "advance": payment.advance,
                "second": payment.second,
                "third": payment.third,
                "total_received": payment.total_received,
                "balance_due": payment.balance_due,
                "comments": payment.comments,
                "images": proofs
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creating payment: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# =========================
# UPDATE PAYMENT
# =========================
@payment_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_payment(id):
    try:
        payment = Payment.query.get_or_404(id)
        data = request.form

        if data.get("advance") is not None:
            payment.advance = float(data.get("advance"))

        if data.get("second") is not None:
            payment.second = float(data.get("second"))

        if data.get("third") is not None:
            payment.third = float(data.get("third"))

        if data.get("comments") is not None:
            payment.comments = data.get("comments")

        customer_id = payment.customer_id

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

        # FILES
        files = request.files.getlist("files")
        final_images = payment.payment_proofs if isinstance(payment.payment_proofs, list) else []

        existing_images_param = data.get("existing_images")
        if existing_images_param:
            try:
                final_images = json.loads(existing_images_param)
                if not isinstance(final_images, list):
                    final_images = []
            except Exception as e:
                print(f"Error parsing existing_images: {e}")
                final_images = []

        for file in files:
            if file and file.filename:
                path = save_payment_file(file, Customer.query.get(customer_id).name)
                if path:
                    final_images.append(path)

        deleted_images = data.get("deleted_images")
        if deleted_images:
            try:
                deleted_list = json.loads(deleted_images)
                if isinstance(deleted_list, list):
                    final_images = [img for img in final_images if img not in deleted_list]
                    for img in deleted_list:
                        delete_file(img)
            except Exception as e:
                print(f"Error parsing deleted_images: {e}")

        payment.payment_proofs = final_images

        db.session.commit()

        # Ensure it's serialized as list
        proofs = payment.payment_proofs if isinstance(payment.payment_proofs, list) else []

        return jsonify({
            "message": "Payment updated successfully",
            "payment": {
                "id": payment.id,
                "customer_id": payment.customer_id,
                "advance": payment.advance,
                "second": payment.second,
                "third": payment.third,
                "total_received": payment.total_received,
                "balance_due": payment.balance_due,
                "comments": payment.comments,
                "images": proofs
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error updating payment: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# =========================
# GET PAYMENT (FIXED)
# =========================
@payment_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_payment(id):
    try:
        payment = Payment.query.get(id)
        if not payment:
            return jsonify({"error": "Payment not found"}), 404

        payment_proofs = payment.payment_proofs if isinstance(payment.payment_proofs, list) else []

        return jsonify({
            "id": payment.id,
            "customer_id": payment.customer_id,
            "advance": float(payment.advance or 0),
            "second": float(payment.second or 0),
            "third": float(payment.third or 0),
            "total_received": float(payment.total_received or 0),
            "balance_due": float(payment.balance_due or 0),
            "comments": payment.comments or "",
            "images": payment_proofs
        }), 200

    except Exception as e:
        print(f"Error retrieving payment: {e}")
        return jsonify({"error": f"Failed to retrieve payment: {str(e)}"}), 500


# =========================
# DELETE PAYMENT
# =========================
@payment_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_payment(id):
    try:
        payment = Payment.query.get_or_404(id)

        db.session.delete(payment)
        db.session.commit()

        return jsonify({"message": "Deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500