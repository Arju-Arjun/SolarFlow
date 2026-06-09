import pytz
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Mnre, Customer, MnreInstallation
# Imported delete utility alongside your upload tool
from utils import upload_to_cloud, delete_from_cloudinary

mnre_bp = Blueprint("mnre_bp", __name__, url_prefix="/api/mnre")

@mnre_bp.route("/<int:customer_id>", methods=["POST", "PUT"])
@jwt_required()
def save_mnre_entry(customer_id):
    data = request.form
    mnre_entry = Mnre.query.filter_by(customer_id=customer_id).first()

    ist = pytz.timezone("Asia/Kolkata")
    now = datetime.now(ist)

    enabled = data.get("enabled", "true").lower() == "true"

    if not enabled:
        if mnre_entry:
            # Clean up files from storage if row is dropped via toggle switch
            if mnre_entry.feasibility_file:
                delete_from_cloudinary(mnre_entry.feasibility_file)
            if mnre_entry.ack_file:
                delete_from_cloudinary(mnre_entry.ack_file)
                
            db.session.delete(mnre_entry)
            db.session.commit()
        return jsonify({"message": "MNRE deleted"}), 200

    if not mnre_entry:
        mnre_entry = Mnre(customer_id=customer_id, created_at=now)
        db.session.add(mnre_entry)

    mnre_entry.enabled = enabled
    mnre_entry.mnre_status = data.get("mnre_status")
    mnre_entry.comments = data.get("comments")

    if "feasibility_file" in request.files:
        file = request.files["feasibility_file"]
        if file and file.filename:
            # 1. Purge the existing file asset from Cloudinary storage if present
            if mnre_entry.feasibility_file:
                delete_from_cloudinary(mnre_entry.feasibility_file)
            
            # 2. Upload incoming replacement document safely
            cloud_url = upload_to_cloud(file, folder_name="solar_flow/mnre/feasibility")
            if cloud_url:
                mnre_entry.feasibility_file = cloud_url

    if "ack_file" in request.files:
        file = request.files["ack_file"]
        if file and file.filename:
            # 1. Purge the existing acknowledgment file asset from storage
            if mnre_entry.ack_file:
                delete_from_cloudinary(mnre_entry.ack_file)
                
            # 2. Upload incoming replacement acknowledgment file safely
            cloud_url = upload_to_cloud(file, folder_name="solar_flow/mnre/acknowledgments")
            if cloud_url:
                mnre_entry.ack_file = cloud_url

    mnre_entry.updated_at = now
    db.session.commit()
    return jsonify(mnre_entry.to_dict()), 200

@mnre_bp.route("/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_mnre_entry(customer_id):
    mnre_entry = Mnre.query.filter_by(customer_id=customer_id).first()
    if not mnre_entry:
        return jsonify({"exists": False, "data": None}), 200
    return jsonify({"exists": True, "data": mnre_entry.to_dict()}), 200

@mnre_bp.route("/<int:customer_id>", methods=["DELETE"])
@jwt_required()
def delete_mnre_entry(customer_id):
    mnre_entry = Mnre.query.filter_by(customer_id=customer_id).first()
    if not mnre_entry:
        return jsonify({"error": "MNRE entry not found"}), 404

    # Purge all assigned documentation files from cloud storage on row destruction
    if mnre_entry.feasibility_file:
        delete_from_cloudinary(mnre_entry.feasibility_file)
    if mnre_entry.ack_file:
        delete_from_cloudinary(mnre_entry.ack_file)

    db.session.delete(mnre_entry)
    db.session.commit()
    return jsonify({"message": "MNRE entry deleted successfully"}), 200

@mnre_bp.route("/installation/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_mnre_installation(customer_id):
    installation = MnreInstallation.query.filter_by(customer_id=customer_id).first()
    if not installation:
        return jsonify({"error": "MNRE Installation record not found"}), 404
    return jsonify(installation.to_dict()), 200

@mnre_bp.route("/installation/<int:customer_id>", methods=["POST"])
@jwt_required()
def create_mnre_installation(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404
    
    existing = MnreInstallation.query.filter_by(customer_id=customer_id).first()
    if existing:
        return jsonify({"error": "MNRE Installation record already exists"}), 400
    
    data = request.get_json() or {}
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
        created_at=created_at, updated_at=created_at
    )
    db.session.add(installation)
    db.session.commit()
    return jsonify(installation.to_dict()), 201

@mnre_bp.route("/installation/<int:customer_id>", methods=["PUT"])
@jwt_required()
def update_mnre_installation(customer_id):
    installation = MnreInstallation.query.filter_by(customer_id=customer_id).first()
    if not installation:
        return jsonify({"error": "MNRE Installation record not found"}), 404
    
    data = request.get_json() or {}
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
    installation = MnreInstallation.query.filter_by(customer_id=customer_id).first()
    if not installation:
        return jsonify({"error": "MNRE Installation record not found"}), 404
    
    db.session.delete(installation)
    db.session.commit()
    return jsonify({"message": "MNRE Installation record deleted successfully"}), 200