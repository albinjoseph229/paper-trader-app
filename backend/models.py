# backend/models.py

from sqlalchemy import Column, Integer, String, Float, Enum, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from database import Base

class TransactionType(enum.Enum):
    BUY = "BUY"
    SELL = "SELL"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    budget = Column(Float, default=100000.00)
    created_at = Column(TIMESTAMP, server_default=func.now())

    transactions = relationship("Transaction", back_populates="owner")
    holdings = relationship("Holding", back_populates="owner")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    stock_ticker = Column(String(20), nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_per_share = Column(Float, nullable=False)
    timestamp = Column(TIMESTAMP, server_default=func.now())
    
    # --- ADD THIS LINE ---
    # This will store the profit or loss from a sale. It can be null for buy transactions.
    profit_or_loss = Column(Float, nullable=True) 
    # --------------------

    owner = relationship("User", back_populates="transactions")


class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    stock_ticker = Column(String(20), nullable=False)
    quantity = Column(Integer, nullable=False)
    average_purchase_price = Column(Float, nullable=False)

    owner = relationship("User", back_populates="holdings")

