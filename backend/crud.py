# backend/crud.py

from sqlalchemy.orm import Session
import models
import schemas
import security

import google.generativeai as genai
from config import GEMINI_API_KEY

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.hash_password(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def execute_buy_transaction(db: Session, user: models.User, trade_details: schemas.TradeRequest):
    # Use the live price sent from the frontend
    current_price = trade_details.price
    
    total_cost = current_price * trade_details.quantity

    # 1. Check if user has enough budget
    if user.budget < total_cost:
        return None # Indicates failure due to insufficient funds

    # 2. Update user's budget
    user.budget -= total_cost

    # 3. Create a new transaction record
    transaction = models.Transaction(
        user_id=user.id,
        stock_ticker=trade_details.ticker.upper(),
        transaction_type=models.TransactionType.BUY,
        quantity=trade_details.quantity,
        price_per_share=current_price,
        profit_or_loss=0.0 # Set P/L to 0 for BUY transactions
    )
    db.add(transaction)

    # 4. Check if user already holds this stock
    holding = db.query(models.Holding).filter(
        models.Holding.user_id == user.id,
        models.Holding.stock_ticker == trade_details.ticker.upper()
    ).first()

    if holding:
        # User already owns this stock, so update the holding
        current_total_value = holding.average_purchase_price * holding.quantity
        new_total_value = current_price * trade_details.quantity
        
        total_quantity = holding.quantity + trade_details.quantity
        
        holding.average_purchase_price = (current_total_value + new_total_value) / total_quantity
        holding.quantity = total_quantity
    else:
        # This is a new stock for the user, so create a new holding
        holding = models.Holding(
            user_id=user.id,
            stock_ticker=trade_details.ticker.upper(),
            quantity=trade_details.quantity,
            average_purchase_price=current_price
        )
        db.add(holding)
    
    db.commit()
    db.refresh(user) # Refresh user to get updated budget
    return user

def execute_sell_transaction(db: Session, user: models.User, trade_details: schemas.TradeRequest):
    # Use the live price sent from the frontend
    current_price = trade_details.price

    # 1. Check if user actually owns this stock
    holding = db.query(models.Holding).filter(
        models.Holding.user_id == user.id,
        models.Holding.stock_ticker == trade_details.ticker.upper()
    ).first()

    if not holding:
        return {"error": "Stock not owned"}

    # 2. Check if the user has enough quantity to sell
    if holding.quantity < trade_details.quantity:
        return {"error": "Insufficient quantity"}

    # 3. Calculate Profit/Loss for this transaction
    profit_or_loss = (current_price - holding.average_purchase_price) * trade_details.quantity

    # 4. Calculate proceeds and update budget
    total_proceeds = current_price * trade_details.quantity
    user.budget += total_proceeds

    # 5. Create a new "SELL" transaction record, including the P/L
    transaction = models.Transaction(
        user_id=user.id,
        stock_ticker=trade_details.ticker.upper(),
        transaction_type=models.TransactionType.SELL,
        quantity=trade_details.quantity,
        price_per_share=current_price,
        profit_or_loss=profit_or_loss
    )
    db.add(transaction)

    # 6. Update the holding
    if holding.quantity == trade_details.quantity:
        db.delete(holding)
    else:
        holding.quantity -= trade_details.quantity
    
    db.commit()
    db.refresh(user)
    
    return {"user": user, "profit_or_loss": profit_or_loss}

def get_dashboard_data(db: Session, user: models.User):
    return user

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

def get_ai_portfolio_analysis(user: models.User):
    if not user.holdings:
        return "No holdings to analyze. Start by buying some stocks."

    holdings_str = "\n".join(
        [f"- {h.stock_ticker}: {h.quantity} shares @ avg. ₹{h.average_purchase_price:.2f}" for h in user.holdings]
    )

    prompt = f"""
    Analyze the following stock portfolio for the Indian market. The user's budget is ₹{user.budget:.2f}.

    Current Holdings:
    {holdings_str}

    Please provide a brief analysis covering these points:
    1.  **Overall Summary:** A quick overview of the portfolio.
    2.  **Diversification:** Is the portfolio well-diversified or concentrated in a specific sector?
    3.  **Potential Strengths:** What are the strong points of this portfolio?
    4.  **Potential Risks:** What are the key risks?
    5.  **Suggestions:** Based on the holdings, suggest one or two potential stocks or sectors for future consideration to improve the portfolio.

    Keep the analysis concise and easy for a beginner to understand.
    """

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"An error occurred with the Gemini API: {e}")
        return "Could not generate AI analysis at this time. Please try again later."

# --- NEW FUNCTIONS FOR BUDGET AND RESET ---

def update_user_budget(db: Session, user: models.User, new_budget: float):
    """Updates the budget for a given user."""
    user.budget = new_budget
    db.commit()
    db.refresh(user)
    return user

def reset_user_account(db: Session, user: models.User):
    """Deletes all holdings and transactions for a user and resets their budget."""
    # Delete all transactions for the user
    db.query(models.Transaction).filter(models.Transaction.user_id == user.id).delete(synchronize_session=False)
    
    # Delete all holdings for the user
    db.query(models.Holding).filter(models.Holding.user_id == user.id).delete(synchronize_session=False)
    
    # Reset budget to the default value
    user.budget = 100000.00
    
    db.commit()
    db.refresh(user)
    return user