from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Service, Customer
from werkzeug.utils import secure_filename
from datetime import datetime
import os
import uuid
import json


# =========================
# BLUEPRINT
# =========================
service_bp = Blueprint(
    "service_bp",
    __name__,
    url_prefix="/api/services/"
)


# =========================
# CONFIG
# =========================
UPLOAD_FOLDER = "backend/static/uploads/services"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# =========================
# DELETE FILE HELPER
# =========================
def delete_file(file_path):
    if not file_path:
        return
    try:
        full_path = file_path.replace("/backend/static/", "backend/static/")
        if os.path.exists(full_path):
            os.remove(full_path)
    except Exception as e:
        print("File delete error:", e)


# =========================
# FILE UPLOAD HELPER
# =========================
def save_file(file, folder, customer_name="file"):
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


# =========================
# CREATE SERVICE
# =========================
@service_bp.route("/<int:project_id>", methods=["POST"])
@jwt_required()
def create_service(project_id):
    try:
        customer = Customer.query.get(project_id)
        if not customer:
            return jsonify({"error": "Customer not found"}), 404

        date = request.form.get("date")
        comments = request.form.get("comments")

        # ✅ DEBUG PRINT (REMOVE LATER)
        print("DATE:", date)

        # ✅ FIX DATE ERROR
        if not date:
            return jsonify({"error": "Date is required"}), 400

        from datetime import datetime
        try:
            service_date = datetime.strptime(date, "%Y-%m-%d")
        except:
            return jsonify({"error": "Invalid date format"}), 400

        files = request.files.getlist("images")
        image_paths = []

        for file in files:
            path = save_file(file, "services", customer.name)
            if path:
                image_paths.append(path)

        service = Service(
            project_id=project_id,
            service_date=service_date,
            images=json.dumps(image_paths),
            comments=comments
        )

        db.session.add(service)
        db.session.commit()

        return jsonify({"message": "Service created successfully"}), 201

    except Exception as e:
        print("ERROR:", e)  
        return jsonify({"error": str(e)}), 500


# =========================
# UPDATE SERVICE
# =========================
@service_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_service(id):
    try:
        service = Service.query.get_or_404(id)

        date = request.form.get("date")
        comments = request.form.get("comments")

        # ✅ DATE UPDATE
        if date:
            service.service_date = datetime.strptime(date, "%Y-%m-%d")

        if comments:
            service.comments = comments

        # ✅ EXISTING IMAGES FROM FRONTEND
        existing_images = json.loads(request.form.get("existingImages", "[]"))

        # ✅ REMOVE DELETED IMAGES
        old_images = json.loads(service.images) if service.images else []
        for img in old_images:
            if img not in existing_images:
                delete_file(img)

        # ✅ ADD NEW IMAGES
        customer = Customer.query.get(service.project_id)
        files = request.files.getlist("images")

        for file in files:
            path = save_file(file, "services", customer.name)
            if path:
                existing_images.append(path)

        service.images = json.dumps(existing_images)

        db.session.commit()

        return jsonify({"message": "Service updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# =========================
# DELETE SERVICE
# =========================
@service_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_service(id):
    try:
        service = Service.query.get_or_404(id)

        # ✅ DELETE ALL IMAGES
        if service.images:
            image_paths = json.loads(service.images)
            for img in image_paths:
                delete_file(img)

        db.session.delete(service)
        db.session.commit()

        return jsonify({"message": "Service deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# =========================
# GET ALL SERVICES
# =========================
@service_bp.route("/project/<int:project_id>", methods=["GET"])
@jwt_required()
def get_services(project_id):
    try:
        services = Service.query.filter_by(project_id=project_id)\
            .order_by(Service.id.desc()).all()

        service_list = []

        for s in services:
            service_list.append({
                "id": s.id,
                "date": str(s.service_date),  # ✅ FRONTEND MATCH
                "comments": s.comments,
                "images": json.loads(s.images) if s.images else []
            })

        return jsonify(service_list), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500