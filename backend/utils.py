import os
from flask import current_app
from flask_mail import Message
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from extensions import mail



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