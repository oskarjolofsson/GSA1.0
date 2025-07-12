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

    def __init__(self, upload_folder: str):
        self.upload_folder = upload_folder
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
            print(f"Upload folder created: {upload_folder}")
        else:
            print(f"Using existing upload folder: {upload_folder}")


    
    # Create metadata for a video file, including keyframes
    # Args:
    #     file_path: Path to the video file
    #     num_keyframes: Number of keyframes to extract (default: 4)
    # Returns:
    #     Dict: Video metadata including duration, resolution, and keyframes
    def create_video_metadata(self, file_path: str, num_keyframes: int = 20) -> Dict[str, Any]:
        
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

                    # filename = f"keyframe_{idx+1}.jpg"
                    
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

    # Process an uploaded video file and extract metadata
        
    # Args:
    #     video_file: The uploaded video file from Flask request
    # Returns:
    #     Dict: Video metadata and processing information
    def process_uploaded_video(self, video_file: FileStorage) -> Dict[str, Any]:
        try:
            # Generate unique filename
            original_filename = video_file.filename
            unique_filename = self._generate_unique_filename(original_filename)
            upload_path = os.path.join(self.upload_folder, unique_filename)

            # Ensure upload directory exists
            os.makedirs(self.upload_folder, exist_ok=True)

            # Save file to disk
            video_file.save(upload_path)

            # Validate video file
            is_valid, errors = self.validate_video_file(video_file)
            if not is_valid:
                return {
                    "success": False,
                    "errors": errors,
                    "filename": unique_filename
                }

            # Extract metadata
            metadata = self.create_video_metadata(upload_path)
            metadata["success"] = True
            metadata["saved_path"] = upload_path

            return metadata

        except Exception as e:
            return {
                "success": False,
                "errors": [str(e)],
                "filename": getattr(video_file, "filename", "unknown")
            }
        
    # Extract metadata from a video file
    # Args:
    #     file_path: Path to the video file
    # Returns:
    #     Dict: Video metadata information
    # Description:
    #     Extracts metadata such as duration, resolution, frame rate, file size,
    #     format/codec information, creation date/time, and other relevant properties.
    def extract_video_metadata(self, file_path: str) -> Dict[str, Any]:
        
        try:
            # Get video from file path
            cap = cv2.VideoCapture(file_path)
            if not cap.isOpened():
                raise ValueError(f"Could not open video file: {file_path}")
            
            # Get video properties
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            duration = total_frames / fps if fps > 0 else 0
            resolution = f"{width}x{height}"
            file_size = os.path.getsize(file_path)
            creation_time = datetime.fromtimestamp(os.path.getctime(file_path)).isoformat()
            modification_time = datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat()
            format = os.path.splitext(file_path)[1].lower().replace('.', '')

            metadata = {
                "filename": os.path.basename(file_path),
                "duration": round(duration, 2),
                "resolution": resolution,
                "fps": round(fps, 2),
                "total_frames": total_frames,
                "file_size": file_size,
                "creation_time": creation_time,
                "modification_time": modification_time,
                "format": format
            }

            return metadata
        except Exception as e:
            print(f"Error extracting metadata from {file_path}: {str(e)}")
            return {
                "filename": os.path.basename(file_path) if file_path else "unknown",
                "duration": 0,
                "resolution": "unknown",
                "fps": 0,
                "total_frames": 0,
                "file_size": 0,
                "creation_time": None,
                "modification_time": None,
                "format": None,
                "error": str(e)
            }



    # Generate thumbnail images from key moments in the video
    # Args:
    #     file_path: Path to the uploads directory containing keyframes
    #     num_frames: Number of thumbnail frames to extract   
    # @returns:
    #     List[str]: List of paths to the generated thumbnail images
    def generate_thumbnails(self, file_path: str, num_frames: int = 5) -> List[str]:
        try:
            # Extract num_frames of the images in uploads/keyframes
            # If not enough frames, extract as many as possible

            keyframes_dir = os.path.join(os.path.dirname(file_path), 'keyframes')
            if not os.path.exists(keyframes_dir):
                os.makedirs(keyframes_dir, exist_ok=True)

            files = [f for f in os.listdir(keyframes_dir) if os.path.isfile(os.path.join(keyframes_dir, f))]
            files.sort()

            # Select num_frames evenly spaced files
            if len(files) < num_frames:
                keyframes = files  # Use all available files
            else:
                indices = [int(i * (len(files) - 1) / (num_frames - 1)) for i in range(num_frames)]
                keyframes = [files[i] for i in indices]

            # Return the list with paths to the thumbnails
            return keyframes
                
        except Exception as e:
            print(f"Error extracting thumbnails: {str(e)}")
            return []
        

    # Args:
    #     video_file: The uploaded video file
    # Returns:
    #     tuple: (is_valid, list_of_errors)
    #Description:
    # This method checks the uploaded video file for:
    # 1. Allowed file extensions (mp4, mov, avi, mkv)
    # 2. File size limits (100MB max)
    # 3. File readability and validity
    # 4. Reasonable duration (not too short/long)
    # 5. Adequate resolution for analysis (minimum 640x480)
    # 6. Any other custom validation rules as needed
    def validate_video_file(self, video_file: FileStorage) -> tuple[bool, List[str]]:
        # Starting values
        errors = []
        is_valid = True
        
        # Check file size (100MB max)
        if video_file.content_length > 100 * 1024 * 1024:
            errors.append("File size exceeds 100MB limit")
            is_valid = False
        
        # Check file type
        allowed_types = ['mp4', 'mov', 'avi', 'mkv']
        if not any(video_file.filename.lower().endswith(ext) for ext in allowed_types):
            errors.append("File type not supported. Allowed types: mp4, mov, avi, mkv")
            is_valid = False

        # Check if file is empty
        if video_file.content_length == 0:
            errors.append("File is empty")
            is_valid = False

        # Check if file is readable
        try:
            video_file.seek(0)  # Reset file pointer
            video_file.read(1)  # Try to read a byte
        except Exception as e:
            errors.append(f"File is not readable: {str(e)}")
            is_valid = False

        # Check if file is a valid video
        try:
            cap = cv2.VideoCapture(video_file)
            if not cap.isOpened():
                errors.append("File is not a valid video")
                is_valid = False
            else:
                # Check duration (at least 1 second)
                fps = cap.get(cv2.CAP_PROP_FPS)
                total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                if fps > 0 and total_frames / fps < 1:
                    errors.append("Video duration is too short (less than 1 second)")
                    is_valid = False
                cap.release()
        except Exception as e:
            errors.append(f"Error validating video file: {str(e)}")
            is_valid = False

        # Check if video resolution is adequate
        if is_valid:
            cap = cv2.VideoCapture(video_file)
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            if width < 640 or height < 480:
                errors.append("Video resolution is too low (minimum 640x480 required)")
                is_valid = False
            cap.release()

        # Return validation result
        return is_valid, errors

    
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
        
        # Check if filename is provided, otherwise generate a unique one
        if not filename:
            filename = self._generate_unique_filename(video_file.filename)
        upload_path = os.path.join(self.upload_folder, filename)

        # Ensure upload directory exists
        os.makedirs(self.upload_folder, exist_ok=True)
        try:
            # Save the file to the upload directory
            video_file.save(upload_path)
            print(f"Video file saved to: {upload_path}")
            return upload_path
        except Exception as e:
            raise IOError(f"Could not save video file: {str(e)}")
    
    
        # Get basic file information
        # Args:
        #     file_path: Path to the file
        # Returns:
        #     Dict: File information
        # TODO: Return file info including:
        # - File size in bytes
        # - Creation time
        # - Modification time
        # - File extension
        # - Whet
    def get_file_info(self, file_path: str) -> Dict[str, Any]:
        
        
        if not os.path.exists(file_path):
            file_info = {
                "file_size": 0,
                "creation_time": None,
                "modification_time": None,
                "extension": os.path.splitext(file_path)[1].lower(),
                "exists": False,
                "readable": False
            }
        else:
            file_info = {
                "file_size": os.path.getsize(file_path),
                "creation_time": datetime.fromtimestamp(os.path.getctime(file_path)).isoformat(),
                "modification_time": datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat(),
                "extension": os.path.splitext(file_path)[1].lower(),
                "exists": True,
                "readable": os.access(file_path, os.R_OK)
            }
        
        return file_info
    
