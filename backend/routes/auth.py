import re
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token
from extensions import db, bcrypt
from models import User

from utils import (
    generate_otp,
    store_otp,
    verify_otp,
    send_email,
    generate_reset_token,
    verify_reset_token
)

auth_bp = Blueprint("auth_bp", __name__)

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


# ================= HELPERS =================
def valid_email(email):
    return bool(email and EMAIL_REGEX.match(email))


def valid_password(password, confirm):
    return (
        password
        and confirm
        and password == confirm
        and len(password) >= 6
    )


# ================= STEP 1: REQUEST OTP & VALIDATE =================
@auth_bp.route("/register/request-otp", methods=["POST"])
def request_otp():
    data = request.get_json() or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    confirm = data.get("confirmPassword", "")
    mobile = data.get("mobile", "").strip()

  
    if not name or not valid_email(email) or not valid_password(password, confirm) or not mobile:
        return jsonify({"message": "Invalid registration data"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already exists"}), 409

    # Generate and store OTP securely inside db
    otp = generate_otp()
    if not store_otp(email, otp, ttl=300):
        return jsonify({"message": "Database configuration failure"}), 500

    # Dispatch verification code
    send_email(
        "Your OTP Code",
        [email],
        f"Your verification code is {otp}. Valid for 5 minutes."
    )

    return jsonify({"message": "OTP sent to your email successfully"}), 200


# ================= STEP 2: VERIFY OTP + REGISTER =================
@auth_bp.route("/register/verify-otp", methods=["POST"])
def verify_otp_register():
    data = request.get_json() or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    confirm = data.get("confirmPassword", "")
    mobile = data.get("mobile", "")
    otp = data.get("otp", "")

    if not name or not valid_email(email) or not valid_password(password, confirm) or not mobile or not otp:
        return jsonify({"message": "Invalid data"}), 400

    # Validate generated token threshold
    ok, msg = verify_otp(email, otp)
    if not ok:
        return jsonify({"message": msg}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "User already exists"}), 409

    hashed = bcrypt.generate_password_hash(password).decode("utf-8")

    user = User(
        name=name,
        email=email,
        password=hashed,
        mobile=mobile
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Registered successfully"}), 201


# ================= LOGIN =================
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not valid_email(email) or not password:
        return jsonify({"message": "Invalid input"}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({"message": "Invalid credentials"}), 401

    token = create_access_token(identity=str(user.id))

    return jsonify({
        "token": token,
        "user": user.to_dict()
    }), 200


# ================= FORGOT PASSWORD =================
@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()

    if not valid_email(email):
        return jsonify({"message": "Invalid email"}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"message": "If email exists, reset link sent"}), 200

    token = generate_reset_token(email)

    frontend = current_app.config.get("FRONTEND_URL")

    reset_url = f"{frontend}/reset-password?token={token}"

    send_email(
        "Password Reset",
        [email],
        f"Reset your password: {reset_url}"
    )

    return jsonify({"message": "Reset link sent"}), 200


# ================= RESET PASSWORD =================
@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}

    token = data.get("token")
    password = data.get("password")
    confirm = data.get("confirmPassword")

    if not token or not password or not confirm:
        return jsonify({"message": "Missing fields"}), 400

    if not valid_password(password, confirm):
        return jsonify({"message": "Passwords do not match"}), 400

    email = verify_reset_token(token)

    if not email:
        return jsonify({"message": "Invalid or expired token"}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    user.password = bcrypt.generate_password_hash(password).decode("utf-8")
    db.session.commit()

    return jsonify({"message": "Password reset successful."}), 200