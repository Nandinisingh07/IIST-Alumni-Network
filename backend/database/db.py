import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load env variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./career_ai.db")

# Automatically fallback to SQLite if PostgreSQL connection fails
try:
    if DATABASE_URL.startswith("postgresql"):
        # Quick check if database can connect
        temp_engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 3})
        with temp_engine.connect() as conn:
            pass
        engine = temp_engine
        print("[DATABASE] Connected to PostgreSQL")
    else:
        raise ValueError("Use SQLite")
except Exception as e:
    print(f"[DATABASE] PostgreSQL connection failed: {e}. Falling back to SQLite")
    # Set SQLite URL
    DATABASE_URL = "sqlite:///./career_ai.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()