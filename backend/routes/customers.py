import json
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import (
    Customer, SiteVisit, Mnre, Loan, Payment, Kseb,
    MaterialDelivery, Installation, KsebRegistration, Dcr,
    MnreInstallation, Service
)

from utils import upload_to_cloud, delete_to_cloud


DEFAULT_IMAGE = "https://kommodo.ai/i/KwK1jbRDvnZNthQanKSt"

customer_bp = Blueprint("customer_bp", __name__, url_prefix="/api/customers")

# ================= GET ALL CUSTOMERS =================
@customer_bp.route("/", methods=["GET"])
@jwt_required()
def get_customers():
    user_id = int(get_jwt_identity())
    customers = Customer.query.filter_by(user_id=user_id).all()
    return jsonify([c.to_dict() for c in customers]), 200

# ================= ADD CUSTOMER =================
@customer_bp.route("/", methods=["POST"])
@jwt_required()
def add_customer():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data:
        return jsonify({"message": "Invalid JSON data"}), 400

    name = str(data.get("name", "")).strip()
    place = str(data.get("place", "")).strip()
    mobile = str(data.get("mobile", "")).strip()
    capacity = data.get("capacity")

    if not name or not place or not mobile or capacity is None:
        return jsonify({"message": "All fields are required"}), 400

    try:
        capacity = int(capacity)
    except:
        return jsonify({"message": "Capacity must be a number"}), 400

    customer = Customer(
        name=name, place=place, mobile=mobile, capacity=capacity, user_id=user_id
    )

    db.session.add(customer)
    db.session.commit()

    return jsonify({
        "message": "Customer added successfully",
        "customer": customer.to_dict()
    }), 201

# ================= WORKFLOW PAYLOAD UTILS =================
def build_workflow_payload(customer):
    workflow_payload = {
        "customer": customer.to_dict(),
        "siteVisit": None,
        "mnre": None,
        "loan": None,
        "payment": None,
        "kseb": None,
        "materialDelivery": None,
        "installation": None,
        "ksebRegistration": None,
        "dcr": None,
        "mnreInstallation": None,
        "services": [],
    }

    site_visit = SiteVisit.query.filter_by(customer_id=customer.id).first()
    if site_visit:
        workflow_payload["siteVisit"] = site_visit.to_dict()

    mnre = Mnre.query.filter_by(customer_id=customer.id).first()
    if mnre:
        workflow_payload["mnre"] = mnre.to_dict()

    loan = Loan.query.filter_by(customer_id=customer.id).first()
    if loan:
        workflow_payload["loan"] = loan.to_dict()

    payment = Payment.query.filter_by(customer_id=customer.id).first()
    if payment:
        workflow_payload["payment"] = payment.to_dict()

    kseb = Kseb.query.filter_by(customer_id=customer.id).first()
    if kseb:
        workflow_payload["kseb"] = kseb.to_dict()

    material_delivery = MaterialDelivery.query.filter_by(customer_id=customer.id).first()
    if material_delivery:
        workflow_payload["materialDelivery"] = material_delivery.to_dict()

    installation = Installation.query.filter_by(customer_id=customer.id).first()
    if installation:
        workflow_payload["installation"] = installation.to_dict()

    kseb_registration = KsebRegistration.query.filter_by(customer_id=customer.id).first()
    if kseb_registration:
        workflow_payload["ksebRegistration"] = kseb_registration.to_dict()

    dcr = Dcr.query.filter_by(customer_id=customer.id).first()
    if dcr:
        workflow_payload["dcr"] = dcr.to_dict()

    mnre_installation = MnreInstallation.query.filter_by(customer_id=customer.id).first()
    if mnre_installation:
        workflow_payload["mnreInstallation"] = mnre_installation.to_dict()

    services = Service.query.filter_by(project_id=customer.id).all()
    if services:
        workflow_payload["services"] = [s.to_dict() for s in services]

    return workflow_payload

