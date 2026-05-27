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
# SAVE FILE FUNCTION
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


def delete_file(filepath):
    """Delete file from filesystem"""
    if filepath:
        full_path = filepath.replace("/backend/", "backend/")
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
            except Exception as e:
                print(f"Error deleting file: {e}")


# =========================
# CREATE PAYMENT
# =========================
@payment_bp.route("/<int:customer_id>", methods=["POST"])
@jwt_required()
def create_payment(customer_id):
    try:
        existing = Payment.query.filter_by(customer_id=customer_id).first()
        if existing:
            return jsonify({"error": "Payment already exists. Use PUT to update."}), 400

        customer = Customer.query.get(customer_id)
        if not customer:
            return jsonify({"error": "Customer not found"}), 404

        data = request.form

        # ================= CALCULATIONS =================
        advance = float(data.get("advance", 0))
        second = float(data.get("second", 0))
        third = float(data.get("third", 0))

        loan_amount = 0
        loan = Loan.query.filter_by(customer_id=customer_id).first()
        if loan:
            loan_amount = float(loan.total_loan_amount or 0)

        total_received = advance + second + third + loan_amount

        project_cost = 0
        site_visit = SiteVisit.query.filter_by(customer_id=customer_id).first()
        if site_visit:
            project_cost = float(site_visit.project_cost or 0)

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

        # ================= FILE UPLOAD =================
        files = request.files.getlist("files")
        file_paths = []

        for file in files:
            if file and file.filename:
                path = save_payment_file(file, customer.name)
                if path:
                    file_paths.append(path)

        if file_paths:
            payment.payment_proofs = file_paths
            db.session.commit()

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
                "images": payment.payment_proofs or []
            }
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================
# UPDATE PAYMENT
# =========================
@payment_bp.route("/<int:customer_id>", methods=["PUT"])
@jwt_required()
def update_payment(customer_id):
    try:
        data = request.form

        payment = Payment.query.filter_by(customer_id=customer_id).first()
        if not payment:
            return jsonify({"error": "Payment not found"}), 404

        # ================= UPDATE FIELDS =================
        if data.get("advance") is not None:
            payment.advance = float(data.get("advance"))

        if data.get("second") is not None:
            payment.second = float(data.get("second"))

        if data.get("third") is not None:
            payment.third = float(data.get("third"))

        if data.get("comments") is not None:
            payment.comments = data.get("comments")

        customer = Customer.query.get(customer_id)

        # ================= RECALCULATE TOTAL =================
        advance = float(payment.advance or 0)
        second = float(payment.second or 0)
        third = float(payment.third or 0)

        loan_amount = 0
        loan = Loan.query.filter_by(customer_id=customer_id).first()
        if loan:
            loan_amount = float(loan.total_loan_amount or 0)

        payment.total_received = advance + second + third + loan_amount

        project_cost = 0
        site_visit = SiteVisit.query.filter_by(customer_id=customer_id).first()
        if site_visit:
            project_cost = float(site_visit.project_cost or 0)

        payment.balance_due = project_cost - payment.total_received

        # ================= IMAGE HANDLING =================
        files = request.files.getlist("files")
        print("Received files:", files)

        # Start with DB images
        final_images = payment.payment_proofs or []

        # 1️⃣ Sync existing images from frontend
        existing_images_param = data.get("existing_images")

        if existing_images_param:
            try:
                final_images = json.loads(existing_images_param)
            except:
                final_images = payment.payment_proofs or []

        # 2️⃣ Add new uploaded images
        for file in files:
            if file and file.filename:
                path = save_payment_file(file, customer.name)
                if path:
                    final_images.append(path)

        # 3️⃣ Remove deleted images
        deleted_images = data.get("deleted_images")

        if deleted_images:
            try:
                deleted_list = json.loads(deleted_images)
                final_images = [
                    img for img in final_images
                    if img not in deleted_list
                ]
            except:
                pass

        # ================= SAVE FINAL IMAGES =================
        payment.payment_proofs = final_images

        db.session.commit()

        # ================= DELETE FILES FROM SERVER =================
        if deleted_images:
            try:
                deleted_list = json.loads(deleted_images)

                for img_path in deleted_list:
                    print("Deleting file:", img_path)
                    delete_file(img_path)

            except:
                pass

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
                "images": payment.payment_proofs or []
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================
# GET PAYMENT
# =========================
@payment_bp.route("/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_payment(customer_id):
    try:
        payment = Payment.query.filter_by(customer_id=customer_id).first()

        if not payment:
            return jsonify({"error": "No payment found"}), 404

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