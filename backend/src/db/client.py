# db/client.py
from supabase import create_client, Client
import os

supabase: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"], #Never expose the service_role_key to frontend
)
