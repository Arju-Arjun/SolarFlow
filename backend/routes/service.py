import json
import threading
import time
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from extensions import db
from models import Service, Customer, NotificationAlert
from utils import upload_to_cloud, delete_to_cloud

service_bp = Blueprint("service_bp", __name__, url_prefix="/api/services")


def trigger_delayed_alert_simulation(app_instance, user_id, customer_name, customer_id):
    """
    Background worker thread simulating a maintenance interval lifecycle.
    Total cycle duration: 20 seconds.
    Triggers the alert row 2 seconds before the full cycle ends (at 18 seconds).
    """
    # Sleep for 18 seconds (2 seconds before the 20-second test interval completes)
    time.sleep(18)
    
    with app_instance.app_context():
        try:
            alert = NotificationAlert(
                user_id=user_id,
                customer_id=customer_id,
                title="Solar Maintenance Due Soon 🛠️",
                message=f"Scheduled service cycle for {customer_name} finishes in 2 seconds."
            )
            db.session.add(alert)
            db.session.commit()
            print(f"[Alert System] Notification successfully queued for User ID {user_id}")
        except Exception as ex:
            db.session.rollback()
            print(f"[Alert System] Failed to write database alert notification: {str(ex)}")


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

        # Get the underlying production application object context safe for threading threads
        flask_app = current_app._get_current_object()
        
        # Dispatch background lifecycle simulator thread asynchronously
        threading.Thread(
            target=trigger_delayed_alert_simulation,
            args=(flask_app, customer.user_id, customer.name, customer.id),
            daemon=True
        ).start()

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
    
    # ==========================================
# GET ALL UNREAD NOTIFICATIONS FOR LOGGED IN USER
# ==========================================
@service_bp.route("/notifications", methods=["GET"])
@jwt_required()
def get_user_notifications():
    try:
        from flask_jwt_extended import get_jwt_identity
        current_user_id = get_jwt_identity()
        
        # Fetch notifications belonging to the logged-in user, ordered by newest first
        alerts = NotificationAlert.query.filter_by(
            user_id=current_user_id
        ).order_by(NotificationAlert.id.desc()).all()
        
        return jsonify([alert.to_dict() for alert in alerts]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
# MARK ALL NOTIFICATIONS AS READ
# ==========================================
@service_bp.route("/notifications/read", methods=["POST"])
@jwt_required()
def mark_notifications_as_read():
    try:
        from flask_jwt_extended import get_jwt_identity
        current_user_id = get_jwt_identity()
        
        # Update all unread notifications for this user to is_read = True
        unread_alerts = NotificationAlert.query.filter_by(
            user_id=current_user_id, 
            is_read=False
        ).all()
        
        for alert in unread_alerts:
            alert.is_read = True
            
        db.session.commit()
        return jsonify({"message": "Notifications marked as read successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    

# ==========================================
# DELETE A SPECIFIC NOTIFICATION BY ID
# ==========================================
@service_bp.route("/notifications/<int:alert_id>", methods=["DELETE"])
@jwt_required()
def delete_notification(alert_id):
    try:
        alert = NotificationAlert.query.get_or_404(alert_id)
        db.session.delete(alert)
        db.session.commit()
        return jsonify({"message": "Notification cleared from database"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500