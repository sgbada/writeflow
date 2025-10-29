from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from . import services
from .schemas import SignupIn, LoginIn, TokenPair, UserOut
from .deps import get_current_user
from app.core.security import decode_refresh

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup", response_model=UserOut, status_code=201)
async def signup(payload: SignupIn, session: AsyncSession = Depends(get_session)):
    print("PWD_DEBUG", repr(payload.password), len(payload.password.encode("utf-8")))
    if await services.find_user_by_email(session, payload.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = await services.create_user(session, payload.email, payload.password, payload.role)
    return user

@router.post("/login", response_model=TokenPair)
async def login(payload: LoginIn, session: AsyncSession = Depends(get_session)):
    user = await services.find_user_by_email(session, payload.email)
    if not user or not services.check_password(payload.password, user):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    tokens = services.issue_tokens_by_claims(user.email, user.role.value)
    return TokenPair(**tokens)

@router.get("/me", response_model=UserOut)
async def me(current=Depends(get_current_user)):
    return current

@router.post("/refresh", response_model=TokenPair)
async def refresh(token: str):
    try:
        payload = decode_refresh(token)
        if payload.get("type") != "refresh":
            raise ValueError("invalid type")
        email = payload["sub"]; role = payload["role"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    return TokenPair(**services.issue_tokens_by_claims(email, role))

