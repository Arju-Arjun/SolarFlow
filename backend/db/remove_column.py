# import sys
# import os

# sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# from app import create_app
# from extensions import db
# from sqlalchemy import text

# app = create_app()

# tables = "payments"


# #remove all rows from mnre_data
# # with app.app_context():
# #     sql = f"DELETE FROM {tables}"
# #     db.session.execute(text(sql))
# #     db.session.commit()
# #     print(f"✓ All rows removed from '{tables}'")


# #specific row from payments where customer_id = 1
# # with app.app_context():
# #     sql = f"DELETE FROM {tables} WHERE customer_id = 1"
# #     db.session.execute(text(sql))
# #     db.session.commit()
# #     print(f"✓ Row with customer_id=1 removed from '{tables}'")


# #remove table
# with app.app_context():
#     sql = f"DROP TABLE IF EXISTS {tables}"
#     db.session.execute(text(sql))
#     db.session.commit()
#     print(f"✓ Table '{tables}' removed")



# # #remove columns email and mobile from site_visits
# # column = ["email", "mobile"]

# # with app.app_context():
# #     for col in column:
# #         sql = f"ALTER TABLE {tables} DROP COLUMN {col}"
# #         db.session.execute(text(sql))
# #         db.session.commit()
# #         print(f"✓ Column '{col}' removed from '{tables}'")

# # #remove table
# # with app.app_context():
# #     for table in tables:
# #         sql = f"DROP TABLE IF EXISTS {table}"
# #         db.session.execute(text(sql))
# #     db.session.commit()
# #     print(f"✓ Table '{table}' removed")



# # #update null column values to default.png 
# # with app.app_context():
# #     sql = f"UPDATE {table} SET {column} = '/backend/static/uploads/default.png' WHERE {column} IS NULL"
# #     db.session.execute(text(sql))
# #     db.session.commit()
# #     print(f"✓ Updated NULL values in '{column}' to default image")

# # with app.app_context():
# #     sql = f"ALTER TABLE {table} DROP COLUMN {column}"
# #     db.session.execute(text(sql))
# #     db.session.commit()
# #     print(f"✓ Column '{column}' removed")




import sqlite3

db_path = r"C:\Users\ARJUN K\Desktop\Lavenir solar\instance\solar_manager.db"

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# cursor.execute("DROP TABLE IF EXISTS material_delivery")
#create colum balance_due in payments table
cursor.execute("""
    ALTER TABLE payments
    ADD COLUMN balance_due DECIMAL(10,2) DEFAULT 0
""")

conn.commit()
conn.close()

print("Balance due column added  successfully")