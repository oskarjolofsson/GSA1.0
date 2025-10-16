from services.file_handeling.File import File
from services.keyframes.Keyframes import Keyframes
from services.file_handeling.Image_file import Image_file
from typing import List, Dict, Any 
from openai import OpenAI
import cv2
from datetime import datetime
import os
from werkzeug.datastructures import FileStorage
from werkzeug.datastructures import Headers
from io import BytesIO
import subprocess

class Video_file(File):
    def __init__(self, f: FileStorage):
        super().__init__(f)

    @property
    def allowed_extensions(self) -> set:
        return {'mp4', 'mov', 'avi', 'mkv'}

    @property
    def folder(self) -> str:
        return "uploads/video"  

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
        print(f"Keyframes-method: filepath is {file_path}")
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
            kf = Keyframes()
            kf.add_all(keyframe_images)
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
        file_path = self.path()

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

    def trim(self, start_seconds: float, end_seconds: float) -> 'Video_file':
        """
        Trim the saved video file between start_seconds and end_seconds.
        This implementation uses ffmpeg via subprocess to create a new trimmed file
        next to the original and updates this object's internal path to the new file.

        Args:
            start_seconds (float): start time in seconds
            end_seconds (float): end time in seconds

        Returns:
            Video_file: self (with updated path)
        """
        input_path = self.path()
        if start_seconds is None or end_seconds is None:
            raise ValueError("start and end must be provided for trim")

        try:
            start = float(start_seconds)
            end = float(end_seconds)
        except Exception:
            raise ValueError("start and end must be numeric")

        if end <= start:
            raise ValueError("end must be greater than start")

        # create output filename
        base, ext = os.path.splitext(os.path.basename(input_path))
        out_name = f"{base}_trim_{int(start)}_{int(end)}{ext}"
        out_folder = self.folder
        os.makedirs(out_folder, exist_ok=True)
        out_path = os.path.join(out_folder, out_name)

        # ffmpeg command: -y overwrite, -ss start -to end -i input -c copy out
        # using -ss and -to before/after input can affect accuracy; use -ss before input and -to with -accurate_seek
        cmd = [
            "ffmpeg",
            "-y",
            "-i", input_path,
            "-ss", str(start),
            "-to", str(end),
            "-c", "copy",
            out_path,
        ]

        try:
            # run ffmpeg and capture output for debugging
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"ffmpeg trimming failed: {e.stderr.decode('utf-8', errors='ignore')}")

        # remove original file
        self.remove()

        # update internal path to trimmed file
        self._path = out_path
        return self

    def to_filestorage(self) -> FileStorage:
        """
        Convert the saved video file back into a Werkzeug FileStorage-like object
        by reading bytes into an in-memory file. This allows sending the file
        in Flask responses or further handling as if it were an uploaded file.

        Returns:
            FileStorage: in-memory FileStorage with filename and stream
        """
        file_path = self.path()
        if not os.path.exists(file_path):
            raise FileNotFoundError(file_path)

        with open(file_path, 'rb') as f:
            data = f.read()

        stream = BytesIO(data)
        # create a minimal headers object to pass content-type if needed
        headers = Headers()
        # try to guess content type from extension
        ext = os.path.splitext(file_path)[1].lower()
        if ext == '.mp4':
            headers.add('Content-Type', 'video/mp4')
        elif ext == '.mov':
            headers.add('Content-Type', 'video/quicktime')

        fs = FileStorage(stream=stream, filename=os.path.basename(file_path), headers=headers)
        # Reset stream position for consumers
        fs.stream.seek(0)
        return fs