"""Manual end-to-end run of the v2 analysis against a running LOCAL backend.

Everything is real except the database, which is the local Supabase stack:
    real R2 upload through the presigned URL, real background job, real Gemini call.

Costs one Gemini call and puts one video in the R2 bucket (videos/<uuid>).

Setup it does against the local database, so the flow has something to run on:
    a throwaway user with a manual (comp) subscription, and, only if the miss has no
    law links yet, two smoke-test issues linked FACE / PATH and the miss mapped to both.

Usage (from backend/, with `supabase start` running):

    # terminal 1: the backend, pointed at the local stack
    eval "$(supabase status -o env)" && \\
      DATABASE_URL=$DB_URL SUPABASE_URL=$API_URL SUPABASE_ANON_KEY=$ANON_KEY \\
      SUPABASE_SERVICE_ROLL_KEY=$SERVICE_ROLE_KEY .venv/bin/uvicorn app.main:app --port 8000

    # terminal 2: this script
    .venv/bin/python scripts/smoke_analysis_v2.py uploads/video/golf.mp4
    .venv/bin/python scripts/smoke_analysis_v2.py my_swing.mp4 --miss HOOK --camera-view face_on
"""

import argparse
import json
import os
import subprocess
import sys
import time
import uuid
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))


def _point_at_local_stack() -> None:
    """Read the local stack's credentials and export them before any app module loads.
    Refuses to run if the stack is not up: this script writes users and subscriptions."""
    try:
        out = subprocess.run(
            ["supabase", "status", "-o", "env"], cwd=BACKEND, capture_output=True, text=True, check=True
        ).stdout
    except (subprocess.CalledProcessError, FileNotFoundError):
        sys.exit("Local Supabase is not running. Run `supabase start` in backend/ first.")
    env = dict(line.split("=", 1) for line in out.splitlines() if "=" in line)
    env = {k: v.strip().strip('"') for k, v in env.items()}
    os.environ["DATABASE_URL"] = env["DB_URL"]
    os.environ["SUPABASE_URL"] = env["API_URL"]
    os.environ["SUPABASE_ANON_KEY"] = env["ANON_KEY"]
    os.environ["SUPABASE_SERVICE_ROLL_KEY"] = env["SERVICE_ROLE_KEY"]
    if "127.0.0.1" not in os.environ["DATABASE_URL"] and "localhost" not in os.environ["DATABASE_URL"]:
        sys.exit(f"Refusing: DATABASE_URL is not local ({os.environ['DATABASE_URL']}).")


def _create_user() -> tuple[uuid.UUID, str]:
    from supabase import create_client

    url, anon, service = (os.environ[k] for k in ("SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLL_KEY"))
    email, password = f"smoke{uuid.uuid4().hex[:8]}@test.local", "SmokeTest123!"
    create_client(url, service).auth.admin.create_user(
        {"email": email, "password": password, "email_confirm": True, "user_metadata": {"name": "Smoke"}}
    )
    session = create_client(url, anon).auth.sign_in_with_password({"email": email, "password": password})
    return uuid.UUID(session.user.id), session.session.access_token


def _seed(user_id: uuid.UUID, area: str, miss: str) -> None:
    from core.infrastructure.db import models
    from core.infrastructure.db.repositories import taxonomy as taxonomy_repo
    from core.infrastructure.db.session import SessionLocal
    from core.services.admin_subscription_service import grant_manual_subscription

    with SessionLocal() as session:
        grant_manual_subscription(user_id, session)
        print(f"  subscription: manual comp granted to {user_id}")

        if taxonomy_repo.list_laws_for_miss(miss, session):
            print(f"  {miss} already has law links; using them")
        else:
            for rank, (law, title, description) in enumerate([
                ("FACE", "Smoke test: open clubface", "The face points right of the path at impact."),
                ("PATH", "Smoke test: over the top", "The club swings outside-in across the ball."),
            ], start=1):
                issue = models.Issue(title=title, description=description, area=area)
                session.add(issue)
                session.flush()
                session.add(models.IssueLaw(issue_id=issue.id, law=law, rank=1))
                session.add(models.TaxonomyMissLaw(miss=miss, law=law, rank=rank))
                drill = models.Drill(title=f"{title} drill", task="t", success_signal="s", fault_indicator="f")
                session.add(drill)
                session.flush()
                session.add(models.IssueDrill(issue_id=issue.id, drill_id=drill.id))
            print(f"  seeded: {miss} -> FACE (1), PATH (2), one smoke-test issue and drill under each")
        session.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("video", type=Path)
    parser.add_argument("--area", default="FULL_SWING")
    parser.add_argument("--miss", default="SLICE")
    parser.add_argument("--notes", default="Smoke test run")
    parser.add_argument("--club-type", default="driver")
    parser.add_argument("--camera-view", default=None)
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    parser.add_argument("--timeout", type=int, default=300, help="seconds to wait for completion")
    args = parser.parse_args()

    if not args.video.exists():
        sys.exit(f"No video at {args.video}")
    _point_at_local_stack()

    import requests

    base = f"{args.base_url}/api/v2/analyses"
    try:
        requests.get(f"{args.base_url}/docs", timeout=5)
    except requests.ConnectionError:
        sys.exit(f"No backend at {args.base_url}. Start it first (see the docstring).")

    print("1. setup")
    user_id, token = _create_user()
    _seed(user_id, args.area, args.miss)
    headers = {"Authorization": f"Bearer {token}"}

    print("2. create")
    created = requests.post(f"{base}/", headers=headers, json={
        "area": args.area, "miss": args.miss, "notes": args.notes,
        "club_type": args.club_type, "camera_view": args.camera_view,
    })
    print(f"  {created.status_code} {created.text[:200]}")
    created.raise_for_status()
    analysis_id, upload_url = created.json()["analysis_id"], created.json()["upload_url"]

    print("3. upload to R2")
    uploaded = requests.put(upload_url, data=args.video.read_bytes())
    print(f"  {uploaded.status_code} ({args.video.stat().st_size / 1e6:.1f} MB)")
    uploaded.raise_for_status()

    print("4. start")
    t0 = time.monotonic()
    started = requests.post(f"{base}/{analysis_id}/start/", headers=headers)
    print(f"  {started.status_code} in {time.monotonic() - t0:.2f}s  {started.text}")
    started.raise_for_status()

    print("5. poll")
    t0 = time.monotonic()
    while True:
        status = requests.get(f"{base}/{analysis_id}/", headers=headers).json()
        print(f"  {time.monotonic() - t0:5.1f}s  {status['status']}")
        if status["status"] in ("completed", "failed") or time.monotonic() - t0 > args.timeout:
            break
        time.sleep(2)

    if status["status"] != "completed":
        sys.exit(f"Not completed: {json.dumps(status, indent=2)}")

    print("6. details")
    details = requests.get(f"{base}/{analysis_id}/details/", headers=headers)
    print(json.dumps(details.json(), indent=2))


if __name__ == "__main__":
    main()
