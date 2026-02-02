from sqlalchemy import create_engine
import os
import dotenv

dotenv.load_dotenv()

engine = create_engine(
    os.getenv("DATABASE_URL"),
    pool_pre_ping=True,
)