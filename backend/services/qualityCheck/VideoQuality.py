from Quality import Quality
from typing import Any

class ImageQuality(Quality):
    def __init__(self):
        super().__init__()

    def validate(self) -> bool:
        # e.g., ensure resolution ≥ 720p and duration < 1h
        m = self.metrics()
        return m["width"] >= 1280 and m["height"] >= 720 and m["duration_sec"] < 3600

    def issues(self) -> list[str]:
        m = self.metrics()
        probs = []
        if m["width"] < 1280 or m["height"] < 720:
            probs.append("Resolution too low")
        if m["duration_sec"] > 3600:
            probs.append("Video too long")
        return probs

    def metrics(self) -> dict[str, Any]:
        # placeholder — here you’d call ffprobe/OpenCV etc
        return {
            "width": 1920,
            "height": 1080,
            "duration_sec": 42,
            "codec": "h264",
        }
