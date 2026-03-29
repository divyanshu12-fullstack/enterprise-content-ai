import uuid
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, select

from api.deps import get_current_user
from db.models import User
from db.security import create_access_token, hash_password, verify_password, pwd_context
from db.session import get_session

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[^a-zA-Z0-9]", v):
            raise ValueError("Password must contain at least one symbol")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str


class UserProfileResponse(BaseModel):
    id: str
    email: str
    is_active: bool


@router.post("/signup", response_model=AuthTokenResponse)
def signup(payload: SignupRequest, session: Session = Depends(get_session)) -> AuthTokenResponse:
    try:
        existing = session.exec(select(User).where(User.email == payload.email)).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

        user = User(email=payload.email, password_hash=hash_password(payload.password))
        session.add(user)
        session.commit()
        session.refresh(user)

        token = create_access_token(str(user.id))
        return AuthTokenResponse(access_token=token, user_id=str(user.id), email=user.email)
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while creating account",
        ) from exc


@router.post("/login", response_model=AuthTokenResponse)
def login(payload: LoginRequest, session: Session = Depends(get_session)) -> AuthTokenResponse:
    try:
        user = session.exec(select(User).where(User.email == payload.email, User.is_active)).first()
        if not user:
            pwd_context.dummy_verify()
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        user.updated_at = datetime.now(timezone.utc)
        session.add(user)
        session.commit()

        token = create_access_token(str(user.id))
        return AuthTokenResponse(access_token=token, user_id=str(user.id), email=user.email)
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while logging in",
        ) from exc


@router.get("/me", response_model=UserProfileResponse)
def me(current_user: User = Depends(get_current_user)) -> UserProfileResponse:
    return UserProfileResponse(id=str(current_user.id), email=current_user.email, is_active=current_user.is_active)
