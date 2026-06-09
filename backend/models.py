from datetime import datetime
from extensions import db
import os
import json

# =========================
# CONSTANTS
# =========================

DEFAULT_IMAGE = "https://kommodo.ai/i/KwK1jbRDvnZNthQanKSt"


# =========================
# USER MODEL
# =========================
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    mobile = db.Column(db.String(25), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    customers = db.relationship(
        "Customer",
        backref="user",
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "mobile": self.mobile,
            "created_at": self.created_at.isoformat(),
        }


# =========================
# CUSTOMER MODEL
# =========================
class Customer(db.Model):
    __tablename__ = "customers"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(140), nullable=False)
    place = db.Column(db.String(140), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    mobile = db.Column(db.String(25), nullable=False)
    email = db.Column(db.String(180), nullable=True)

    # ================= ADDRESS =================
    house_name = db.Column(db.String(150), nullable=True)
    street = db.Column(db.String(150), nullable=True)
    area = db.Column(db.String(150), nullable=True)
    landmark = db.Column(db.String(150), nullable=True)

    city = db.Column(db.String(100), nullable=True)
    district = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)

    pincode = db.Column(db.String(10), nullable=True)

    # ================= META =================
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    profile_photo = db.Column(
        db.String(255),
        nullable=True,
        default=DEFAULT_IMAGE
    )

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    # ================= SAFE IMAGE HANDLING =================
    def get_safe_image(self):
        # Fallback to default if no image reference is assigned
        if not self.profile_photo:
            return DEFAULT_IMAGE
            
        # If it points to an external cloud storage resource, return it directly
        if self.profile_photo.startswith("http://") or self.profile_photo.startswith("https://"):
            return self.profile_photo
            
        return self.profile_photo

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "place": self.place,
            "capacity": self.capacity,
            "mobile": self.mobile,
            "email": self.email,

            # Address
            "house_name": self.house_name,
            "street": self.street,
            "area": self.area,
            "landmark": self.landmark,

            "city": self.city,
            "district": self.district,
            "state": self.state,
            "pincode": self.pincode,

            # Meta
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "profile_photo": self.profile_photo,
            "user_id": self.user_id,
        }


# =========================
# SITE VISIT MODEL
# =========================
class SiteVisit(db.Model):
    __tablename__ = "site_visits"

    id = db.Column(db.Integer, primary_key=True)

    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False, unique=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    # ================= FILES =================
    location = db.Column(db.String(255), nullable=True)
    quotation_file = db.Column(db.String(255), nullable=True)
    agreement_file = db.Column(db.String(255), nullable=True)

    # ================= IMAGES =================
    images = db.Column(db.Text, nullable=True)  

    # ================= TECH DETAILS =================
    panel_capacity = db.Column(db.Float, nullable=True)
    system_capacity = db.Column(db.Float, nullable=True)

    feasibility = db.Column(db.String(10), nullable=True)  # Yes / No

    comments = db.Column(db.Text, nullable=True)

    project_cost = db.Column(db.Float, nullable=True)

    # ================= DOCUMENTS =================
    aadhaar = db.Column(db.String(255), nullable=True)
    pan = db.Column(db.String(255), nullable=True)
    kseb_bill = db.Column(db.String(255), nullable=True)
    bank_passbook = db.Column(db.String(255), nullable=True)
    land_tax = db.Column(db.String(255), nullable=True)
    building_tax = db.Column(db.String(255), nullable=True)
    signature = db.Column(db.String(255), nullable=True)

 
    # ================= FLAGS =================
    load_enhancement = db.Column(db.String(10), nullable=True)  # Yes / No
    ownership_change = db.Column(db.String(10), nullable=True)   # Yes / No

    # ================= META =================
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # ================= RELATIONSHIPS =================
    customer = db.relationship("Customer", backref="site_visits")
    user = db.relationship("User", backref="site_visits")

    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "user_id": self.user_id,

            "location": self.location,
            "quotation_file": self.quotation_file,
            "agreement_file": self.agreement_file,

            "images": self.images,

            "panel_capacity": self.panel_capacity,
            "system_capacity": self.system_capacity,
            "feasibility": self.feasibility,
            "comments": self.comments,
            "project_cost": self.project_cost,

            "aadhaar": self.aadhaar,
            "pan": self.pan,
            "kseb_bill": self.kseb_bill,
            "bank_passbook": self.bank_passbook,
            "land_tax": self.land_tax,
            "building_tax": self.building_tax,
            "signature": self.signature,

            "load_enhancement": self.load_enhancement,
            "ownership_change": self.ownership_change,

            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
    


