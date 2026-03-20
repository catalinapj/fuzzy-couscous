"""
Seed script — populates the dev database with sample users.
Run from the api/ directory:  python seed.py
"""

from sqlalchemy import text
from app.database import engine, SessionLocal, Base
from app.models import User
from app.core.security import hash_password


Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:

    existing = db.query(User).count()
    if existing > 0:
        print(f"Database already has {existing} users — skipping seed.")
        raise SystemExit(0)

    password = hash_password("password123")

    users = [
        User(email=f"user-{i}@mail.com", username=f"user-{i}", hashed_password=password)
        for i in range(1, 101)
    ]

    db.add_all(users)
    db.commit()

    print(f"Seeded {len(users)} users.")

except SystemExit:
    pass
except Exception as e:

    db.rollback()
    print(f"Seed failed: {e}")
finally:

    db.close()
