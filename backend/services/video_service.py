"""
Video Processing Service for Golf Swing Analysis

This service handles video file processing and metadata extraction.
It's responsible for:
1. Processing uploaded video files
2. Extracting video metadata (duration, resolution, etc.)
3. Generating thumbnails or keyframes (optional)
4. Preparing video data for AI analysis
5. File cleanup and management
"""

import os
import cv2
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from werkzeug.datastructures import FileStorage

class VideoProcessingService:
    """
    Service class for processing golf swing videos
    """

    def create_video_metadata(self, file_path: str, num_keyframes: int = 20) -> Dict[str, Any]:
        """
        Create metadata for a video file, including keyframes

        Args:
            file_path: Path to the video file
            num_keyframes: Number of keyframes to extract (default: 4)

        Returns:
            Dict: Video metadata including duration, resolution, and keyframes

        Description:
        This method extracts basic metadata from the video
        and generates keyframe thumbnails at specific intervals.
        Perfect for golf swing analysis: setup, backswing, impact, follow-through
        """
        try:
            # Open video file
            cap = cv2.VideoCapture(file_path)
            
            if not cap.isOpened():
                raise ValueError(f"Could not open video file: {file_path}")
            
            # Get video properties
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            duration = total_frames / fps if fps > 0 else 0
            
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
            # Skip first and last 10% to avoid black frames
            start_frame = int(total_frames * 0.25)
            end_frame = int(total_frames * 0.75)
            usable_frames = end_frame - start_frame
            
            if usable_frames <= 0:
                raise ValueError("Video too short to extract keyframes")
            
            # Extract keyframes-indexes at even intervals
            keyframe_paths = []
            frame_interval = usable_frames // num_keyframes
            keyframe_indices = [start_frame + i * frame_interval for i in range(num_keyframes)]

            keyframe_paths = []
            for idx, frame_number in enumerate(keyframe_indices):
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
                ret, frame = cap.read()
                if ret:
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    unique_id = str(uuid.uuid4())[:8]
                    filename = f"keyframe_{idx}_{timestamp}_{unique_id}.jpg"
                    keyframe_path = os.path.join(keyframes_dir, filename)
                    cv2.imwrite(keyframe_path, frame)
                    keyframe_paths.append(keyframe_path)
                    print(f"Extracted keyframe {idx+1}/{num_keyframes} at frame {frame_number}")
            
            # Release video capture
            cap.release()
            
            # Create metadata dictionary
            metadata = {
                "filename": os.path.basename(file_path),
                "duration": round(duration, 2),
                "resolution": f"{width}x{height}",
                "fps": round(fps, 2),
                "total_frames": total_frames,
                "file_size": os.path.getsize(file_path),
                "keyframes": keyframe_paths,
                "num_keyframes_extracted": len(keyframe_paths),
                "extraction_timestamp": datetime.now().isoformat()
            }
            
            print(f"Successfully extracted metadata for {os.path.basename(file_path)}")
            print(f"Duration: {duration:.2f}s, Resolution: {width}x{height}, Keyframes: {len(keyframe_paths)}")
            
            return metadata
            
        except Exception as e:
            print(f"Error processing video {file_path}: {str(e)}")
            # Return minimal metadata on error
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
    
    def __init__(self, upload_folder: str):
        """
        Initialize the video processing service
        
        Args:
            upload_folder: Path to the folder where videos are stored
        
        TODO: Set up the following:
        - Store upload folder path
        - Create directories if they don't exist
        - Set up any video processing libraries (opencv, ffmpeg, etc.)
        - Configure file size and format limits
        """
        pass
    
    def process_uploaded_video(self, video_file: FileStorage) -> Dict[str, Any]:
        """
        Process an uploaded video file and extract metadata
        
        Args:
            video_file: The uploaded video file from Flask request
            
        Returns:
            Dict: Video metadata and processing information
        
        TODO: Implement the following steps:
        1. Save the uploaded file to disk
        2. Extract video metadata (duration, resolution, fps, etc.)
        3. Validate video format and quality
        4. Generate unique filename to avoid conflicts
        5. Return metadata dictionary for AI analysis
        6. Handle processing errors gracefully
        """
        pass
    
    def extract_video_metadata(self, file_path: str) -> Dict[str, Any]:
        """
        Extract metadata from a video file
        
        Args:
            file_path: Path to the video file
            
        Returns:
            Dict: Video metadata information
        
        TODO: Extract the following metadata:
        - Duration (in seconds)
        - Resolution (width x height)
        - Frame rate (fps)
        - File size
        - Format/codec information
        - Creation date/time
        - Any other relevant video properties
        """
        pass
    
    def generate_thumbnails(self, file_path: str, num_frames: int = 5) -> List[str]:
        """
        Generate thumbnail images from key moments in the video
        
        Args:
            file_path: Path to the video file
            num_frames: Number of thumbnail frames to extract
            
        Returns:
            List[str]: Paths to generated thumbnail images
        
        TODO: Implement thumbnail generation:
        1. Extract frames at specific intervals (e.g., every 20% of video)
        2. Save frames as JPEG images
        3. Generate unique filenames for thumbnails
        4. Return list of thumbnail file paths
        5. Handle cases where video is too short
        """
        pass
    
    def validate_video_file(self, video_file: FileStorage) -> tuple[bool, List[str]]:
        """
        Validate uploaded video file
        
        Args:
            video_file: The uploaded video file
            
        Returns:
            tuple: (is_valid, list_of_errors)
        
        TODO: Validate the following:
        1. File extension is allowed (mp4, mov, avi, mkv)
        2. File size is within limits
        3. File is not corrupted
        4. Video duration is reasonable (not too short/long)
        5. Video resolution is adequate for analysis
        """
        pass
    
    def save_video_file(self, video_file: FileStorage, filename: str = None) -> str:
        """
        Save uploaded video file to disk
        
        Args:
            video_file: The uploaded video file
            filename: Optional custom filename, auto-generated if None
            
        Returns:
            str: Path to saved video file
        
        TODO: Implement file saving:
        1. Generate unique filename if not provided
        2. Ensure upload directory exists
        3. Save file to disk
        4. Return full path to saved file
        5. Handle file write errors
        """
        pass
    
    def cleanup_old_files(self, max_age_hours: int = 24) -> int:
        """
        Clean up old uploaded files to free disk space
        
        Args:
            max_age_hours: Files older than this will be deleted
            
        Returns:
            int: Number of files deleted
        
        TODO: Implement cleanup:
        1. Scan upload directory for old files
        2. Check file modification time
        3. Delete files older than max_age_hours
        4. Also delete associated thumbnails
        5. Return count of deleted files
        6. Handle file deletion errors
        """
        pass
    
    def get_file_info(self, file_path: str) -> Dict[str, Any]:
        """
        Get basic file information
        
        Args:
            file_path: Path to the file
            
        Returns:
            Dict: File information
        
        TODO: Return file info including:
        - File size in bytes
        - Creation time
        - Modification time
        - File extension
        - Whether file exists and is readable
        """
        pass
    
    def _generate_unique_filename(self, original_filename: str) -> str:
        """
        Generate a unique filename to avoid conflicts
        
        Args:
            original_filename: The original filename from upload
            
        Returns:
            str: Unique filename
        
        TODO: Generate unique filename by:
        1. Adding timestamp
        2. Adding random UUID
        3. Preserving original file extension
        4. Ensuring filename is filesystem-safe
        """
        pass
