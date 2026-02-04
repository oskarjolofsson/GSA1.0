from .r2Client import r2_client

def generate_upload_url(self, key: str) -> str:
    return r2_client.generate_signed_url(
        method="put_object", key=key, expires_in=300
    )

def generate_read_url(self, key: str) -> str:
    return r2_client.generate_signed_url(
        method="get_object", key=key, expires_in=3600
    )

def get_object(self, key: str) -> bytes:
    return r2_client.get_object(key)

def object_exists(self, key: str) -> bool:
    return r2_client.head_object(key)

def delete(self, key: str) -> None:
    r2_client.delete_object(key)