@customer_bp.route("/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_customer(customer_id):
    user_id = int(get_jwt_identity())
    customer = Customer.query.filter_by(id=customer_id, user_id=user_id).first()
    if not customer:
        return jsonify({"message": "Customer not found"}), 404
    return jsonify(customer.to_dict()), 200

@customer_bp.route("/<int:customer_id>/workflow", methods=["GET"])
@jwt_required()
def get_customer_workflow(customer_id):
    user_id = int(get_jwt_identity())
    customer = Customer.query.filter_by(id=customer_id, user_id=user_id).first()
    if not customer:
        return jsonify({"message": "Customer not found"}), 404
    return jsonify(build_workflow_payload(customer)), 200

@customer_bp.route("/<int:customer_id>/workflow", methods=["PUT"])
@jwt_required()
def update_customer_workflow(customer_id):
    user_id = int(get_jwt_identity())
    customer = Customer.query.filter_by(id=customer_id, user_id=user_id).first()

    if not customer:
        return jsonify({"message": "Customer not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"message": "Invalid JSON payload"}), 400

    section = data.get("section")
    payload = data.get("payload", {})

    sections_mapping = {
        "site": SiteVisit, "mnre": Mnre, "loan": Loan, "payment": Payment,
        "kseb": Kseb, "material_delivery": MaterialDelivery, "installation": Installation,
        "kseb_registration": KsebRegistration, "dcr": Dcr, "mnre_installation": MnreInstallation,
        "service": Service
    }

    if section not in sections_mapping:
        return jsonify({"message": "Unknown workflow section"}), 400

    model_cls = sections_mapping[section]
    obj = model_cls.query.filter_by(customer_id=customer.id).first() if section != "service" else model_cls.query.filter_by(project_id=customer.id).first()
    
    if not obj:
        if section == "site":
            obj = SiteVisit(customer_id=customer.id, user_id=user_id)
        elif section == "service":
            obj = Service(project_id=customer.id)
        else:
            obj = model_cls(customer_id=customer.id)
        db.session.add(obj)

    for key, value in payload.items():
        if hasattr(obj, key):
            setattr(obj, key, value)

    db.session.commit()
    return jsonify(build_workflow_payload(customer)), 200

# =========================
# UPDATE CUSTOMER
# =========================
@customer_bp.route("/<int:customer_id>", methods=["PUT"])
@jwt_required()
def update_customer(customer_id):
    user_id = int(get_jwt_identity())
    customer = Customer.query.filter_by(id=customer_id, user_id=user_id).first()

    if not customer:
        return jsonify({"message": "Customer not found"}), 404

    is_form = request.content_type and "multipart/form-data" in request.content_type
    data = request.form if is_form else request.get_json()

    if not data:
        return jsonify({"message": "Invalid data"}), 400

    customer.name = data.get("name", customer.name)
    customer.place = data.get("place", customer.place)
    customer.mobile = data.get("mobile", customer.mobile)
    customer.email = data.get("email", customer.email)
    customer.house_name = data.get("house_name", customer.house_name)
    customer.street = data.get("street", customer.street)
    customer.area = data.get("area", customer.area)
    customer.landmark = data.get("landmark", customer.landmark)
    customer.city = data.get("city", customer.city)
    customer.district = data.get("district", customer.district)
    customer.state = data.get("state", customer.state)
    customer.pincode = data.get("pincode", customer.pincode)

    if "capacity" in data:
        try:
            customer.capacity = int(data.get("capacity"))
        except:
            return jsonify({"message": "Capacity must be a number"}), 400

    if is_form:
        file = request.files.get("profile_photo")
        if file and file.filename:
           
            if customer.profile_photo and customer.profile_photo != DEFAULT_IMAGE:
                delete_to_cloud(customer.profile_photo)
                
            cloud_url = upload_to_cloud(file, folder_name="solar_flow/profile_photos")
            if cloud_url:
                customer.profile_photo = cloud_url

    if not customer.profile_photo:
        customer.profile_photo = DEFAULT_IMAGE

    db.session.commit()
    return jsonify({
        "message": "Customer updated successfully",
        "customer": customer.to_dict()
    }), 200

# =========================
# DELETE CUSTOMER
# =========================
# =========================
# DELETE CUSTOMER (FULLY SYNCED WITH CLOUD)
# =========================
@customer_bp.route("/<int:customer_id>", methods=["DELETE"])
@jwt_required()
def delete_customer(customer_id):
    user_id = int(get_jwt_identity())
    customer = Customer.query.filter_by(id=customer_id, user_id=user_id).first()

    if not customer:
        return jsonify({"message": "Customer not found"}), 404

    try:
        
        if customer.profile_photo and customer.profile_photo != DEFAULT_IMAGE:
            delete_to_cloud(customer.profile_photo)

        
        site_visit = SiteVisit.query.filter_by(customer_id=customer_id).first()
        if site_visit:
            file_fields = ["quotation_file", "agreement_file", "aadhaar", "pan", "kseb_bill", "bank_passbook", "land_tax", "building_tax", "signature"]
            for field in file_fields:
                url = getattr(site_visit, field)
                if url:
                    delete_to_cloud(url)
            if site_visit.images:
                try:
                    for url in json.loads(site_visit.images):
                        delete_to_cloud(url)
                except: pass

        
        mnre = Mnre.query.filter_by(customer_id=customer_id).first()
        if mnre:
            if mnre.feasibility_file: delete_to_cloud(mnre.feasibility_file)
            if mnre.ack_file: delete_to_cloud(mnre.ack_file)

        
        loan = Loan.query.filter_by(customer_id=customer_id).first()
        if loan and loan.ack_file:
            delete_to_cloud(loan.ack_file)

        
        payment = Payment.query.filter_by(customer_id=customer_id).first()
        if payment and payment.payment_proofs:
            
            proofs = payment.payment_proofs if isinstance(payment.payment_proofs, list) else json.loads(payment.payment_proofs or "[]")
            for url in proofs:
                delete_to_cloud(url)

        
        installation = Installation.query.filter_by(customer_id=customer_id).first()
        if installation and installation.geo_images:
            geo_imgs = installation.geo_images if isinstance(installation.geo_images, list) else json.loads(installation.geo_images or "[]")
            for url in geo_imgs:
                delete_to_cloud(url)

       
        services = Service.query.filter_by(project_id=customer_id).all()
        for service in services:
            if service.images:
                srv_imgs = service.images if isinstance(service.images, list) else json.loads(service.images or "[]")
                for url in srv_imgs:
                    delete_to_cloud(url)

            db.session.delete(customer)
        db.session.commit()
        return jsonify({"message": "Customer deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500