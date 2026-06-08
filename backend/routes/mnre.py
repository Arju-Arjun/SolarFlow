from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Mnre, Customer, MnreInstallation
from werkzeug.utils import secure_filename
import os
from datetime import datetime
import uuid
import pytz

# =========================
# BLUEPRINT
# =========================
mnre_bp = Blueprint(
    "mnre_bp",
    __name__,
    url_prefix="/api/mnre"
)

# =========================
# CONFIG
# =========================
UPLOAD_BASE = "backend/static/uploads"
FEASIBILITY_FOLDER = os.path.join(UPLOAD_BASE, "feasibility_folder")
ACK_FOLDER = os.path.join(UPLOAD_BASE, "ack_folder")

os.makedirs(FEASIBILITY_FOLDER, exist_ok=True)
os.makedirs(ACK_FOLDER, exist_ok=True)

# =========================
# HELPER FUNCTIONS
# =========================
def save_file(file, customer_name, file_type, folder):
    ext = file.filename.split(".")[-1]
    short_uuid = uuid.uuid4().hex[:3]
    filename = f"{customer_name}_{file_type}_{short_uuid}.{ext}"
    filename = secure_filename(filename)

    filepath = os.path.join(folder, filename)
    file.save(filepath)

    return f"/{folder}/{filename}"


def delete_file(filepath):
    if filepath:
        full_path = filepath.lstrip("/")
        if os.path.exists(full_path):
            os.remove(full_path)

# =========================
# CREATE MNRE/ update MNRE
# =========================
@mnre_bp.route("/<int:customer_id>", methods=["POST", "PUT"])
@jwt_required()
def save_mnre_entry(customer_id):

    data = request.form

    mnre_entry = Mnre.query.filter_by(customer_id=customer_id).first()

    customer = Customer.query.get(customer_id)
    customer_name = customer.name if customer else "customer"

    ist = pytz.timezone("Asia/Kolkata")
    now = datetime.now(ist)

    # 🔥 CHECK ENABLED FIRST
    enabled = data.get("enabled", "true").lower() == "true"

    # 🔥 DELETE if disabled
    if not enabled:

        if mnre_entry:
            print("DELETING MNRE:", customer_id)

            delete_file(mnre_entry.feasibility_file)
            delete_file(mnre_entry.ack_file)

            db.session.delete(mnre_entry)
            db.session.commit()

        return jsonify({"message": "MNRE deleted"}), 200

    # 🔥 CREATE if not exists
    if not mnre_entry:
        mnre_entry = Mnre(
            customer_id=customer_id,
            created_at=now
        )
        db.session.add(mnre_entry)

    # 🔥 UPDATE fields
    mnre_entry.enabled = enabled
    mnre_entry.mnre_status = data.get("mnre_status")
    mnre_entry.comments = data.get("comments")

    # ===== FEASIBILITY =====
    if "feasibility_file" in request.files:
        file = request.files["feasibility_file"]

        if file and file.filename:
            delete_file(mnre_entry.feasibility_file)

            mnre_entry.feasibility_file = save_file(
                file,
                customer_name,
                "feasibility",
                FEASIBILITY_FOLDER
            )

    # ===== ACK =====
    if "ack_file" in request.files:
        file = request.files["ack_file"]

        if file and file.filename:
            delete_file(mnre_entry.ack_file)

            mnre_entry.ack_file = save_file(
                file,
                customer_name,
                "ack",
                ACK_FOLDER
            )

    mnre_entry.updated_at = now

    db.session.commit()

    return jsonify(mnre_entry.to_dict()), 200


# =========================
# GET MNRE
# =========================
@mnre_bp.route("/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_mnre_entry(customer_id):
    mnre_entry = Mnre.query.filter_by(customer_id=customer_id).first()

    if not mnre_entry:
        return jsonify({
            "exists": False,
            "data": None
        }), 200

    return jsonify({
        "exists": True,
        "data": mnre_entry.to_dict()
    }), 200

# =========================
# DELETE MNRE
# =========================
@mnre_bp.route("/<int:customer_id>", methods=["DELETE"])
@jwt_required()
def delete_mnre_entry(customer_id):
    mnre_entry = Mnre.query.filter_by(customer_id=customer_id).first()

    if not mnre_entry:
        print("\n\n\n\n\32222222222")
        return jsonify({"error": "MNRE entry not found"}), 404

    delete_file(mnre_entry.feasibility_file)
    delete_file(mnre_entry.ack_file)

    db.session.delete(mnre_entry)
    db.session.commit()

    return jsonify({"message": "MNRE entry deleted successfully"})


# =========================
# MNRE INSTALLATION DETAILS
# =========================

@mnre_bp.route("/installation/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_mnre_installation(customer_id):
    """Fetch MNRE Installation details for a customer"""
    installation = MnreInstallation.query.filter_by(customer_id=customer_id).first()
    
    if not installation:
        return jsonify({"error": "MNRE Installation record not found"}), 404
    
    return jsonify(installation.to_dict()), 200


@mnre_bp.route("/installation/<int:customer_id>", methods=["POST"])
@jwt_required()
def create_mnre_installation(customer_id):
    """Create MNRE Installation details for a customer"""
    customer = Customer.query.get(customer_id)
    
    if not customer:
        return jsonify({"error": "Customer not found"}), 404
    
    # Check if already exists
    existing = MnreInstallation.query.filter_by(customer_id=customer_id).first()
    if existing:
        return jsonify({"error": "MNRE Installation record already exists"}), 400
    
    data = request.get_json()
    
    ist = pytz.timezone("Asia/Kolkata")
    created_at = datetime.now(ist)
    
    installation = MnreInstallation(
        customer_id=customer_id,
        installation_status=data.get("installation_status"),
        installation_comments=data.get("installation_comments"),
        approval_status=data.get("approval_status"),
        approval_comments=data.get("approval_comments"),
        subsidy_status=data.get("subsidy_status"),
        subsidy_comments=data.get("subsidy_comments"),
        created_at=created_at,
        updated_at=created_at
    )
    
    db.session.add(installation)
    db.session.commit()
    
    return jsonify(installation.to_dict()), 201


@mnre_bp.route("/installation/<int:customer_id>", methods=["PUT"])
@jwt_required()
def update_mnre_installation(customer_id):
    """Update MNRE Installation details for a customer"""
    installation = MnreInstallation.query.filter_by(customer_id=customer_id).first()
    
    if not installation:
        return jsonify({"error": "MNRE Installation record not found"}), 404
    
    data = request.get_json()
    
    # Update fields
    installation.installation_status = data.get("installation_status", installation.installation_status)
    installation.installation_comments = data.get("installation_comments", installation.installation_comments)
    installation.approval_status = data.get("approval_status", installation.approval_status)
    installation.approval_comments = data.get("approval_comments", installation.approval_comments)
    installation.subsidy_status = data.get("subsidy_status", installation.subsidy_status)
    installation.subsidy_comments = data.get("subsidy_comments", installation.subsidy_comments)
    installation.updated_at = datetime.now(pytz.timezone("Asia/Kolkata"))
    
    db.session.commit()
    
    return jsonify(installation.to_dict()), 200


@mnre_bp.route("/installation/<int:customer_id>", methods=["DELETE"])
@jwt_required()
def delete_mnre_installation(customer_id):
    """Delete MNRE Installation details for a customer"""
    installation = MnreInstallation.query.filter_by(customer_id=customer_id).first()
    
    if not installation:
        return jsonify({"error": "MNRE Installation record not found"}), 404
    
    db.session.delete(installation)
    db.session.commit()
    
    return jsonify({"message": "MNRE Installation record deleted successfully"}), 200