from Quality import Quality
from typing import Dict, Any
import cv2
import os
from datetime import datetime

class ImageQuality(Quality):
    def __init__(self):
        super().__init__()

    def validate(self) -> bool:
        return self.correct_size() and self.correct_duration()

    def issues(self) -> list[str]:
        return_list: list[str] = []
        # Dictionary for methods to test and error messages if not true
        checks = {
            self.correct_size: "Image is too small",

        }

        for check, message in checks.items():
            if not check():
                return_list.append(message)

        return return_list

    def metrics(self, file_path: str) -> Dict[str, Any]:
        """
        Extract basic video metrics
            
        Returns:
            Dict: Basic video metrics
        """
        file_path = self.file.path()

        try:
            cap = cv2.VideoCapture(file_path)
            if not cap.isOpened():
                raise ValueError(f"Could not open video file: {file_path}")
            
            # Get video properties
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            duration = total_frames / fps if fps > 0 else 0
            
            cap.release()
            
            return {
                "filename": os.path.basename(file_path),
                "duration": round(duration, 2),
                "resolution": f"{width}x{height}",
                "fps": round(fps, 2),
                "total_frames": total_frames,
                "file_size": os.path.getsize(file_path),
                "width": width,
                "height": height,
                "creation_time": datetime.fromtimestamp(os.path.getctime(file_path)).isoformat(),
                "modification_time": datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat(),
                "format": os.path.splitext(file_path)[1].lower().replace('.', '')
            }
        except Exception as e:
            print(f"Error extracting basic metadata from {file_path}: {str(e)}")
            return {
                "filename": os.path.basename(file_path) if file_path else "unknown",
                "duration": 0,
                "resolution": "unknown",
                "fps": 0,
                "total_frames": 0,
                "file_size": 0,
                "width": 0,
                "height": 0,
                "creation_time": None,
                "modification_time": None,
                "format": None,
                "error": str(e)
            }

    def correct_size(self) -> bool:
        m = self.metrics()
        return m["width"] >= 1280 and m["height"] >= 720
    
    def correct_duration(self) -> bool:
        m = self.metrics()
        return m["duration_sec"] 
    
    # Add more methods to test aspects bellow
    # Also add these mehtods in self.issues dict as well self.validate 