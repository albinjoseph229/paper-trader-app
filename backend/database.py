# backend/database.py

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Read the DATABASE_URL environment variable provided by Render
DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Add logic to switch between your live and local databases
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    # If the Render URL is found, use it (and fix the prefix for SQLAlchemy)
    SQLALCHEMY_DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
else:
    # Otherwise, fall back to your local MySQL database for development
    SQLALCHEMY_DATABASE_URL = "mysql+mysqlconnector://root@localhost/paper_trading"


# Create the SQLAlchemy engine with the correct URL
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create a SessionLocal class. Each instance of this class will be a database session.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class. Our ORM models will inherit from this class.
Base = declarative_base()

# Dependency to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()