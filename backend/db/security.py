from datetime import datetime, timedelta, timezone

from cryptography.fernet import Fernet, InvalidToken
from jose import JWTError, jwt
from passlib.context import CryptContext

from db.config import access_token_expire_minutes, encryption_key, jwt_secret

ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(subject: str) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=access_token_expire_minutes())
    to_encode = {"sub": subject, "iat": int(now.timestamp()), "exp": int(expire.timestamp())}
    return jwt.encode(to_encode, jwt_secret(), algorithm=ALGORITHM)


def decode_access_token(token: str) -> str:
    payload = jwt.decode(token, jwt_secret(), algorithms=[ALGORITHM])
    subject = payload.get("sub")
    if not subject:
        raise JWTError("Token subject missing")
    return subject


def encrypt_secret(raw_value: str) -> str:
    cipher = Fernet(encryption_key().encode("utf-8"))
    return cipher.encrypt(raw_value.encode("utf-8")).decode("utf-8")


def decrypt_secret(ciphertext: str) -> str:
    cipher = Fernet(encryption_key().encode("utf-8"))
    try:
        return cipher.decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise ValueError("Failed to decrypt secret") from exc
