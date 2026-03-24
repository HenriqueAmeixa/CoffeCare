from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Por padrão, usa um banco SQLite se a variável de ambiente não existir
# Ao configurar o Neon, passaremos a URL via DATABASE_URL
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./coffecare.db")

# Ajuste para SQLite não dar erro com multiplas threads no FastAPI
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependência para injetar o DB session nas rotas
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
