from Quality import Quality
from typing import Any
from PIL import Image

class ImageQuality(Quality):
    def __init__(self):
        super().__init__()

    def validate(self) -> bool:
        m = self.metrics()
        return m["width"] >= 800 and m["height"] >= 600

    def issues(self) -> list[str]:
        m = self.metrics()
        return ["Image too small"] if (m["width"] < 800 or m["height"] < 600) else []

    def metrics(self) -> dict[str, Any]:
        # example: use Pillow
        with Image.open(self.path) as img:
            return {
                "width": img.width, 
                "height": img.height, 
                "format": img.format
                }
