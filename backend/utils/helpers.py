"""
Utility functions for the Golf Swing Analyzer Backend

This module contains various helper functions for common operations like file validation,
error handling, logging, etc.
"""

import os

class FileUtils:
    """
    Utility class for file handling operations
    """
    @staticmethod
    def is_valid_extension(filename: str, allowed_extensions: set) -> bool:
        """
        Validate if a file has an allowed extension
        """
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions
    
    @staticmethod
    def create_upload_folders(path: str):
        """
        Create necessary directories for file uploads
        """
        os.makedirs(path, exist_ok=True)

    @staticmethod
    def save_file(file, path: str):
        """
        Save an uploaded file to disk
        """
        file.save(os.path.join(path, file.filename))

class ValidationUtils:
    """
    Utility class for form validation operations
    """
    @staticmethod
    def validate_video_file(file, max_size: int, allowed_types: list) -> (bool, list):
        """
        Validate an uploaded video file based on size and type
        """
        errors = []
        filename = file.filename
        file_size = file.content_length

        # Validate file size
        if file_size > max_size:
            errors.append(f"File size exceeds {max_size/(1024*1024)}MB limit")

        # Validate file extension
        if not FileUtils.is_valid_extension(filename, allowed_types):
            errors.append(f"Invalid file type. Allowed types are: {', '.join(allowed_types)}")

        return len(errors) == 0, errors
