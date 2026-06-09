import os
from flask import current_app
from flask_mail import Message
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from extensions import mail
import cloudinary
import cloudinary.uploader

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


# ================= FILE UPLOAD FUNCTION =================
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def upload_to_cloud(file, folder_name):
    """
    Accepts a file stream object and a destination folder name.
    Uploads directly to Cloudinary and returns the secure HTTPS link string.
    Forces resource_type="raw" for PDFs to prevent visual rendering corruption.
    """
    if file and allowed_file(file.filename):
        try:
            file_name = file.filename.lower()
            
            # Direct raw pipeline routing for PDFs to preserve integrity
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
                    resource_type="auto"
                )
            return upload_result.get("secure_url")
        except Exception as e:
            print("CLOUDINARY UPLOAD ERROR:", str(e))
            return None
    return None

def delete_from_cloudinary(file_url):
    """
    Parses a secure Cloudinary URL, extracts its distinct public ID,
    and removes the asset from your cloud delivery storage infrastructure.
    """
    if not file_url or "res.cloudinary.com" not in file_url:
        return False
        
    try:
        url_segments = file_url.split('/')
        
        # Isolate folder configuration structure
        if "solar_flow" in url_segments:
            folder_start_index = url_segments.index("solar_flow")
            public_id_with_extension = "/".join(url_segments[folder_start_index:])
        else:
            upload_keyword_index = url_segments.index("upload")
            public_id_with_extension = "/".join(url_segments[upload_keyword_index + 2:])
            
        # Strip extension context to compile clean asset target
        clean_public_id = public_id_with_extension.split('.')[0]
        
        # Determine strict asset definition class
        resource_classification = "raw" if file_url.lower().endswith('.pdf') else "image"
        
        # Dispatch deletion execution
        api_response = cloudinary.uploader.destroy(clean_public_id, resource_type=resource_classification)
        print("CLOUDINARY STORAGE PURGE:", api_response)
        return True
    except Exception as error:
        print("CLOUDINARY REMOVAL SYSTEM ERROR:", str(error))
        return False