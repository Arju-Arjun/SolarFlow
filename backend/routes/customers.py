from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import (
    Customer,
    SiteVisit,
    Mnre,
    Loan,
    Payment,
    Kseb,
    MaterialDelivery,
    Installation,
    KsebRegistration,
    Dcr,
    MnreInstallation,
    Service,
)
from werkzeug.utils import secure_filename
import os
import uuid

# =========================
# CONFIG
# =========================
UPLOAD_FOLDER = "backend/static/profile_photo"
DEFAULT_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"

# =========================
# BLUEPRINT
# =========================
customer_bp = Blueprint(
    "customer_bp",
    __name__,
    url_prefix="/api/customers"
)


# =========================
# FILE DELETE HELPER

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
# FILE SAVE HELPER
def save_file(file, customer_name):
    """Save uploaded file and return relative path"""
    if not file:
        return None

    ext = file.filename.rsplit(".", 1)[-1]
    unique_id = str(uuid.uuid4())[:8]

    filename = f"{customer_name}_profile_{unique_id}.{ext}"
    filename = secure_filename(filename)

    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    return f"/{filepath.replace(os.sep, '/')}"


# =========================
# GET ALL CUSTOMERS
# =========================
@customer_bp.route("/", methods=["GET"])
@jwt_required()
def get_customers():
    user_id = int(get_jwt_identity())

    customers = Customer.query.filter_by(user_id=user_id).all()

    return jsonify([c.to_dict() for c in customers]), 200


# =========================
# ADD CUSTOMER
# =========================
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
        name=name,
        place=place,
        mobile=mobile,
        capacity=capacity,
        user_id=user_id
    )

    db.session.add(customer)
    db.session.commit()

    return jsonify({
        "message": "Customer added successfully",
        "customer": customer.to_dict()
    }), 201


# =========================
# GET SINGLE CUSTOMER
# =========================
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

    customer = Customer.query.filter_by(
        id=customer_id,
        user_id=user_id
    ).first()

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

    if section == "site":
        obj = SiteVisit.query.filter_by(customer_id=customer.id).first()
        if not obj:
            obj = SiteVisit(customer_id=customer.id, user_id=user_id)
            db.session.add(obj)
    elif section == "mnre":
        obj = Mnre.query.filter_by(customer_id=customer.id).first()
    elif section == "loan":
        obj = Loan.query.filter_by(customer_id=customer.id).first()
        if not obj:
            obj = Loan(customer_id=customer.id)
            db.session.add(obj)
    elif section == "payment":
        obj = Payment.query.filter_by(customer_id=customer.id).first()
        if not obj:
            obj = Payment(customer_id=customer.id)
            db.session.add(obj)
    elif section == "kseb":
        obj = Kseb.query.filter_by(customer_id=customer.id).first()
        if not obj:
            obj = Kseb(customer_id=customer.id)
            db.session.add(obj)
    elif section == "material_delivery":
        obj = MaterialDelivery.query.filter_by(customer_id=customer.id).first()
        if not obj:
            obj = MaterialDelivery(customer_id=customer.id)
            db.session.add(obj)
    elif section == "installation":
        obj = Installation.query.filter_by(customer_id=customer.id).first()
        if not obj:
            obj = Installation(customer_id=customer.id)
            db.session.add(obj)
    elif section == "kseb_registration":
        obj = KsebRegistration.query.filter_by(customer_id=customer.id).first()
        if not obj:
            obj = KsebRegistration(customer_id=customer.id)
            db.session.add(obj)
    elif section == "dcr":
        obj = Dcr.query.filter_by(customer_id=customer.id).first()
        if not obj:
            obj = Dcr(customer_id=customer.id)
            db.session.add(obj)
    elif section == "mnre_installation":
        obj = MnreInstallation.query.filter_by(customer_id=customer.id).first()
        if not obj:
            obj = MnreInstallation(customer_id=customer.id)
            db.session.add(obj)
    elif section == "service":
        obj = Service.query.filter_by(customer_id=customer.id).first()
        if not obj:
            obj = Service(customer_id=customer.id)
            db.session.add(obj)
    else:
        return jsonify({"message": "Unknown workflow section"}), 400

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

    customer = Customer.query.filter_by(
        id=customer_id,
        user_id=user_id
    ).first()

    if not customer:
        return jsonify({"message": "Customer not found"}), 404

    # =========================
    # CHECK REQUEST TYPE
    # =========================
    is_form = request.content_type and "multipart/form-data" in request.content_type

    if is_form:
        data = request.form
    else:
        data = request.get_json()
        if not data:
            return jsonify({"message": "Invalid JSON data"}), 400

    # =========================
    # COMMON FIELD UPDATE
    # =========================
    customer.name = data.get("name", customer.name)
    customer.place = data.get("place", customer.place)
    customer.mobile = data.get("mobile", customer.mobile)
    customer.email = data.get("email", customer.email)

    # Address fields
    customer.house_name = data.get("house_name", customer.house_name)
    customer.street = data.get("street", customer.street)
    customer.area = data.get("area", customer.area)
    customer.landmark = data.get("landmark", customer.landmark)
    customer.city = data.get("city", customer.city)
    customer.district = data.get("district", customer.district)
    customer.state = data.get("state", customer.state)
    customer.pincode = data.get("pincode", customer.pincode)

    # Capacity (safe conversion)
    if "capacity" in data:
        try:
            customer.capacity = int(data.get("capacity"))
        except:
            return jsonify({"message": "Capacity must be a number"}), 400

    # =========================
    # IMAGE HANDLING
    # =========================
    if is_form:
        file = request.files.get("profile_photo")
        if file and file.filename:
            # Delete old image if exists and not default
            delete_file(customer.profile_photo)

            # Save new image
            customer.profile_photo = save_file(file, customer.name)

    
    # =========================
    # DEFAULT IMAGE CHECK
    # =========================
    if not customer.profile_photo:
        customer.profile_photo = DEFAULT_IMAGE

    # =========================
    # SAVE
    # =========================
    db.session.commit()

    return jsonify({
        "message": "Customer updated successfully",
        "customer": customer.to_dict()
    }), 200

# =========================
# DELETE CUSTOMER
# =========================
import os
from flask import jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

@customer_bp.route("/<int:customer_id>", methods=["DELETE"])
@jwt_required()
def delete_customer(customer_id):
    user_id = int(get_jwt_identity())

    customer = Customer.query.filter_by(
        id=customer_id,
        user_id=user_id
    ).first()

    if not customer:
        return jsonify({"message": "Customer not found"}), 404

    try:
        # =========================
        # DELETE PROFILE IMAGE
        # =========================
        file_name = customer.profile_photo
        print("DB File:", file_name)

        if file_name and "default.png" not in file_name:

            # extract only filename
            filename = file_name.split("/")[-1]

            # real path: backend/backend/static/uploads/filename.jpg
            file_path = os.path.join(
                current_app.root_path,
                "static",
                "uploads",
                filename
            )

            print("Actual file path:", file_path)

            # delete safely
            if os.path.exists(file_path):
                os.remove(file_path)
                print("Image deleted successfully")
            else:
                print("File not found, skipping delete")

        # =========================
        # DELETE CUSTOMER FROM DB
        # =========================
        db.session.delete(customer)
        db.session.commit()

        return jsonify({
            "message": "Customer deleted successfully"
        }), 200

    except Exception as e:
        db.session.rollback()
        print("Error:", str(e))
        return jsonify({"message": str(e)}), 500