from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Installation, Customer
from werkzeug.utils import secure_filename
import os
import uuid
import json
from datetime import datetime


# =========================
# BLUEPRINT
installation_bp = Blueprint(
    "installation_bp",
    __name__,
    url_prefix="/api/installations"
)

# =========================
# Config
UPLOAD_BASE = "backend/static/uploads/installations"
os.makedirs(UPLOAD_BASE, exist_ok=True)


# =========================
# FILE UPLOAD HELPER
# =========================
def save_file(file, folder="installations", customer_name="file"):
    """Save uploaded file and return relative path"""
    if not file:
        return None

    base_path = os.path.join("backend/static/uploads", folder)
    os.makedirs(base_path, exist_ok=True)

    filename = secure_filename(file.filename)
    safe_name = str(customer_name).lower().replace(" ", "_")
    unique_name = f"{safe_name}_{folder}_{uuid.uuid4().hex[:6]}.{filename.split('.')[-1]}"
    
    full_path = os.path.join(base_path, unique_name)
    file.save(full_path)
    
    return f"/backend/static/uploads/{folder}/{unique_name}"


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
# CREATE / UPDATE (SINGLE API)
@installation_bp.route("/<int:customer_id>", methods=["POST"])
@jwt_required()
def create_or_update_installation(customer_id):
    try:
        customer = Customer.query.get(customer_id)
        if not customer:
            return jsonify({"error": "Customer not found"}), 404

        # Check if installation exists
        installation = Installation.query.filter_by(customer_id=customer_id).first()

        electrical_installed = request.form.get("electrical_installed", "false").lower() == "true"
        electrical_comments = request.form.get("electrical_comments", "")
        structure_installed = request.form.get("structure_installed", "false").lower() == "true"
        structure_comments = request.form.get("structure_comments", "")

        # Get existing images from frontend (JSON array as string)
        existing_images = json.loads(request.form.get("existingImages", "[]"))
        
        # Get newly uploaded files
        new_files = request.files.getlist("geo_images")
        
        # Prepare image paths list
        image_paths = existing_images.copy() if existing_images else []
        
        # Add new files
        for file in new_files:
            if file:
                path = save_file(file, "installations", customer.name)
                if path:
                    image_paths.append(path)

        if installation:
            # UPDATE existing record
            # Delete removed images
            old_images = installation.geo_images or []
            for img in old_images:
                if img not in image_paths:
                    delete_file(img)
            
            installation.electrical_installed = electrical_installed
            installation.electrical_comments = electrical_comments
            installation.structure_installed = structure_installed
            installation.structure_comments = structure_comments
            installation.geo_images = image_paths
            installation.updated_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                "id": installation.id,
                "customer_id": installation.customer_id,
                "electrical_installed": installation.electrical_installed,
                "electrical_comments": installation.electrical_comments,
                "structure_installed": installation.structure_installed,
                "structure_comments": installation.structure_comments,
                "geo_images": installation.geo_images or [],
                "created_at": installation.created_at.isoformat() if installation.created_at else None,
                "updated_at": installation.updated_at.isoformat() if installation.updated_at else None
            }), 200
        else:
            # CREATE new record
            new_installation = Installation(
                customer_id=customer_id,
                electrical_installed=electrical_installed,
                electrical_comments=electrical_comments,
                structure_installed=structure_installed,
                structure_comments=structure_comments,
                geo_images=image_paths
            )
            db.session.add(new_installation)
            db.session.commit()
            
            return jsonify({
                "id": new_installation.id,
                "customer_id": new_installation.customer_id,
                "electrical_installed": new_installation.electrical_installed,
                "electrical_comments": new_installation.electrical_comments,
                "structure_installed": new_installation.structure_installed,
                "structure_comments": new_installation.structure_comments,
                "geo_images": new_installation.geo_images or [],
                "created_at": new_installation.created_at.isoformat() if new_installation.created_at else None,
                "updated_at": new_installation.updated_at.isoformat() if new_installation.updated_at else None
            }), 201

    except Exception as e:
        print(f"Error in create_or_update_installation: {e}")
        return jsonify({"error": str(e)}), 500


# =========================
# GET (SINGLE)
@installation_bp.route("/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_installation(customer_id):
    try:
        installation = Installation.query.filter_by(customer_id=customer_id).first()
        if not installation:
            return jsonify({"error": "Installation record not found"}), 404

        return jsonify({
            "id": installation.id,
            "customer_id": installation.customer_id,
            "electrical_installed": installation.electrical_installed,
            "electrical_comments": installation.electrical_comments,
            "structure_installed": installation.structure_installed,
            "structure_comments": installation.structure_comments,
            "geo_images": installation.geo_images or [],
            "created_at": installation.created_at.isoformat() if installation.created_at else None,
            "updated_at": installation.updated_at.isoformat() if installation.updated_at else None
        }), 200

    except Exception as e:
        print(f"Error in get_installation: {e}")
        return jsonify({"error": str(e)}), 500


# =========================
# DELETE
@installation_bp.route("/<int:customer_id>", methods=["DELETE"])
@jwt_required()
def delete_installation(customer_id):
    try:
        installation = Installation.query.filter_by(customer_id=customer_id).first()
        if not installation:
            return jsonify({"error": "Installation record not found"}), 404

        # Delete all associated files
        if installation.geo_images:
            for img_path in installation.geo_images:
                delete_file(img_path)

        db.session.delete(installation)
        db.session.commit()
        return jsonify({"message": "Installation record deleted successfully"}), 200

    except Exception as e:
        print(f"Error in delete_installation: {e}")
        return jsonify({"error": str(e)}), 500
