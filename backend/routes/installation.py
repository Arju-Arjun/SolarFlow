import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Installation, Customer
# Imported delete utility alongside your upload tool
from utils import upload_to_cloud, delete_from_cloudinary

installation_bp = Blueprint("installation_bp", __name__, url_prefix="/api/installations")

@installation_bp.route("/<int:customer_id>", methods=["POST"])
@jwt_required()
def create_or_update_installation(customer_id):
    try:
        customer = Customer.query.get(customer_id)
        if not customer:
            return jsonify({"error": "Customer not found"}), 404

        installation = Installation.query.filter_by(customer_id=customer_id).first()

        electrical_installed = request.form.get("electrical_installed", "false").lower() == "true"
        electrical_comments = request.form.get("electrical_comments", "")
        structure_installed = request.form.get("structure_installed", "false").lower() == "true"
        structure_comments = request.form.get("structure_comments", "")

        existing_images = json.loads(request.form.get("existingImages", "[]"))
        new_files = request.files.getlist("geo_images")
        image_paths = existing_images.copy() if existing_images else []
        
        # 1. Compare dataset and clear dropped assets from cloud storage if updating
        if installation and installation.geo_images:
            # Assuming installation.geo_images is already parsed or a list field type
            old_images = installation.geo_images if isinstance(installation.geo_images, list) else json.loads(installation.geo_images)
            for old_url in old_images:
                if old_url not in image_paths:
                    delete_from_cloudinary(old_url)
        
        # 2. Append newly uploaded images to tracking index array
        for file in new_files:
            if file and file.filename:
                cloud_url = upload_to_cloud(file, folder_name="solar_flow/installations")
                if cloud_url:
                    image_paths.append(cloud_url)

        if installation:
            installation.electrical_installed = electrical_installed
            installation.electrical_comments = electrical_comments
            installation.structure_installed = structure_installed
            installation.structure_comments = structure_comments
            installation.geo_images = image_paths
            installation.updated_at = datetime.utcnow()
        else:
            installation = Installation(
                customer_id=customer_id,
                electrical_installed=electrical_installed,
                electrical_comments=electrical_comments,
                structure_installed=structure_installed,
                structure_comments=structure_comments,
                geo_images=image_paths
            )
            db.session.add(installation)

        db.session.commit()
        return jsonify(installation.to_dict()), 200 if installation.id else 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@installation_bp.route("/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_installation(customer_id):
    try:
        installation = Installation.query.filter_by(customer_id=customer_id).first()
        if not installation:
            return jsonify({"error": "Installation record not found"}), 404
        return jsonify(installation.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@installation_bp.route("/<int:customer_id>", methods=["DELETE"])
@jwt_required()
def delete_installation(customer_id):
    try:
        installation = Installation.query.filter_by(customer_id=customer_id).first()
        if not installation:
            return jsonify({"error": "Installation record not found"}), 404

        # 1. Purge all geo_images associated with this dataset from Cloudinary hosting
        if installation.geo_images:
            image_urls = installation.geo_images if isinstance(installation.geo_images, list) else json.loads(installation.geo_images)
            for url in image_urls:
                delete_from_cloudinary(url)

        # 2. Clear row entry from database completely
        db.session.delete(installation)
        db.session.commit()
        return jsonify({"message": "Installation record deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500