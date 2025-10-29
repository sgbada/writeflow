from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .models import User
from .types import UserRole
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token

async def find_user_by_email(session: AsyncSession, email: str) -> User | None:
    return (await session.execute(select(User).where(User.email == email))).scalar_one_or_none()

async def create_user(session: AsyncSession, email: str, password: str, role: UserRole | None) -> User:
    user = User(email=email, hashed_password=hash_password(password), role=role or UserRole.Author)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user

def check_password(raw: str, user: User) -> bool:
    return verify_password(raw, user.hashed_password)

def issue_tokens_by_claims(email: str, role: str) -> dict:
    return {
        "access_token": create_access_token(sub=email, role=role),
        "refresh_token": create_refresh_token(sub=email, role=role),
    }

