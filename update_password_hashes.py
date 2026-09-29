import sqlite3
import glob

dbs = glob.glob('**/database.sqlite', recursive=True)

# Valid BCRYPT_ROUNDS=12 hash for 'password'
HASH_PASSWORD_12 = "$2y$12$sGW10dor/L0rv960i8ZaB.U7yVY0GWRJbAG9QDYbF385UQ8BMfnZu"
# Valid BCRYPT_ROUNDS=12 hash for '1234'
HASH_PIN_12 = "$2y$12$kGnA1GxSYE3.YgYlxoHZgOlhQjc01gqz0JZJc35N.EO.QKjaSB6ia"

for db_path in dbs:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [t[0] for t in cursor.fetchall()]
        
        if 'users' in tables:
            cursor.execute("UPDATE users SET password = ?;", (HASH_PASSWORD_12,))
            print(f"Updated users password in {db_path}")
            
        if 'tenant_users' in tables:
            cursor.execute("UPDATE tenant_users SET security_pin = ?;", (HASH_PIN_12,))
            print(f"Updated tenant_users security_pin in {db_path}")
            
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error updating {db_path}: {e}")
