import sqlite3
conn = sqlite3.connect('career_ai.db')
c = conn.cursor()
c.execute("UPDATE users SET is_profile_complete = 1, is_verified = 1 WHERE email = 'nandini.singh@indoreinstitute.com'")
conn.commit()
print("Fixed! Rows updated:", c.rowcount)
conn.close()
