from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_migrate import Migrate
from flask_cors import CORS


db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()
mail = Mail()
migrate = Migrate()
cors = CORS(origins=["http://localhost:3000", "http://127.0.0.1:3000"], supports_credentials=True)
