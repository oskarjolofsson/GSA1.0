from sqlalchemy import create_engine
import os
import dotenv

dotenv.load_dotenv()

# DB connections go through the Supabase TRANSACTION pooler (port 6543), which
# is built for many short web requests: it returns the Postgres backend to its
# pool after each transaction and allows a high client-connection limit.
#
# Pool sizing is deliberately bounded so that, across gunicorn workers, total
# client connections to the pooler stay comfortable. With `-w 2`:
#     2 workers x (pool_size 5 + max_overflow 5) = up to 20 client connections,
# which the transaction pooler handles easily (session-mode's 15 cap does not
# apply here). pool_pre_ping drops dead connections; pool_recycle avoids stale
# ones the pooler may have closed.
#
# NOTE: requires DATABASE_URL to point at the transaction pooler (port 6543),
# NOT the session pooler (5432). The session pooler caps at 15 clients and was
# the cause of "max clients reached in session mode".
engine = create_engine(
    os.getenv("DATABASE_URL"),
    pool_size=5,
    max_overflow=5,
    pool_timeout=30,
    pool_recycle=300,
    pool_pre_ping=True,
)
