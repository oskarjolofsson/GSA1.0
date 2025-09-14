from abc import ABC, abstractmethod
from werkzeug.datastructures import FileStorage
import os
from typing import Any
from datetime import datetime
import uuid

class File(ABC):
    def __init__(self, f: FileStorage):
        if isinstance(f, FileStorage):
            self.path = self.saveFileStorage(f)

            

    @property
    @abstractmethod
    def allowed_extensions(self) -> set[str]:
        ...

    @property
    @abstractmethod
    def folder(self) -> str:
        ...

    def saveFileStorage(self, f: FileStorage):
        """
        Stores the inputed file on disk
        Checks that it is the correct type
        """
        filename = self._generate_unique_filename(f.filename)
        if not self.allowed_file(filename):
            raise ValueError(f"Invalid file type")
        
        # Save video to uploads folder
        os.makedirs(self.path, exist_ok=True)
        file_path = os.path.join(self.folder, filename)
        f.save(file_path)

        return file_path


    def size(self):
        """
        Return the size of the file in self.path
        """
        os.path.getsize(self.path)

    def path(self):
        """
        Return the path of the saved file
        """
        return self.path
        
    def allowed_file(self, filename):
        """
        Check if a file is allowed based on its extension.
        """
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in self.allowed_extensions
    
    def remove(self):
        if os.path.exists(self.path):
            os.remove(self.path)
        else:
            raise FileNotFoundError(f"no such file: {self.path}")
        
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
        
    @abstractmethod
    def metrics(self) -> dict[str, Any]:
        """Return raw quality metrics (resolution, duration, bitrate, etc)."""
        

