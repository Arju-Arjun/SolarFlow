from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Kseb, Customer, KsebRegistration, Dcr

kseb_bp = Blueprint("kseb_bp", __name__, url_prefix="/api/kseb")

def normalize_boolean_field(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in ("true", "yes", "1", "y", "on")

def to_yes_no(value):
    return "Yes" if normalize_boolean_field(value) else "No"

@kseb_bp.route("/<int:customer_id>", methods=["POST"])
@jwt_required()
def create_or_update_kseb(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    kseb = Kseb.query.filter_by(customer_id=customer_id).first()
    data = request.get_json() or {}
    
    name_change = to_yes_no(data.get("name_change", False))
    name_change_status = data.get("name_change_status", "Pending")
    name_change_comment = data.get("name_change_comment", "")
    load_enhance = to_yes_no(data.get("load_enhance", False))
    load_enhance_status = data.get("load_enhance_status", "Pending")
    load_enhance_comment = data.get("load_enhance_comment", "")
    feasibility = to_yes_no(data.get("feasibility", False))
    fee_paid = to_yes_no(data.get("fee_paid", False))

    if not kseb:
        kseb = Kseb(
            customer_id=customer_id, name_change=name_change, name_change_status=name_change_status,
            name_change_comment=name_change_comment, load_enhance=load_enhance,
            load_enhance_status=load_enhance_status, load_enhance_comment=load_enhance_comment,
            feasibility=feasibility, fee_paid=fee_paid
        )
        db.session.add(kseb)
    else:
        kseb.name_change = name_change
        kseb.name_change_status = name_change_status
        kseb.name_change_comment = name_change_comment
        kseb.load_enhance = load_enhance
        kseb.load_enhance_status = load_enhance_status
        kseb.load_enhance_comment = load_enhance_comment
        kseb.feasibility = feasibility
        kseb.fee_paid = fee_paid

    db.session.commit()
    return jsonify({"message": "KSEB data updated successfully"}), 200

@kseb_bp.route("/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_Kseb(customer_id):
    kseb = Kseb.query.filter_by(customer_id=customer_id).first()
    if not kseb:
        return jsonify(None), 200

    return jsonify({
        "id": kseb.id,
        "customer_id": kseb.customer_id,
        "name_change": normalize_boolean_field(kseb.name_change),
        "name_change_status": kseb.name_change_status,
        "name_change_comment": kseb.name_change_comment,
        "load_enhance": normalize_boolean_field(kseb.load_enhance),
        "load_enhance_status": kseb.load_enhance_status,
        "load_enhance_comment": kseb.load_enhance_comment,
        "feasibility": normalize_boolean_field(kseb.feasibility),
        "fee_paid": normalize_boolean_field(kseb.fee_paid)
    }), 200

@kseb_bp.route("/<int:customer_id>", methods=["DELETE"])
@jwt_required()
def delete_Kseb(customer_id):
    kseb = Kseb.query.filter_by(customer_id=customer_id).first()
    if not kseb:
        return jsonify({"error": "KSEB data not found for this customer"}), 404
    db.session.delete(kseb)
    db.session.commit()
    return jsonify({"message": "KSEB data deleted successfully"}), 200

@kseb_bp.route("/registration/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_kseb_registration(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404
    kseb_reg = KsebRegistration.query.filter_by(customer_id=customer_id).first()
    if not kseb_reg:
        return jsonify(None), 200
    return jsonify(kseb_reg.to_dict()), 200

@kseb_bp.route("/registration/<int:customer_id>", methods=["POST", "PUT"])
@jwt_required()
def create_or_update_kseb_registration(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    kseb_reg = KsebRegistration.query.filter_by(customer_id=customer_id).first()
    data = request.get_json() or {}
    
    if not kseb_reg:
        kseb_reg = KsebRegistration(customer_id=customer_id)
    
    kseb_reg.registration_submitted = data.get("registration_submitted", False)
    kseb_reg.completion_submitted = data.get("completion_submitted", False)
    kseb_reg.agreement_submitted = data.get("agreement_submitted", False)
    kseb_reg.payment_done = data.get("payment_done", False)
    kseb_reg.plant_energized = data.get("plant_energized", False)
    kseb_reg.wifi = data.get("wifi", False)
    kseb_reg.wifi_configured = data.get("wifi_configured", False)
    kseb_reg.comments = data.get("comments", "")
    
    db.session.add(kseb_reg)
    db.session.commit()
    return jsonify({"message": "KSEB Registration data processing updated", "data": kseb_reg.to_dict()}), 200

@kseb_bp.route("/registration/<int:customer_id>", methods=["DELETE"])
@jwt_required()
def delete_kseb_registration(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404
    kseb_reg = KsebRegistration.query.filter_by(customer_id=customer_id).first()
    if not kseb_reg:
        return jsonify({"error": "KSEB Registration data not found"}), 404
    db.session.delete(kseb_reg)
    db.session.commit()
    return jsonify({"message": "KSEB Registration data deleted successfully"}), 200

@kseb_bp.route("/dcr/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_dcr(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404
    dcr = Dcr.query.filter_by(customer_id=customer_id).first()
    if not dcr:
        return jsonify(None), 200
    return jsonify(dcr.to_dict()), 200

@kseb_bp.route("/dcr/<int:customer_id>", methods=["POST", "PUT"])
@jwt_required()
def create_or_update_dcr(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    dcr = Dcr.query.filter_by(customer_id=customer_id).first()
    data = request.get_json() or {}
    
    if not dcr:
        dcr = Dcr(customer_id=customer_id)
    
    dcr.certificate_received = data.get("certificate_received", False)
    dcr.certificate_claimed = data.get("certificate_claimed", False)
    dcr.certificate_sold = data.get("certificate_sold", False)
    dcr.comments = data.get("comments", "")
    
    db.session.add(dcr)
    db.session.commit()
    return jsonify({"message": "DCR tracking data saved", "data": dcr.to_dict()}), 200

@kseb_bp.route("/dcr/<int:customer_id>", methods=["DELETE"])
@jwt_required()
def delete_dcr(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404
    dcr = Dcr.query.filter_by(customer_id=customer_id).first()
    if not dcr:
        return jsonify({"error": "DCR data not found"}), 404
    db.session.delete(dcr)
    db.session.commit()
    return jsonify({"message": "DCR data deleted successfully"}), 200