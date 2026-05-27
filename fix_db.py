import sqlite3

db_path = r"C:\Users\ARJUN K\Desktop\Lavenir solar\instance\solar_manager.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Update the images column to NULL for site_visit id=1
cursor.execute("UPDATE site_visits SET images = NULL WHERE id = 1")

conn.commit()
print("Updated site_visits SET images = NULL WHERE id = 1")

# Verify
cursor.execute("SELECT id, images FROM site_visits WHERE id = 1")
print(f"Result: {cursor.fetchone()}")

conn.close()