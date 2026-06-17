import os
import random
import time
import json
from datetime import datetime, timedelta
from flask import current_app
from flask_mail import Message
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from extensions import mail, db
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
from pywebpush import webpush, WebPushException
# 💡 ഇംപോർട്ടുകൾ കൃത്യമായി ക്ലബ്ബ് ചെയ്തിട്ടുണ്ട് (OTP മോഡൽ ഉൾപ്പെടെ)
from models import NotificationAlert, PushSubscription, OTP

load_dotenv()

# ==========================================
# CLOUDINARY CONFIGURATION
# ==========================================
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)


# ==========================================
# OTP DATABASE HANDLING
# ==========================================
def generate_otp():
    """Generates a secure 6-digit numeric verification code."""
    return str(random.randint(100000, 999999))


def store_otp(email, otp, ttl=300):
    """Stores the generated OTP in the database with a specific TTL (seconds)."""
    try:
        # Delete any existing OTP for this email to prevent collision
        OTP.query.filter_by(email=email).delete()
        db.session.commit()
        
        # Create new OTP record
        otp_record = OTP(
            email=email,
            otp=otp,
            expires_at=datetime.utcnow() + timedelta(seconds=ttl)
        )
        db.session.add(otp_record)
        db.session.commit()
        return True
    except Exception as e:
        print(f"Error storing OTP: {str(e)}")
        db.session.rollback()
        return False


def verify_otp(email, otp):
    """Verifies OTP directly against the database timestamp parameters."""
    try:
        otp_record = OTP.query.filter_by(email=email).first()
        
        if not otp_record:
            return False, "OTP not found"
        
        if datetime.utcnow() > otp_record.expires_at:
            db.session.delete(otp_record)
            db.session.commit()
            return False, "OTP expired"
        
        if otp_record.otp != otp:
            return False, "Invalid OTP"
        
        # Delete OTP record safely after successful verification
        db.session.delete(otp_record)
        db.session.commit()
        return True, "OTP verified"
    except Exception as e:
        print(f"Error verifying OTP: {str(e)}")
        return False, "Database error"


# ==========================================
# TIMED TOKENS / SERIALIZERS
# ==========================================
def _get_serializer():
    secret = current_app.config.get("SECRET_KEY")
    return URLSafeTimedSerializer(secret, salt="password-reset-salt")


def generate_reset_token(email):
    return _get_serializer().dumps(email)


def verify_reset_token(token, expiration=3600):
    try:
        return _get_serializer().loads(token, max_age=expiration)
    except (BadSignature, SignatureExpired):
        return None


# ==========================================
# EMAIL SYSTEM
# ==========================================
def send_email(subject, recipients, body, html=None):
    if not recipients:
        return False

    sender = current_app.config.get("MAIL_DEFAULT_SENDER") or current_app.config.get("MAIL_USERNAME")

    msg = Message(
        subject=subject,
        sender=sender,
        recipients=recipients,
        body=body,
        html=html
    )

    try:
        print("Sending email...")
        print("Sender:", sender)
        print("Recipients:", recipients)

        mail.send(msg)

        print("Email sent successfully ✅")
        return True

    except Exception as e:
        print("EMAIL ERROR:", str(e))
        import traceback
        traceback.print_exc()
        return False


# ==========================================
# FILE UPLOAD & CLOUD PURGE FUNCTIONS
# ==========================================
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def upload_to_cloud(file, folder_name):
    """
    Accepts a file stream object, normalizes properties and uploads directly to Cloudinary.
    Forces resource_type="raw" for PDFs to prevent visualization breakdown.
    """
    if file and allowed_file(file.filename):
        try:
            file_name = file.filename.lower() if file.filename else ""

            if file_name.endswith('.pdf'):
                upload_result = cloudinary.uploader.upload(
                    file, 
                    folder=folder_name, 
                    resource_type="raw"
                )
            else:
                upload_result = cloudinary.uploader.upload(
                    file, 
                    folder=folder_name, 
                    resource_type="auto",
                    quality="auto",        
                    fetch_format="auto"    
                )
            return upload_result.get("secure_url")
        except Exception as e:
            print("CLOUD UPLOAD ERROR:", str(e))
            return None
    return None


def delete_to_cloud(file_url):
    """Parses a Cloud URL, extracts public ID, and destroys the target resource asset."""
    if not file_url or "res.cloudinary.com" not in file_url:
        return False
        
    try:
        url_segments = file_url.split('/')
        
        if "solar_flow" in url_segments:
            folder_start_index = url_segments.index("solar_flow")
            public_id_with_extension = "/".join(url_segments[folder_start_index:])
        else:
            upload_keyword_index = url_segments.index("upload")
            public_id_with_extension = "/".join(url_segments[upload_keyword_index + 2:])
            
        clean_public_id = public_id_with_extension.split('.')[0]
        resource_classification = "raw" if file_url.lower().endswith('.pdf') else "image"
        
        api_response = cloudinary.uploader.destroy(clean_public_id, resource_type=resource_classification)
        print("CLOUD STORAGE PURGE:", api_response)
        return True
    except Exception as error:
        print("CLOUD REMOVAL SYSTEM ERROR:", str(error))
        return False
    

# ==========================================
# NOTIFICATION SYSTEM FUNCTION
# ==========================================
def send_user_notification(app_instance, user_id, customer_id, title, message, url_path=None):
    with app_instance.app_context():
        try:
            alert = NotificationAlert(
                user_id=user_id, customer_id=customer_id,
                title=title, message=message
            )
            db.session.add(alert)
            db.session.commit()
            print(f"[Notification System] DB Alert saved for User ID: {user_id}")

            subscriptions = PushSubscription.query.filter_by(user_id=user_id).all()
            if not subscriptions:
                return

            push_payload = json.dumps({
                "title": title, "body": message,
                "url": url_path or f"/customer/{customer_id}"
            })

            for sub in subscriptions:
                try:
                    webpush(
                        subscription_info={
                            "endpoint": sub.endpoint,
                            "keys": {"p256dh": sub.p256dh, "auth": sub.auth}
                        },
                        data=push_payload,
                        vapid_private_key=app_instance.config.get("VAPID_PRIVATE_KEY") or os.environ.get("VAPID_PRIVATE_KEY"),
                        vapid_claims={"sub": "mailto:arjun.ai.tinos@gmail.com"},
                    )
                except WebPushException as ex:
                    if ex.response and ex.response.status_code in [404, 410]:
                        db.session.delete(sub)
                        db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"[Notification System] Global trigger error: {str(e)}")


# ==========================================
# PWA PUSH TOKEN STORAGE FUNCTION
# ==========================================
def handle_save_push_subscription(current_user_id, subscription_data):
    """Saves or refreshes a PWA Web Push subscription token for a specific user."""
    try:
        if not subscription_data or "endpoint" not in subscription_data:
            return {"error": "Invalid subscription data payload"}, 400

        existing_sub = PushSubscription.query.filter_by(endpoint=subscription_data["endpoint"]).first()
        if existing_sub:
            existing_sub.user_id = current_user_id 
            db.session.commit()
            return {"message": "Subscription token refreshed successfully"}, 200

        new_subscription = PushSubscription(
            user_id=current_user_id,
            endpoint=subscription_data["endpoint"],
            p256dh=subscription_data["keys"]["p256dh"],
            auth=subscription_data["keys"]["auth"]
        )
        
        db.session.add(new_subscription)
        db.session.commit()
        return {"message": "PWA Web Push subscription mapped successfully"}, 201

    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 500