from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import SiteVisit,Customer
from werkzeug.utils import secure_filename
import os
import uuid
import json

# =========================
# BLUEPRINT
# =========================
site_visit_bp = Blueprint(
    "site_visit_bp",
    __name__,
    url_prefix="/api/site-visits"
)

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
# FILE UPLOAD HELPER (UPDATED)
# =========================
def save_file(file, folder, customer_name="file"):
    if not file:
        return None

    base_path = os.path.join("backend/static/uploads", folder)
    os.makedirs(base_path, exist_ok=True)
    filename = secure_filename(file.filename)
    

    safe_name = str(customer_name).lower().replace(" ", "_")

    unique_name = f"{safe_name}_{folder}_{uuid.uuid4().hex[:3]}.{filename.split('.')[-1]}"

    full_path = os.path.join(base_path, unique_name)
    file.save(full_path)

    return f"/backend/static/uploads/{folder}/{unique_name}"

# =========================
# VALIDATE FILE TYPE
# =========================
def validate_file_type(filename, allowed_extensions=None):
    if allowed_extensions is None:
        allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf']
    
    if filename:
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        return ext in allowed_extensions
    return True

# =========================
# GET SITE VISIT BY ID
# =========================
@site_visit_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_site_visit(id):
    try:
        site = SiteVisit.query.get(id)
        if not site:
            return jsonify({"error": "Site visit not found"}), 404

        return jsonify({
            "id": site.id,
            "customer_id": site.customer_id,
            "user_id": site.user_id,
            "panel_capacity": site.panel_capacity,
            "system_capacity": site.system_capacity,
            "feasibility": site.feasibility,
            "comments": site.comments,
            "project_cost": site.project_cost,
            "location": site.location,
            "quotation_file": site.quotation_file,
            "agreement_file": site.agreement_file,
            "aadhaar": site.aadhaar,
            "pan": site.pan,
            "kseb_bill": site.kseb_bill,
            "bank_passbook": site.bank_passbook,
            "land_tax": site.land_tax,
            "building_tax": site.building_tax,
            "signature": site.signature,
            "load_enhancement": site.load_enhancement,
            "ownership_change": site.ownership_change,
            "images": json.loads(site.images) if site.images else [],
            "created_at": site.created_at.isoformat() if site.created_at else None
        }), 200
    except Exception as e:
        print(f"Error retrieving site visit: {e}")
        return jsonify({"error": "Failed to retrieve site visit"}), 500
# =========================
# CREATE SITE VISIT
# =========================
@site_visit_bp.route("/", methods=["POST"])
@jwt_required()
def create_or_get_site_visit():
    try:
        user_id = int(get_jwt_identity())
        customer_id = request.form.get("customer_id")

        if not customer_id:
            return jsonify({"error": "customer_id is required"}), 400

        customer_id = int(customer_id)

        existing = SiteVisit.query.filter_by(customer_id=customer_id).first()
        
        if existing:
            return jsonify({
                "message": "Site visit already exists for this customer",
                "id": existing.id,
                "exists": True
            }), 200

        site = SiteVisit(
            customer_id=customer_id,
            user_id=user_id,

            panel_capacity=request.form.get("panel_capacity"),
            system_capacity=request.form.get("system_capacity"),
            feasibility=request.form.get("feasibility"),
            comments=request.form.get("comments"),
            project_cost=request.form.get("project_cost"),
            location=request.form.get("location"),

            load_enhancement=request.form.get("load_enhancement"),
            ownership_change=request.form.get("ownership_change")
        )

        # name = str(customer_id)
        name=Customer.query.get(customer_id).name if Customer.query.get(customer_id) else str(customer_id)
        site.quotation_file = save_file(request.files.get("quotation_file"), "quotation", name)
        site.agreement_file = save_file(request.files.get("agreement_file"), "agreement", name)

        site.aadhaar = save_file(request.files.get("aadhaar"), "aadhaar", name)
        site.pan = save_file(request.files.get("pan"), "pan", name)
        site.kseb_bill = save_file(request.files.get("kseb_bill"), "kseb_bill", name)
        site.bank_passbook = save_file(request.files.get("bank_passbook"), "bank_passbook", name)
        site.land_tax = save_file(request.files.get("land_tax"), "land_tax", name)
        site.building_tax = save_file(request.files.get("building_tax"), "building_tax", name)
        site.signature = save_file(request.files.get("signature"), "signature", name)

        images = request.files.getlist("images")
        image_list = []

        for img in images:
            path = save_file(img, "images", name)
            if path:
                image_list.append(path)

        site.images = json.dumps(image_list)

        db.session.add(site)
        db.session.commit()

        return jsonify({
            "message": "Site visit created successfully",
            "id": site.id,
            "exists": False
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# =========================
# UPDATE SITE VISIT
# =========================
@site_visit_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_site_visit(id):
    try:
        d = SiteVisit.query.get_or_404(id)
        deleted_images = request.form.get("deleted_images")

        if deleted_images:
            deleted_images = json.loads(deleted_images)
        else:
            deleted_images = []

        for img in deleted_images:
            try:
                delete_file(img)
            except Exception as e:
                print("Delete error:", e)

        # TEXT FIELDS
        d.panel_capacity = request.form.get("panel_capacity", d.panel_capacity)
        d.system_capacity = request.form.get("system_capacity", d.system_capacity)
        d.feasibility = request.form.get("feasibility", d.feasibility)
        d.comments = request.form.get("comments", d.comments)
        d.project_cost = request.form.get("project_cost", d.project_cost)
        d.load_enhancement = request.form.get("load_enhancement", d.load_enhancement)
        d.ownership_change = request.form.get("ownership_change", d.ownership_change)

        customer = d.customer_id

        # FILES (REPLACE + DELETE OLD)
        def update_file(field, folder):
            file = request.files.get(field)
            if file:
                delete_file(getattr(d, field))
                setattr(d, field, save_file(file, folder, str(customer)))

        d.location = request.form.get("location", d.location)
        update_file("quotation_file", "quotation")
        update_file("agreement_file", "agreement")

        # DOCUMENTS
        update_file("aadhaar", "aadhaar")
        update_file("pan", "pan")
        update_file("kseb_bill", "kseb_bill")
        update_file("bank_passbook", "bank_passbook")
        update_file("land_tax", "land_tax")
        update_file("building_tax", "building_tax")
        update_file("signature", "signature")

        # IMAGES
        existing_images_param = request.form.get("existing_images")

        if existing_images_param:
            # User explicitly provided image list - sync with DB
            old_images = json.loads(d.images) if d.images else []
            new_list = json.loads(existing_images_param)

            # Delete files that were removed
            for img in old_images:
                if img not in new_list:
                    delete_file(img)

            d.images = json.dumps(new_list)
        # else: existing_images_param not sent - preserve current images

        new_images = request.files.getlist("images")

        if new_images:
            current_images = json.loads(d.images) if d.images else []

            for img in new_images:
                path = save_file(img, "images", str(customer))
                if path:
                    current_images.append(path)

            d.images = json.dumps(current_images)

        db.session.commit()

        return jsonify({
            "message": "Site visit updated successfully",
            "id": d.id
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# =========================
# DELETE SITE VISIT
# =========================
@site_visit_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_site_visit(id):
    d = SiteVisit.query.get_or_404(id)

    db.session.delete(d)
    db.session.commit()

    return jsonify({"message": "Deleted successfully"})