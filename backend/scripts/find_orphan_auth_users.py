"""
Find (and optionally delete) Supabase auth users that have no profile row.

An auth user without a profile is invisible everywhere the admin panel looks --
it lists `profiles` -- yet it still signs in, and `handle_new_user` only fires on
INSERT into auth.users, so the profile is never recreated. Accounts in that state
were produced by the old delete path, which removed the profile without confirming
the auth user was gone.

Dry run by default; --apply deletes. Prints the target project first, because
backend/.env and env.local-supabase both exist and pointing DATABASE_URL and
SUPABASE_URL at different projects is exactly how orphans get made.

Run from the backend/ directory:

    python -m scripts.find_orphan_auth_users            # report
    python -m scripts.find_orphan_auth_users --apply    # report, then delete
"""

import os
import sys

import dotenv

# Make `core` importable when run as a plain script from backend/.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
dotenv.load_dotenv()

from sqlalchemy import text  # noqa: E402
from supabase import create_client  # noqa: E402

from core.config import SUPABASE_URL, SUPABASE_SERVICE_ROLL_KEY  # noqa: E402
from core.infrastructure.db.engine import engine  # noqa: E402

PAGE_SIZE = 1000


def _all_auth_users(admin) -> list:
    users = []
    page = 1
    while True:
        batch = admin.list_users(page=page, per_page=PAGE_SIZE)
        users.extend(batch)
        # A short page is the last one. Stopping only on an empty page would spin
        # forever if the API ever repeated a full page.
        if len(batch) < PAGE_SIZE:
            return users
        page += 1


def main() -> None:
    apply = "--apply" in sys.argv

    print(f"auth project: {SUPABASE_URL}")
    with engine.connect() as connection:
        print(f"database:     {connection.engine.url.render_as_string(hide_password=True)}")
        profile_ids = {
            str(row[0]) for row in connection.execute(text("SELECT id FROM profiles"))
        }

    admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLL_KEY).auth.admin
    auth_users = _all_auth_users(admin)

    orphans = [user for user in auth_users if str(user.id) not in profile_ids]

    print(f"auth users: {len(auth_users)}, profiles: {len(profile_ids)}")
    print(f"orphans (auth user, no profile): {len(orphans)}")
    for user in orphans:
        print(f"  {user.id}  {user.email}  created {user.created_at}")

    if not orphans:
        return

    if not apply:
        print("\ndry run — re-run with --apply to delete the accounts listed above")
        return

    # Deleting an auth account is irreversible, so --apply alone is not enough:
    # the operator has to retype the count they just read, against the project
    # named above.
    answer = input(f"\ndelete these {len(orphans)} accounts from {SUPABASE_URL}? "
                   f"type the number to confirm: ").strip()
    if answer != str(len(orphans)):
        print("not confirmed — nothing deleted")
        return

    for user in orphans:
        admin.delete_user(str(user.id))
        print(f"deleted {user.id}  {user.email}")


if __name__ == "__main__":
    main()
