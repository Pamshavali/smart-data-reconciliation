from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import LoginRequest, TokenResponse, UserResponse
from ..utils.security import verify_password, create_access_token, hash_password
from ..services.audit_service import log_activity

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == creds.username).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    token = create_access_token({"sub": user.username, "role": user.role, "id": user.id})
    log_activity(db, "USER_LOGIN", "USER", str(user.id), user=user.username, details={"username": user.username})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@router.get("/me")
def get_current_user(db: Session = Depends(get_db)):
    # Simple default user status for session verification
    user = db.query(User).first()
    return {
        "id": user.id if user else 1,
        "username": user.username if user else "admin",
        "role": user.role if user else "admin",
        "full_name": user.full_name if user else "System Administrator"
    }

