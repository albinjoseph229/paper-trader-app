# backend/database.py

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Read the DATABASE_URL environment variable
DATABASE_URL = os.getenv("DATABASE_URL")

# --- DEBUGGING STEP: Print the value to the logs ---
print(f"--- DATABASE_URL from environment: {DATABASE_URL} ---")
# ----------------------------------------------------

# 2. Logic to switch between live and local databases
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    print("--- Using PostgreSQL database ---")
    SQLALCHEMY_DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
else:
    print("--- DATABASE_URL not found, falling back to local MySQL ---")
    SQLALCHEMY_DATABASE_URL = "mysql+mysqlconnector://root@localhost/paper_trading"


# Create the SQLAlchemy engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create a SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class
Base = declarative_base()

# Dependency to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()