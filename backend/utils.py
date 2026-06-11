import os
from flask import current_app
from flask_mail import Message
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from extensions import mail,db
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
import json
from pywebpush import webpush, WebPushException
from models import NotificationAlert, PushSubscription

load_dotenv()

# ================= CLOUDINARY CONFIGURATION =================
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# ================= PASSWORD RESET TOKENS =================
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


# ================= EMAIL FUNCTION =================
def send_email(subject, recipients, body, html=None):
    if not recipients:
        return False

    sender = current_app.config.get("MAIL_DEFAULT_SENDER") or current_app.config.get("MAIL_USERNAME")

    msg = Message(
        subject=subject,
        sender=sender,
        recipients=recipients,
        body=body
    )

    if html:
        msg.html = html

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


# ================= FILE UPLOAD & PURGE FUNCTIONS =================
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def upload_to_cloud(file, folder_name):
    """
    Accepts a file stream object and a destination folder name.
    Uploads directly to Cloudinary and returns the secure HTTPS link string.
    Forces resource_type="raw" for PDFs to preserve visual rendering integrity.
    """
    if file and allowed_file(file.filename):
        try:
            # Extract and normalize the file extension to lowercase
            file_name = file.filename.lower() if file.filename else ""

            if file_name.endswith('.pdf'):
                # 📄 Upload PDF files in their original raw format without modifications
                upload_result = cloudinary.uploader.upload(
                    file, 
                    folder=folder_name, 
                    resource_type="raw"
                )
            else:
                # 📸 Upload images with automatic visual quality and format optimization
                upload_result = cloudinary.uploader.upload(
                    file, 
                    folder=folder_name, 
                    resource_type="auto",
                    quality="auto",        # Automatically optimizes image size while preserving 100% visual fidelity
                    fetch_format="auto"    # Delivers the best modern format (like WebP/AVIF) depending on the browser
                )
            return upload_result.get("secure_url")
        except Exception as e:
            print("CLOUD UPLOAD ERROR:", str(e))
            return None
    return None


def delete_to_cloud(file_url):
    """
    Parses a secure Cloud URL, extracts its distinct public ID,
    and removes the asset from your cloud delivery storage infrastructure.
    """
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