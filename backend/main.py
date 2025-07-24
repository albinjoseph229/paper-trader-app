# backend/main.py

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import JWTError, jwt
from fastapi.middleware.cors import CORSMiddleware

import models
import schemas
import crud
import security
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- CORS MIDDLEWARE CONFIGURATION ---
origins = [
    "http://localhost:5173",  # The address of your React frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SECURITY AND DEPENDENCY FUNCTIONS ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_active_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


# --- API ENDPOINTS ---

@app.get("/")
def read_root():
    return {"message": "Welcome to the Paper Trading API"}

@app.post("/register/", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user_email = crud.get_user_by_email(db, email=user.email)
    if db_user_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    db_user_username = crud.get_user_by_username(db, username=user.username)
    if db_user_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    return crud.create_user(db=db, user=user)

@app.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me/", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    return current_user

@app.post("/trade/buy/", response_model=schemas.User)
def buy_stock(
    trade_request: schemas.TradeRequest, 
    current_user: models.User = Depends(get_current_active_user), 
    db: Session = Depends(get_db)
):
    updated_user = crud.execute_buy_transaction(db=db, user=current_user, trade_details=trade_request)
    if updated_user is None:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    return updated_user


@app.post("/trade/sell/", response_model=schemas.SellTransactionResponse)
def sell_stock(
    trade_request: schemas.TradeRequest,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    result = crud.execute_sell_transaction(db=db, user=current_user, trade_details=trade_request)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@app.get("/dashboard/", response_model=schemas.User)
def get_user_dashboard(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return crud.get_dashboard_data(db=db, user=current_user)

@app.get("/portfolio/analysis/", response_model=dict)
def get_analysis(
    current_user: models.User = Depends(get_current_active_user)
):
    analysis_text = crud.get_ai_portfolio_analysis(user=current_user)
    return {"analysis": analysis_text}

# --- NEW ENDPOINTS FOR BUDGET AND RESET ---

@app.put("/users/me/budget", response_model=schemas.User)
def update_budget(
    budget_update: schemas.BudgetUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if budget_update.new_budget < 0:
        raise HTTPException(status_code=400, detail="Budget cannot be negative.")
    return crud.update_user_budget(db=db, user=current_user, new_budget=budget_update.new_budget)


@app.post("/users/me/reset", response_model=schemas.User)
def reset_account(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return crud.reset_user_account(db=db, user=current_user)
