import sqlite3
import os

db_path = r"C:\Users\ARJUN K\Desktop\Lavenir solar\instance\solar_manager.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("Tables:", [t[0] for t in tables])

# Search for the missing filename in all tables
search_term = 'c3d25a'
for table in tables:
    table_name = table[0]
    try:
        cursor.execute(f"SELECT * FROM {table_name}")
        columns = [desc[0] for desc in cursor.description]
        for row in cursor.fetchall():
            row_str = str(row)
            if search_term in row_str:
                print(f"\nFound in {table_name}:")
                print(f"  Columns: {columns}")
                print(f"  Row: {row}")
    except:
        pass

conn.close()