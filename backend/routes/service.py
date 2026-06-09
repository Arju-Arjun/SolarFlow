import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Service, Customer
from utils import upload_to_cloud, delete_to_cloud

service_bp = Blueprint("service_bp", __name__, url_prefix="/api/services")

# ==========================================
# CREATE SERVICE
# ==========================================
@service_bp.route("/<int:project_id>", methods=["POST"])
@jwt_required()
def create_service(project_id):
    try:
        customer = Customer.query.get(project_id)
        if not customer:
            return jsonify({"error": "Customer not found"}), 404

        date = request.form.get("date")
        comments = request.form.get("comments")

        if not date:
            return jsonify({"error": "Date is required"}), 400

        try:
            service_date = datetime.strptime(date, "%Y-%m-%d")
        except:
            return jsonify({"error": "Invalid date format"}), 400

        files = request.files.getlist("images")
        image_paths = []

        for file in files:
            if file and file.filename:
                cloud_url = upload_to_cloud(file, folder_name="solar_flow/services")
                if cloud_url:
                    image_paths.append(cloud_url)

        service = Service(
            project_id=project_id, service_date=service_date,
            images=json.dumps(image_paths), comments=comments
        )
        db.session.add(service)
        db.session.commit()
        return jsonify({"message": "Service created successfully"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
# UPDATE SERVICE
# ==========================================
@service_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_service(id):
    try:
        service = Service.query.get_or_404(id)
        date = request.form.get("date")
        comments = request.form.get("comments")

        if date:
            service.service_date = datetime.strptime(date, "%Y-%m-%d")
        if comments:
            service.comments = comments

        # Multi-image Structural Synchronization
        existing_images_param = request.form.get("existingImages")
        
        # 💡 FIX: Checked via 'is not None' to allow empty array ([]) transmission
        if existing_images_param is not None:
            new_list = json.loads(existing_images_param)
            old_images_list = json.loads(service.images) if service.images else []
            
           
            for old_url in old_images_list:
                if old_url not in new_list:
                    delete_to_cloud(old_url)
            
            service.images = json.dumps(new_list)

        # Uploading and appending new service images
        files = request.files.getlist("images")
        if files:
            current_images = json.loads(service.images) if service.images else []
            for file in files:
                if file and file.filename:
                    cloud_url = upload_to_cloud(file, folder_name="solar_flow/services")
                    if cloud_url:
                        current_images.append(cloud_url)
            service.images = json.dumps(current_images)

        db.session.commit()
        return jsonify({"message": "Service updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ==========================================
# DELETE SERVICE
# ==========================================
@service_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_service(id):
    try:
        service = Service.query.get_or_404(id)
        
        if service.images:
            image_urls = json.loads(service.images)
            for url in image_urls:
                delete_to_cloud(url)

        db.session.delete(service)
        db.session.commit()
        return jsonify({"message": "Service deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ==========================================
# GET SERVICES BY PROJECT ID
# ==========================================
@service_bp.route("/project/<int:project_id>", methods=["GET"])
@jwt_required()
def get_services(project_id):
    try:
        services = Service.query.filter_by(project_id=project_id).order_by(Service.id.desc()).all()
        service_list = []
        for s in services:
            service_list.append({
                "id": s.id, "date": str(s.service_date), "comments": s.comments,
                "images": json.loads(s.images) if s.images else []
            })
        return jsonify(service_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500