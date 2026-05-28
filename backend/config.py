import os
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

basedir = Path(__file__).resolve().parent


class Config:
<<<<<<< HEAD
    DEBUG = os.getenv("FLASK_DEBUG", "true").lower() == "true"
=======
    DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"
>>>>>>> 3ab017413f8238ea2d422d2e2e182d669acb772a

    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key")

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{basedir.parent}/instance/solar_manager.db",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-key")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=4)

    # ================= MAIL CONFIG =================
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
<<<<<<< HEAD
=======

>>>>>>> 3ab017413f8238ea2d422d2e2e182d669acb772a
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").lower() == "true"
    MAIL_USE_SSL = os.getenv("MAIL_USE_SSL", "false").lower() == "true"

    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")

    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER") or MAIL_USERNAME

    # ================= FRONTEND =================
<<<<<<< HEAD
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    CORS_ORIGINS = [
        url.strip()
        for url in os.getenv(
            "CORS_ORIGINS",
            ",".join([
                FRONTEND_URL,
                "http://localhost:3000",
                "http://127.0.0.1:3000",
            ]),
        ).split(",")
        if url.strip()
    ]
    CORS_SUPPORTS_CREDENTIALS = True

    # ================= UPLOAD =================
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", str(basedir / "uploads"))
=======
    FRONTEND_URL = os.getenv(
        "FRONTEND_URL",
        "http://localhost:3000"
    )

    # ================= UPLOAD =================
    UPLOAD_FOLDER = os.getenv(
        "UPLOAD_FOLDER",
        str(basedir / "uploads")
    )
>>>>>>> 3ab017413f8238ea2d422d2e2e182d669acb772a