class Mnre(db.Model):
    __tablename__ = "mnre_data"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False, unique=True)
    enabled = db.Column(db.Boolean, default=True)
    mnre_status = db.Column(db.String(50), nullable=True)
    comments = db.Column(db.Text, nullable=True)
    feasibility_file = db.Column(db.String(255), nullable=True)
    ack_file = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "enabled": self.enabled,
            "mnre_status": self.mnre_status,
            "comments": self.comments,
            "feasibility_file": self.feasibility_file,
            "ack_file": self.ack_file,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)

    customer_id = db.Column(
        db.Integer,
        db.ForeignKey("customers.id"),
        nullable=False,
        unique=True
    )

    advance = db.Column(db.Float, nullable=True)
    second = db.Column(db.Float, nullable=True)
    third = db.Column(db.Float, nullable=True)
    balance_due = db.Column(db.Float, nullable=True, default=0)
    total_received = db.Column(db.Float, nullable=True, default=0)

    comments = db.Column(db.Text, nullable=True)
    payment_proofs = db.Column(db.JSON, nullable=True, default=list)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    customer = db.relationship("Customer", backref="payment")
    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "advance": self.advance,
            "second": self.second,
            "third": self.third,
            "balance_due": self.balance_due,
            "total_received": self.total_received,
            "comments": self.comments,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "payment_proofs": self.payment_proofs,
        }
    


class Loan(db.Model):
    __tablename__ = "loans"

    id = db.Column(db.Integer, primary_key=True)

    customer_id = db.Column(
        db.Integer,
        db.ForeignKey("customers.id"),
        nullable=False,
        unique=True
    )

    enabled = db.Column(db.Boolean, default=True)

    status = db.Column(db.String(50), default="Pending")
    submission = db.Column(db.String(50),nullable=True)

    comments = db.Column(db.Text, nullable=True)
    extra_comments = db.Column(db.Text , nullable=True)

    first_payment = db.Column(db.Float, default=0)
    second_payment = db.Column(db.Float, default=0)
    total_loan_amount = db.Column(db.Float, default=0)

    ack_file = db.Column(db.String(255))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    customer = db.relationship("Customer", backref="loan", uselist=False)

    @property
    def total_amount(self):
        return (self.first_payment or 0) + (self.second_payment or 0)

    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "enabled": self.enabled,
            "status": self.status,
            "submission": self.submission,
            "comments": self.comments,
            "extra_comments": self.extra_comments,
            "first_payment": self.first_payment,
            "second_payment": self.second_payment,
            "total_loan_amount": self.total_loan_amount,
            "total_amount": self.total_amount,
            "ack_file": self.ack_file,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
    


