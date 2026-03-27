from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from db.config import database_url

engine = create_engine(database_url(), pool_pre_ping=True)


def init_db() -> None:
    # Keep startup resilient in local/dev environments where Alembic may not have
    # been run yet. create_all is idempotent on existing tables.
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
