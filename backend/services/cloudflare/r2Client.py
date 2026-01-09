import os
from dotenv import load_dotenv


class R2Client:
    
    def __init__(self):
        API_KEY_ID = os.getenv("CLOUDFLARE_API_TOKEN")

    def generate_signed_url(self, method: str, key: str, expires_in: int) -> str:
        ...

    def head_object(self, key: str) -> bool:
        ...

    def get_object(self, key: str) -> bytes:
        ...