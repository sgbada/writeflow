from pydantic import BaseModel, EmailStr
from .types import UserRole

class SignupIn(BaseModel):
    email: EmailStr
    password: str
    role: UserRole | None = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: UserRole
    is_active: bool
    class Config:
        from_attributes = True

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

