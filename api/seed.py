"""
Seed script — populates the dev database with sample users and messages.
Run from the api/ directory:  python seed.py
"""

import random

from app.database import engine, SessionLocal, Base
from app.models import User, Message
from app.core.security import hash_password


Base.metadata.create_all(bind=engine)

db = SessionLocal()

SAMPLE_MESSAGES = [
    "Hey, how are you?",
    "Not bad, you?",
    "Working on the chat app",
    "Nice! How's it going?",
    "Almost done with the backend",
    "That's awesome",
    "Want to grab coffee later?",
    "Sure, let me know when",
    "How about 3pm?",
    "Sounds good!",
    "Did you see the new feature?",
    "Yeah, looks great",
    "Thanks for the help yesterday",
    "No problem at all",
    "See you tomorrow!",
]

try:
    existing_users = db.query(User).count()
    if existing_users == 0:
        password = hash_password("password123")
        users = [
            User(email=f"user-{i}@mail.com", username=f"user-{i}", hashed_password=password)
            for i in range(1, 101)
        ]
        db.add_all(users)
        db.commit()
        print(f"Seeded {len(users)} users.")
    else:
        print(f"Database already has {existing_users} users — skipping user seed.")

    existing_messages = db.query(Message).count()
    if existing_messages > 0:
        print(f"Database already has {existing_messages} messages — skipping message seed.")
        raise SystemExit(0)

    user_ids = [u.id for u in db.query(User.id).limit(10).all()]

    messages = []
    for i, uid in enumerate(user_ids[1:], start=1):
        num_messages = random.randint(3, 10)
        for j in range(num_messages):
            if random.random() < 0.5:
                sender, receiver = user_ids[0], uid
            else:
                sender, receiver = uid, user_ids[0]
            messages.append(
                Message(
                    sender_id=sender,
                    receiver_id=receiver,
                    content=random.choice(SAMPLE_MESSAGES),
                )
            )

    db.add_all(messages)
    db.commit()
    print(f"Seeded {len(messages)} messages across {len(user_ids) - 1} conversations.")

except SystemExit:
    pass
except Exception as e:
    db.rollback()
    print(f"Seed failed: {e}")
finally:
    db.close()
