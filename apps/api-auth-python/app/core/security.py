from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import jwt
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")

def hash_password(raw: str) -> str:
    return pwd_context.hash(raw)

def verify_password(raw: str, hashed: str) -> bool:
    return pwd_context.verify(raw, hashed)

def _encode(payload: dict, secret: str, expire_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    to_encode = payload | {"iat": int(now.timestamp()), "exp": int((now + expire_delta).timestamp())}
    return jwt.encode(to_encode, secret, algorithm="HS256")

def create_access_token(sub: str, role: str) -> str:
    return _encode({"sub": sub, "role": role, "type": "access"},
                   settings.JWT_ACCESS_SECRET,
                   timedelta(minutes=settings.JWT_ACCESS_EXPIRE_MINUTES))

def create_refresh_token(sub: str, role: str) -> str:
    return _encode({"sub": sub, "role": role, "type": "refresh"},
                   settings.JWT_REFRESH_SECRET,
                   timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS))

def decode_access(token: str) -> dict:
    return jwt.decode(token, settings.JWT_ACCESS_SECRET, algorithms=["HS256"])

def decode_refresh(token: str) -> dict:
    return jwt.decode(token, settings.JWT_REFRESH_SECRET, algorithms=["HS256"])

