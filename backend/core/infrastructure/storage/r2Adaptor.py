from .r2Client import r2_client
from ...config import R2_BUCKET


def generate_upload_url(key: str) -> str:
    return r2_client.generate_signed_url(method="put_object", key=key, expires_in=300)


def generate_read_url(key: str) -> str:
    return r2_client.generate_signed_url(method="get_object", key=key, expires_in=3600)


def get_object(key: str) -> bytes:
    return r2_client.get_object(key)


def object_exists(key: str) -> bool:
    return r2_client.head_object(key)


def delete(key: str) -> None:
    r2_client.delete_object(key)
    
    
def put_object(key: str, data: bytes, content_type: str = "application/octet-stream") -> None:
    r2_client.put_object(
        key=key,
        data=data,
        content_type=content_type
    )
