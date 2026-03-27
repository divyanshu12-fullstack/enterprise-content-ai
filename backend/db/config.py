from os import getenv


def database_url() -> str:
    url = getenv("DATABASE_URL")
    if not url:
        raise ValueError("DATABASE_URL is not set. Configure your Neon PostgreSQL URL.")
    return url


def jwt_secret() -> str:
    secret = getenv("JWT_SECRET")
    if not secret:
        raise ValueError("JWT_SECRET is not set.")
    return secret


def encryption_key() -> str:
    key = getenv("ENCRYPTION_KEY")
    if not key:
        raise ValueError("ENCRYPTION_KEY is not set.")
    return key


def access_token_expire_minutes() -> int:
    value = getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    return int(value)


def auto_create_db() -> bool:
    return getenv("DB_AUTO_CREATE", "true").lower() == "true"
