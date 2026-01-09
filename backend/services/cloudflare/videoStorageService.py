from services.cloudflare.r2Client import r2_client

class VideoStorageService:
    
    def __init__(self, r2_client=r2_client):
        self.r2_client = r2_client

    def generate_upload_url(self, video_key: str) -> str:
        return self.r2_client.generate_signed_url(
            method="put_object", key=video_key, expires_in=300
        )

    def verify_object_exists(self, video_key: str) -> None:  
        if not self.r2_client.head_object(video_key):
            raise ValueError("Uploaded video not found")      

    def get_video_mp4(self, video_key: str) -> bytes:
        return self.r2_client.get_object(video_key)
    
    def generate_read_url(self, video_key: str) -> str:
        return self.r2_client.generate_signed_url(
            method="get_object", key=video_key, expires_in=3600
        )
    

# Instantiate a single global instance
video_storage_service = VideoStorageService()