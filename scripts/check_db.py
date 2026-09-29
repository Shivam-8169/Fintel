import sqlite3

conn = sqlite3.connect('backend/fintel.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print('Tables:', [t[0] for t in tables])
for t in ['users', 'cases', 'audit_logs', 'invites']:
    if (t,) in tables:
        cursor.execute(f"PRAGMA table_info({t});")
        print(f"Columns in {t}:", [row[1] for row in cursor.fetchall()])
conn.close()
