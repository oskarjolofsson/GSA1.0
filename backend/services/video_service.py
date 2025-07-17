"""
Video Processing Service for Golf Swing Analysis

This service handles video file processing and metadata extraction.
It's responsible for:
1. Processing uploaded video files
2. Extracting video metadata (duration, resolution, etc.)
3. Generating keyframes for AI analysis
4. File cleanup and management
"""

import os
import cv2
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from werkzeug.datastructures import FileStorage
from models.analysis_models import AnalysisResponseModel

class VideoProcessingService:

    def __init__(self, upload_folder: str):
        self.upload_folder = upload_folder
        self.allowed_types = ['mp4', 'mov', 'avi', 'mkv']
        self.max_file_size = 100 * 1024 * 1024  # 100MB
        self.min_resolution = (640, 480)
        self.min_duration = 1.0  # seconds
        
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
            print(f"Upload folder created: {upload_folder}")
        else:
            print(f"Using existing upload folder: {upload_folder}")

    def _generate_unique_filename(self, original_filename: str) -> str:
        """
        Generate a unique filename to avoid conflicts
        
        Args:
            original_filename: The original filename
            
        Returns:
            str: A unique filename with timestamp and UUID
        """
        if not original_filename:
            original_filename = "video"
        
        # Get file extension
        name, ext = os.path.splitext(original_filename)
        
        # Generate unique filename with timestamp and UUID
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        
        return f"{name}_{timestamp}_{unique_id}{ext}"

    def _extract_basic_metadata(self, file_path: str) -> Dict[str, Any]:
        """
        Extract basic video metadata without keyframes
        
        Args:
            file_path: Path to the video file
            
        Returns:
            Dict: Basic video metadata
        """
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

    def _extract_keyframes(self, file_path: str, num_keyframes: int = 20) -> List[str]:
        """
        Extract keyframes from video file
        
        Args:
            file_path: Path to the video file
            num_keyframes: Number of keyframes to extract
            
        Returns:
            List[str]: List of keyframe file paths
        """
        try:
            cap = cv2.VideoCapture(file_path)
            if not cap.isOpened():
                return []
            
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            # Create directory for keyframes
            keyframes_dir = os.path.join(os.path.dirname(file_path), 'keyframes')
            if os.path.exists(keyframes_dir):
                # Remove all files in the keyframes directory
                for filename in os.listdir(keyframes_dir):
                    file_path_to_remove = os.path.join(keyframes_dir, filename)
                    if os.path.isfile(file_path_to_remove):
                        os.remove(file_path_to_remove)
            else:
                os.makedirs(keyframes_dir, exist_ok=True)
            
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
            
            keyframe_paths = []
            for idx, frame_number in enumerate(keyframe_indices):
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
                ret, frame = cap.read()
                if ret:
                    filename = self._generate_unique_filename(f"keyframe_{idx}.jpg")
                    
                    keyframe_path = os.path.join(keyframes_dir, filename)
                    cv2.imwrite(keyframe_path, frame)
                    keyframe_paths.append(keyframe_path)
                    print(f"Extracted keyframe {idx+1}/{num_keyframes} at frame {frame_number}")
            
            cap.release()
            return keyframe_paths
            
        except Exception as e:
            print(f"Error extracting keyframes from {file_path}: {str(e)}")
            return []

    def create_video_metadata(self, file_path: str, num_keyframes: int = 20) -> Dict[str, Any]:
        """
        Create complete metadata for a video file, including keyframes
        
        Args:
            file_path: Path to the video file
            num_keyframes: Number of keyframes to extract
            
        Returns:
            Dict: Complete video metadata including duration, resolution, and keyframes
        """
        try:
            # Extract basic metadata
            metadata = self._extract_basic_metadata(file_path)
            
            if "error" in metadata:
                return metadata
            
            # Extract keyframes
            keyframe_paths = self._extract_keyframes(file_path, num_keyframes)
            
            # Add keyframe information
            metadata.update({
                "keyframes": keyframe_paths,
                "num_keyframes_extracted": len(keyframe_paths),
                "extraction_timestamp": datetime.now().isoformat()
            })
            
            print(f"Successfully extracted metadata for {metadata['filename']}")
            print(f"Duration: {metadata['duration']}s, Resolution: {metadata['resolution']}, Keyframes: {len(keyframe_paths)}")
            
            return metadata
            
        except Exception as e:
            print(f"Error processing video {file_path}: {str(e)}")
            return {
                "filename": os.path.basename(file_path) if file_path else "unknown",
                "duration": 0,
                "resolution": "unknown",
                "fps": 0,
                "total_frames": 0,
                "file_size": 0,
                "keyframes": [],
                "num_keyframes_extracted": 0,
                "error": str(e),
                "extraction_timestamp": datetime.now().isoformat()
            }

    def process_uploaded_video(self, video_file: FileStorage, num_keyframes: int = 20) -> Dict[str, Any]:
        """
        Process an uploaded video file and extract metadata
        
        Args:
            video_file: The uploaded video file from Flask request
            num_keyframes: Number of keyframes to extract
            
        Returns:
            Dict: Video metadata and processing information
        """
        try:
            # Validate video file first
            is_valid, errors = self._validate_video_file_basic(video_file)
            if not is_valid:
                return {
                    "success": False,
                    "errors": errors,
                    "filename": video_file.filename or "unknown"
                }
            
            # Generate unique filename and save file
            original_filename = video_file.filename or "video"
            unique_filename = self._generate_unique_filename(original_filename)
            upload_path = os.path.join(self.upload_folder, unique_filename)
            
            # Ensure upload directory exists
            os.makedirs(self.upload_folder, exist_ok=True)
            
            # Save file to disk
            video_file.save(upload_path)
            
            # Validate video content after saving
            is_valid, errors = self._validate_video_content(upload_path)
            if not is_valid:
                # Clean up invalid file
                if os.path.exists(upload_path):
                    os.remove(upload_path)
                return {
                    "success": False,
                    "errors": errors,
                    "filename": unique_filename
                }
            
            # Extract complete metadata
            metadata = self.create_video_metadata(upload_path, num_keyframes)
            metadata["success"] = True
            metadata["saved_path"] = upload_path
            
            return metadata
            
        except Exception as e:
            return {
                "success": False,
                "errors": [str(e)],
                "filename": getattr(video_file, "filename", "unknown")
            }

    def extract_video_metadata(self, file_path: str) -> Dict[str, Any]:
        """
        Extract metadata from a video file (without keyframes)
        
        Args:
            file_path: Path to the video file
            
        Returns:
            Dict: Video metadata information
        """
        return self._extract_basic_metadata(file_path)

    def generate_thumbnails(self, file_path: str, num_frames: int = 5) -> List[str]:
        """
        Generate thumbnail images from existing keyframes
        
        Args:
            file_path: Path to the video file
            num_frames: Number of thumbnail frames to select
            
        Returns:
            List[str]: List of paths to the selected thumbnail images
        """
        try:
            keyframes_dir = os.path.join(os.path.dirname(file_path), 'keyframes')
            if not os.path.exists(keyframes_dir):
                return []
            
            files = [f for f in os.listdir(keyframes_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            files.sort()
            
            if not files:
                return []
            
            # Select num_frames evenly spaced files
            if len(files) <= num_frames:
                return [os.path.join(keyframes_dir, f) for f in files]
            else:
                indices = [int(i * (len(files) - 1) / (num_frames - 1)) for i in range(num_frames)]
                return [os.path.join(keyframes_dir, files[i]) for i in indices]
                
        except Exception as e:
            print(f"Error generating thumbnails: {str(e)}")
            return []

    def _validate_video_file_basic(self, video_file: FileStorage) -> Tuple[bool, List[str]]:
        """
        Basic validation of uploaded video file (before saving)
        
        Args:
            video_file: The uploaded video file
            
        Returns:
            Tuple[bool, List[str]]: (is_valid, list_of_errors)
        """
        errors = []
        
        # Check file size
        if video_file.content_length > self.max_file_size:
            errors.append(f"File size exceeds {self.max_file_size // (1024*1024)}MB limit")
        
        # Check file type
        if video_file.filename and not any(video_file.filename.lower().endswith(ext) for ext in self.allowed_types):
            errors.append(f"File type not supported. Allowed types: {', '.join(self.allowed_types)}")
        
        # Check if file is empty
        if video_file.content_length == 0:
            errors.append("File is empty")
        
        # Check if file is readable
        try:
            video_file.seek(0)
            video_file.read(1)
        except Exception as e:
            errors.append(f"File is not readable: {str(e)}")
        
        return len(errors) == 0, errors

    def _validate_video_content(self, file_path: str) -> Tuple[bool, List[str]]:
        """
        Validate video content after saving to disk
        
        Args:
            file_path: Path to the saved video file
            
        Returns:
            Tuple[bool, List[str]]: (is_valid, list_of_errors)
        """
        errors = []
        
        try:
            cap = cv2.VideoCapture(file_path)
            if not cap.isOpened():
                errors.append("File is not a valid video")
            else:
                # Check duration
                fps = cap.get(cv2.CAP_PROP_FPS)
                total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                duration = total_frames / fps if fps > 0 else 0
                
                if duration < self.min_duration:
                    errors.append(f"Video duration is too short (minimum {self.min_duration} second)")
                
                # Check resolution
                width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                
                if width < self.min_resolution[0] or height < self.min_resolution[1]:
                    errors.append(f"Video resolution is too low (minimum {self.min_resolution[0]}x{self.min_resolution[1]} required)")
                
                cap.release()
                
        except Exception as e:
            errors.append(f"Error validating video content: {str(e)}")
        
        return len(errors) == 0, errors

    def cleanup_files(self, file_path: str) -> None:
        """
        Clean up video file and its keyframes
        
        Args:
            file_path: Path to the video file
        """
        try:
            # Remove keyframes directory
            keyframes_dir = os.path.join(os.path.dirname(file_path), 'keyframes')
            if os.path.exists(keyframes_dir):
                for filename in os.listdir(keyframes_dir):
                    file_path_to_remove = os.path.join(keyframes_dir, filename)
                    if os.path.isfile(file_path_to_remove):
                        os.remove(file_path_to_remove)
                os.rmdir(keyframes_dir)
            
            # Remove video file
            if os.path.exists(file_path):
                os.remove(file_path)
                
        except Exception as e:
            print(f"Error cleaning up files: {str(e)}")
    
