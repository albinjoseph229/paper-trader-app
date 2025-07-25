# backend/database.py

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Read the DATABASE_URL environment variable provided by Render
DATABASE_URL = os.getenv("DATABASE_URL")

# Logic to switch between live and local databases
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    # If the Render URL is found, use it
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
else:
    # Otherwise, fall back to your local MySQL database for development
    SQLALCHEMY_DATABASE_URL = "mysql+mysqlconnector://root@localhost/paper_trading"


# Create the SQLAlchemy engine with the correct URL
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