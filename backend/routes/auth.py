import re
from flask import Blueprint, current_app, request, jsonify
from flask_jwt_extended import create_access_token
from extensions import db, bcrypt, mail
from models import User
from utils import send_email, generate_reset_token, verify_reset_token

auth_bp = Blueprint("auth_bp", __name__)

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def _valid_email(email):
    return bool(email and EMAIL_REGEX.match(email))

def _validate_passwords(password, confirm_password):
    return bool(password and confirm_password and password == confirm_password and len(password) >= 6)

# ================= ORIGINAL REGISTER =================
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    confirm_password = data.get("confirmPassword", "")
    mobile = data.get("mobile", "").strip()

    if not name or not _valid_email(email) or not _validate_passwords(password, confirm_password) or not mobile:
        return jsonify({"message": "Invalid registration data."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email is already registered."}), 409

    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(name=name, email=email, password=password_hash, mobile=mobile)

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Registration successful."}), 201

# ================= LOGIN =================
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not _valid_email(email) or not password:
        return jsonify({"message": "Email and password are required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({"message": "Invalid email or password."}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({"token": access_token, "user": user.to_dict()}), 200







# ================= FORGOT PASSWORD =================
@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()

    if not _valid_email(email):
        return jsonify({"message": "Valid email is required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "If the email is registered, a reset link has been sent."}), 200

    token = generate_reset_token(user.email)
    frontend_host = current_app.config.get("FRONTEND_URL") or request.host_url.rstrip("/")
    reset_url = f"{frontend_host}/reset-password?token={token}"
    print(f"\n\n\n\nGenerated reset URL: {reset_url}\n\n\n\n")

    message = f"Reset your password: {reset_url}"
    send_email("Password Reset", [user.email], message)

    return jsonify({"message": "Reset link sent"}), 200

# ================= RESET PASSWORD =================
@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    token = data.get("token", "").strip()
    password = data.get("password", "")
    confirm_password = data.get("confirmPassword", "")

    if not token or not password or not confirm_password:
        return jsonify({"message": "Token, password, and confirm password are required."}), 400

    if not _validate_passwords(password, confirm_password):
        return jsonify({"message": "Passwords must match and be at least 6 characters long."}), 400

    email = verify_reset_token(token)
    if not email:
        return jsonify({"message": "Invalid or expired token."}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "User not found."}), 404

    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    user.password = password_hash
    db.session.commit()

    return jsonify({"message": "Password reset successful."}), 200