

class VideoStorageService:
    
    def __init__(self):
        pass

    def generate_upload_url(self, video_key: str) -> str:
        ...

    def verify_object_exists(self, video_key: str) -> None:
        ...

    def get_video_mp4(self, video_key: str) -> bytes:
        ...

# Instantiate a single global instance
video_storage_service = VideoStorageService()