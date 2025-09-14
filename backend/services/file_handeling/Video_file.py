from File import File
from services.keyframes.Keyframes import Keyframes
from services.file_handeling.Image_file import Image_file
from typing import List, Dict, Any 
from openai import OpenAI
import cv2
from datetime import datetime
import os

class Video_file(File):
    def __init__(self):
        super().__init__()
        self.allowed_extensions = set(['mp4', 'mov', 'avi', 'mkv'])
        self.folder = "uploads/keyframes"   # TODO Create new unique foldername for every file, in case 2 of the same

    def keyframes(self, num_keyframes: int) -> Keyframes:
        """
        Extract keyframes from video file
        
        Args:
            file_path: Path to the video file
            num_keyframes: Number of keyframes to extract
            
        Returns:
            List[str]: List of keyframe file paths
        """
        file_path = self.path()
        try:
            cap = cv2.VideoCapture(file_path)
            if not cap.isOpened():
                return []
            
            total_frames = self.metrics()["total_frames"]
            
            # Calculate frame intervals for keyframes
            # Skip first and last 25% to avoid black frames
            start_frame = int(total_frames * 0.25)
            end_frame = int(total_frames * 0.75)
            usable_frames = end_frame - start_frame
            
            if usable_frames <= 0:
                cap.release()
                return []
            
            # Extract keyframes at even intervals
            frame_interval = usable_frames // num_keyframes
            keyframe_indices = [start_frame + i * frame_interval for i in range(num_keyframes)]
            
            # Return list
            keyframe_images = []
            for idx, frame_number in enumerate(keyframe_indices):
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
                ret, frame = cap.read()
                if ret:
                    img_obj = Image_file(frame, filename=f"keyframe_{idx}.jpg")
                    keyframe_images.append(img_obj)
            
            cap.release()
            
            # Create keyframes object from list of images
            kf = Keyframes().add_all(keyframe_images)
            return kf
            
        except Exception as e:
            print(f"Error extracting keyframes from {file_path}: {str(e)}")
            return []
        


    def metrics(self) -> Dict[str, Any]:
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

    def open_ai_ids(self, client: OpenAI) -> List[str]:
        return self.keyframes().open_ai_id(client)