from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import SiteVisit, Customer
from utils import upload_to_cloud
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
# GET SITE VISIT BY CUSTOMER ID
# =========================
@site_visit_bp.route("/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_site_visit_by_customer(customer_id):
    """Fetch site visit by customer ID"""
    try:
        site = SiteVisit.query.filter_by(customer_id=customer_id).first()
        if not site:
            return jsonify({"error": "Site visit not found for this customer"}), 404

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
        print(f"Error retrieving site visit by customer_id: {e}")
        return jsonify({"error": f"Failed to retrieve site visit: {str(e)}"}), 500


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

        # Upload specific documents straight to Cloudinary fields
        def upload_field_file(field_name, target_folder):
            target_file = request.files.get(field_name)
            if target_file and target_file.filename:
                return upload_to_cloud(target_file, folder_name=f"solar_flow/site_visits/{target_folder}")
            return None

        site.quotation_file = upload_field_file("quotation_file", "quotations")
        site.agreement_file = upload_field_file("agreement_file", "agreements")
        site.aadhaar = upload_field_file("aadhaar", "aadhaar_docs")
        site.pan = upload_field_file("pan", "pan_docs")
        site.kseb_bill = upload_field_file("kseb_bill", "utility_bills")
        site.bank_passbook = upload_field_file("bank_passbook", "bank_details")
        site.land_tax = upload_field_file("land_tax", "tax_records")
        site.building_tax = upload_field_file("building_tax", "property_records")
        site.signature = upload_field_file("signature", "signatures")

        # Handling multiple generic site layout visual images
        images = request.files.getlist("images")
        image_list = []

        for img in images:
            if img and img.filename:
                path = upload_to_cloud(img, folder_name="solar_flow/site_visits/site_images")
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

        # Text Field Processing
        d.panel_capacity = request.form.get("panel_capacity", d.panel_capacity)
        d.system_capacity = request.form.get("system_capacity", d.system_capacity)
        d.feasibility = request.form.get("feasibility", d.feasibility)
        d.comments = request.form.get("comments", d.comments)
        d.project_cost = request.form.get("project_cost", d.project_cost)
        d.load_enhancement = request.form.get("load_enhancement", d.load_enhancement)
        d.ownership_change = request.form.get("ownership_change", d.ownership_change)
        d.location = request.form.get("location", d.location)

        # Dynamic upload wrapper bypassing local side effects
        def update_field_file(field_name, target_folder):
            file = request.files.get(field_name)
            if file and file.filename:
                cloud_url = upload_to_cloud(file, folder_name=f"solar_flow/site_visits/{target_folder}")
                if cloud_url:
                    setattr(d, field_name, cloud_url)

        update_field_file("quotation_file", "quotations")
        update_field_file("agreement_file", "agreements")
        update_field_file("aadhaar", "aadhaar_docs")
        update_field_file("pan", "pan_docs")
        update_field_file("kseb_bill", "utility_bills")
        update_field_file("bank_passbook", "bank_details")
        update_field_file("land_tax", "tax_records")
        update_field_file("building_tax", "property_records")
        update_field_file("signature", "signatures")

        # Multi-image structural asset synchronization
        existing_images_param = request.form.get("existing_images")
        if existing_images_param:
            new_list = json.loads(existing_images_param)
            d.images = json.dumps(new_list)

        new_images = request.files.getlist("images")
        if new_images:
            current_images = json.loads(d.images) if d.images else []
            for img in new_images:
                if img and img.filename:
                    path = upload_to_cloud(img, folder_name="solar_flow/site_visits/site_images")
                    if path:
                        current_images.append(path)
            d.images = json.dumps(current_images)

        db.session.commit()

        return jsonify({
            "message": "Site visit updated successfully",
            "id": d.id
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# =========================
# DELETE SITE VISIT
# =========================
@site_visit_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_site_visit(id):
    try:
        d = SiteVisit.query.get_or_404(id)
        db.session.delete(d)
        db.session.commit()
        return jsonify({"message": "Deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500