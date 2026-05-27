from flask import current_app
from flask_mail import Message
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from extensions import mail


# ================= TOKEN =================
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


# ================= EMAIL =================
def send_email(subject, recipients, body, html=None):
    try:
        if not recipients:
            return False

        sender = current_app.config.get("MAIL_DEFAULT_SENDER")

        msg = Message(
            subject=subject,
            sender=sender,
            recipients=recipients,
            body=body,
            html=html
        )

        # safer Render-compatible sending
        with mail.connect() as conn:
            conn.send(msg)

        print("EMAIL SENT SUCCESSFULLY ✅")
        return True

    except Exception as e:
        print("EMAIL ERROR ❌:", str(e))
        return False