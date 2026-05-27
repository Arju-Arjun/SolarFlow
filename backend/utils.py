import threading
from flask import current_app
from flask_mail import Message
from extensions import mail


def _send_async(app, msg):
    with app.app_context():
        try:
            with mail.connect() as conn:
                conn.send(msg)
            print("EMAIL SENT SUCCESSFULLY ✅")
        except Exception as e:
            print("EMAIL ERROR ❌:", str(e))


def send_email(subject, recipients, body, html=None):
    if not recipients:
        return False

    app = current_app._get_current_object()
    sender = app.config.get("MAIL_DEFAULT_SENDER")

    msg = Message(
        subject=subject,
        sender=sender,
        recipients=recipients,
        body=body,
        html=html
    )

    # 🚀 NON-BLOCKING (IMPORTANT FOR RENDER)
    thread = threading.Thread(target=_send_async, args=(app, msg))
    thread.daemon = True
    thread.start()

    print("EMAIL QUEUED ✅")
    return True
