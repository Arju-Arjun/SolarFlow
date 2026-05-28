from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import MaterialDelivery, Customer
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime


# =========================
# BLUEPRINT

material_delivery_bp = Blueprint(
    "material_delivery_bp",
    __name__,
    url_prefix="/api/material-delivery"
)
# =========================


    # material_delivery
# id → INT, PRIMARY KEY, AUTO INCREMENT
# changes → TEXT (stores material/work changes details)
# extra_material → TEXT (stores extra materials used or required)
# structure_changes → TEXT (stores structure modification details)
# electrical_delivered → BOOLEAN (true/false for electrical delivery status)
# structure_delivered → BOOLEAN (true/false for structure delivery status)
# panel_delivered → BOOLEAN (true/false for panel delivery status)
# comments → TEXT (general remarks or notes)
# created_at → TIMESTAMP (auto set when record is created)
# updated_at → TIMESTAMP (auto updates when record changes)



# =========================
# CREATE / UPDATE (SINGLE API)
@material_delivery_bp.route("/<int:customer_id>", methods=["POST"])
@jwt_required()
def create_or_update_material_delivery(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    # check existing
    material_delivery = MaterialDelivery.query.filter_by(customer_id=customer_id).first()

    data = request.get_json()
    changes = data.get("changes")
    extra_material = data.get("extra_material")
    structure_changes = data.get("structure_changes")
    electrical_delivered = data.get("electrical_delivered", False)
    structure_delivered = data.get("structure_delivered", False)
    panel_delivered = data.get("panel_delivered", False)
    comments = data.get("comments")

    if material_delivery:
        # UPDATE
        material_delivery.changes = changes
        material_delivery.extra_material = extra_material
        material_delivery.structure_changes = structure_changes
        material_delivery.electrical_delivered = electrical_delivered
        material_delivery.structure_delivered = structure_delivered
        material_delivery.panel_delivered = panel_delivered
        material_delivery.comments = comments
        material_delivery.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({"message": "Material delivery updated successfully"})
    else:
        # CREATE
        new_material_delivery = MaterialDelivery(
            customer_id=customer_id,
            changes=changes,
            extra_material=extra_material,
            structure_changes=structure_changes,
            electrical_delivered=electrical_delivered,
            structure_delivered=structure_delivered,
            panel_delivered=panel_delivered,
            comments=comments
        )
        db.session.add(new_material_delivery)
        db.session.commit()
        return jsonify({"message": "Material delivery created successfully"})
    
# =========================
# GET (SINGLE)
@material_delivery_bp.route("/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_material_delivery(customer_id):
    material_delivery = MaterialDelivery.query.filter_by(customer_id=customer_id).first()
    if not material_delivery:
        return jsonify({"error": "Material delivery record not found"}), 404

    return jsonify({
        "id": material_delivery.id,
        "customer_id": material_delivery.customer_id,
        "changes": material_delivery.changes,
        "extra_material": material_delivery.extra_material,
        "structure_changes": material_delivery.structure_changes,
        "electrical_delivered": material_delivery.electrical_delivered,
        "structure_delivered": material_delivery.structure_delivered,
        "panel_delivered": material_delivery.panel_delivered,
        "comments": material_delivery.comments,
        "created_at": material_delivery.created_at.isoformat() if material_delivery.created_at else None,
        "updated_at": material_delivery.updated_at.isoformat() if material_delivery.updated_at else None
    })

# =========================
# DELETE
@material_delivery_bp.route("/<int:customer_id>", methods=["DELETE"])
@jwt_required()
def delete_material_delivery(customer_id):
    material_delivery = MaterialDelivery.query.filter_by(customer_id=customer_id).first()
    if not material_delivery:
        return jsonify({"error": "Material delivery record not found"}), 404

    db.session.delete(material_delivery)
    db.session.commit()
    return jsonify({"message": "Material delivery record deleted successfully"})
