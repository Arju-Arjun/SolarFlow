import json
import threading
import time
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from extensions import db
from utils import upload_to_cloud, delete_to_cloud, send_user_notification, handle_save_push_subscription
from models import Service, Customer, NotificationAlert, PushSubscription

service_bp = Blueprint("service_bp", __name__, url_prefix="/api/services")


def run_production_maintenance_checker(app_instance, project_id, user_id, customer_name, active_service_id):
    """
    Background daemon cycle handler matching production solar workflow specifications.
    Polls every 24 hours to track structural expiration milestones.
    Monitors a 30-day maintenance window lifecycle.
    Triggers alarms daily from day 25 until a new service log entry silences it.
    Clamps permanently once the project reaches a maximum threshold of 10 service operations.
    """
    polling_delay_seconds = 86400  # 24 Hours
    print(f"[Maintenance Core] Monitoring lifecycle thread dispatched for Project ID: {project_id}")
    
    while True:
        time.sleep(polling_delay_seconds)
        
        with app_instance.app_context():
            try:
                # Rule 4: Query total record count to evaluate structural clamp limits
                total_services_logged = Service.query.filter_by(project_id=project_id).count()
                if total_services_logged >= 10:
                    print(f"[Maintenance Core] Project {project_id} reached max threshold (>=10). Alarm system clamped.")
                    break

                # Fetch the most recent operation log
                latest_service = Service.query.filter_by(project_id=project_id).order_by(Service.id.desc()).first()
                if not latest_service:
                    break

                if latest_service.id != active_service_id:
                    print(f"[Maintenance Core] New service log detected for Project {project_id}. Silencing old thread loop.")
                    break

                current_date = datetime.utcnow().date()
                base_operation_date = latest_service.service_date
                days_elapsed = (current_date - base_operation_date).days

                # Rule 2: Alarms begin exactly when 25 days elapse from the last operation milestone
                if days_elapsed >= 25:
                    send_user_notification(
                        app_instance=app_instance,
                        user_id=user_id,
                        customer_id=project_id,
                        title=f"Solar Service Cycle Pending! 🛠️",
                        message=f"System operation log entry for {customer_name} was updated {days_elapsed} days ago. Maintenance due.",
                        url_path=f"/customer/{project_id}?tab=service"
                    )
                    print(f"[PWA Pipeline] Dispatching scheduled interval maintenance reminder alert for Project: {project_id}")

            except Exception as e:
                print(f"[Maintenance Core] Background thread validation error: {str(e)}")
                db.session.rollback()


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
            service_date = datetime.strptime(date, "%Y-%m-%d").date()
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

        flask_app = current_app._get_current_object()
        
        # 💡 FIXED: Passing the new service.id to track and stop duplicating background loops
        threading.Thread(
            target=run_production_maintenance_checker,
            args=(flask_app, project_id, customer.user_id, customer.name, service.id),
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
            service.service_date = datetime.strptime(date, "%Y-%m-%d").date()
        if comments:
            service.comments = comments

        existing_images_param = request.form.get("existingImages")
        
        if existing_images_param is not None:
            new_list = json.loads(existing_images_param)
            old_images_list = json.loads(service.images) if service.images else []
            
            for old_url in old_images_list:
                if old_url not in new_list:
                    delete_to_cloud(old_url)
            
            service.images = json.dumps(new_list)

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
# GET SERVICES BY PROJECT ID (WITH SEQUENTIAL NUMBERING)
# ==========================================
@service_bp.route("/project/<int:project_id>", methods=["GET"])
@jwt_required()
def get_services(project_id):
    try:
        services = Service.query.filter_by(project_id=project_id).order_by(Service.id.asc()).all()
        
        service_list = []
        for index, s in enumerate(services):
            service_list.append({
                "id": s.id,
                "log_number": index + 1,  
                "date": str(s.service_date),
                "comments": s.comments,
                "images": json.loads(s.images) if s.images else []
            })
            
        service_list.reverse()
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
    

# ==========================================
# SAVE PWA PUSH SUBSCRIPTION TOKEN FROM BROWSER
# ==========================================
@service_bp.route("/save-subscription", methods=["POST"])
@jwt_required()
def save_push_subscription():
    from flask_jwt_extended import get_jwt_identity
    current_user_id = get_jwt_identity()
    subscription_data = request.get_json()
    
    result, status_code = handle_save_push_subscription(current_user_id, subscription_data)
    return jsonify(result), status_code