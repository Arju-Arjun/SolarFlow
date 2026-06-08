import os
from flask import Flask, jsonify, send_from_directory
from dotenv import load_dotenv
from flask_cors import CORS
from config import Config
from extensions import db, bcrypt, jwt, mail, cors

from routes.auth import auth_bp
from routes.customers import customer_bp
from routes.site_visit import site_visit_bp
from routes.mnre import mnre_bp
from routes.payments import payment_bp
from routes.loans import loan_bp
from routes.kseb import kseb_bp
from routes.service import service_bp
from routes.material_delivery import material_delivery_bp
from routes.installation import installation_bp

load_dotenv()


def create_app():
    app = Flask(
        __name__,
        static_url_path="",
        static_folder="../frontend/build"
    )

    # ================= CONFIG =================
    app.config.from_object(Config)

    # ================= EXTENSIONS =================
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    

    CORS(app, supports_credentials=True, origins=[
        "http://localhost:3000",
        "https://solar-flow-jet.vercel.app"
    ])

    # ================= BLUEPRINTS =================
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(customer_bp, url_prefix="/api/customers")
    app.register_blueprint(site_visit_bp, url_prefix="/api/site-visits")
    app.register_blueprint(mnre_bp, url_prefix="/api/mnre")
    app.register_blueprint(payment_bp, url_prefix="/api/payments")
    app.register_blueprint(loan_bp, url_prefix="/api/loans")
    app.register_blueprint(kseb_bp, url_prefix="/api/kseb")
    app.register_blueprint(service_bp, url_prefix="/api/services")
    app.register_blueprint(material_delivery_bp, url_prefix="/api/material-deliveries")
    app.register_blueprint(installation_bp, url_prefix="/api/installations")
    # ================= AUTO CREATE TABLES (OPTION 2) =================
    with app.app_context():
        db.create_all()

    # ================= ROUTES =================
    @app.route("/")
    def index():
        return jsonify({
            "message": "Solar Project Manager API",
            "status": "running"
        })

    @app.route("/api")
    def api_root():
        return jsonify({"status": "API running"})

    # ================= STATIC FILES =================
    @app.route("/backend/static/uploads/<path:filename>")
    def uploaded_file(filename):
        # Check backend/backend/static/uploads first
        backend_upload_path = os.path.join(os.path.dirname(__file__), "static", "uploads")
        if os.path.exists(os.path.join(backend_upload_path, filename)):
            return send_from_directory(backend_upload_path, filename)
        
        # Check project root static/uploads
        project_root = os.path.dirname(os.path.dirname(__file__))
        root_upload_path = os.path.join(project_root, "static", "uploads")
        if os.path.exists(os.path.join(root_upload_path, filename)):
            return send_from_directory(root_upload_path, filename)
        
        return jsonify({"message": "File not found"}), 404

    # ================= JWT ERRORS =================
    @jwt.invalid_token_loader
    def invalid_token(error):
        return jsonify({"message": "Invalid token"}), 401

    @jwt.unauthorized_loader
    def missing_token(error):
        return jsonify({"message": "Token missing"}), 401

    @jwt.expired_token_loader
    def expired_token(jwt_header, jwt_payload):
        return jsonify({"message": "Token expired"}), 401

    # ================= GLOBAL ERROR HANDLERS =================
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        print(f"Internal Server Error: {str(error)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error", "message": str(error)}), 500

    return app


# ================= RUN APP =================
if __name__ == "__main__":
    app = create_app()

    # Ensure upload folder exists
    upload_path = os.path.join(os.path.dirname(__file__), "static", "uploads")
    os.makedirs(upload_path, exist_ok=True)

    app.run(debug=True, host="0.0.0.0", port=5000)