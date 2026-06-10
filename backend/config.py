import os
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

basedir = Path(__file__).resolve().parent


class Config:
    DEBUG = os.getenv("FLASK_DEBUG", "true").lower() == "true"

    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key")

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", f"sqlite:///{basedir / 'app.db'}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-key")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=4)

    # ================= MAIL CONFIG =================
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").lower() == "true"
    MAIL_USE_SSL = os.getenv("MAIL_USE_SSL", "false").lower() == "true"

    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")

    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER") or MAIL_USERNAME

    # ================= FRONTEND =================
    FRONTEND_URL = os.getenv("FRONTEND_URL", "https://solar-flow-jet.vercel.app")

    # ================= CLOUDINARY CONFIG =================
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

    # ================= UPLOAD =================
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", str(basedir / "uploads"))
    VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "0hK7R1ZzCenTz8yXz_A9K_m1T4N_W7vC0bW8O5W5xZ8=")