class Kseb(db.Model):
    __tablename__ = "kseb_data"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False, unique=True)
    name_change = db.Column(db.String(10), nullable=True)  # Yes / No
    name_change_status = db.Column(db.String(50), nullable=True)
    name_change_comment = db.Column(db.Text, nullable=True)
    load_enhance = db.Column(db.String(10), nullable=True)  # Yes / No
    load_enhance_status = db.Column(db.String(50), nullable=True)
    load_enhance_comment = db.Column(db.Text, nullable=True)
    feasibility = db.Column(db.String(10), nullable=True)  # Yes / No
    fee_paid = db.Column(db.String(10), nullable=True)  # Yes / No
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = db.relationship("Customer", backref="kseb", uselist=False)
    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "name_change": self.name_change,
            "name_change_status": self.name_change_status,
            "name_change_comment": self.name_change_comment,
            "load_enhance": self.load_enhance,
            "load_enhance_status": self.load_enhance_status,
            "load_enhance_comment": self.load_enhance_comment,
            "feasibility": self.feasibility,
            "fee_paid": self.fee_paid,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class KsebRegistration(db.Model):
    __tablename__ = "kseb_registrations"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False, unique=True)
    
    registration_submitted = db.Column(db.Boolean, default=False)
    completion_submitted = db.Column(db.Boolean, default=False)
    agreement_submitted = db.Column(db.Boolean, default=False)
    payment_done = db.Column(db.Boolean, default=False)
    plant_energized = db.Column(db.Boolean, default=False)
    wifi = db.Column(db.Boolean, default=False)
    wifi_configured = db.Column(db.Boolean, default=False)
    
    comments = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    customer = db.relationship("Customer", backref="kseb_registration", uselist=False)
    
    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "registration_submitted": self.registration_submitted,
            "completion_submitted": self.completion_submitted,
            "agreement_submitted": self.agreement_submitted,
            "payment_done": self.payment_done,
            "plant_energized": self.plant_energized,
            "wifi": self.wifi,
            "wifi_configured": self.wifi_configured,
            "comments": self.comments,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Dcr(db.Model):
    __tablename__ = "dcrs"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False, unique=True)
    
    certificate_received = db.Column(db.Boolean, default=False)
    certificate_claimed = db.Column(db.Boolean, default=False)
    certificate_sold = db.Column(db.Boolean, default=False)
    
    comments = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    customer = db.relationship("Customer", backref="dcr", uselist=False)
    
    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "certificate_received": self.certificate_received,
            "certificate_claimed": self.certificate_claimed,
            "certificate_sold": self.certificate_sold,
            "comments": self.comments,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class MnreInstallation(db.Model):
    __tablename__ = "mnre_installations"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False, unique=True)
    
    installation_status = db.Column(db.String(50), nullable=True)
    installation_comments = db.Column(db.Text, nullable=True)
    
    approval_status = db.Column(db.String(50), nullable=True)
    approval_comments = db.Column(db.Text, nullable=True)
    
    subsidy_status = db.Column(db.String(50), nullable=True)
    subsidy_comments = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    customer = db.relationship("Customer", backref="mnre_installation", uselist=False)
    
    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "installation_status": self.installation_status,
            "installation_comments": self.installation_comments,
            "approval_status": self.approval_status,
            "approval_comments": self.approval_comments,
            "subsidy_status": self.subsidy_status,
            "subsidy_comments": self.subsidy_comments,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Service(db.Model):
    __tablename__ = "services"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False)

    service_date = db.Column(db.Date, nullable=False)
    images = db.Column(db.Text)  # JSON list
    comments = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    customer = db.relationship("Customer", backref="services")

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "date": str(self.service_date),
            "images": json.loads(self.images) if self.images else [],
            "comments": self.comments,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    


class MaterialDelivery(db.Model):
    __tablename__ = "material_delivery"

    id = db.Column(db.Integer, primary_key=True)

    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False)

    changes = db.Column(db.Text)
    extra_material = db.Column(db.Text)
    structure_changes = db.Column(db.Text)

    electrical_delivered = db.Column(db.Boolean, default=False)
    structure_delivered = db.Column(db.Boolean, default=False)
    panel_delivered = db.Column(db.Boolean, default=False)

    comments = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = db.relationship("Customer", backref="material_delivery")
    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "changes": self.changes,
            "extra_material": self.extra_material,
            "structure_changes": self.structure_changes,
            "electrical_delivered": self.electrical_delivered,
            "structure_delivered": self.structure_delivered,
            "panel_delivered": self.panel_delivered,
            "comments": self.comments,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    


class Installation(db.Model):
    __tablename__ = "installations"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False)

    electrical_installed = db.Column(db.Boolean, default=False)
    electrical_comments = db.Column(db.Text)

    structure_installed = db.Column(db.Boolean, default=False)
    structure_comments = db.Column(db.Text)

    geo_images = db.Column(db.JSON, nullable=True, default=[])

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    customer = db.relationship("Customer", backref="installation")

    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "electrical_installed": self.electrical_installed,
            "electrical_comments": self.electrical_comments,
            "structure_installed": self.structure_installed,
            "structure_comments": self.structure_comments,
            "geo_images": self.geo_images or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }