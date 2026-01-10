from abc import ABC, abstractmethod
from werkzeug.datastructures import FileStorage
import os
from typing import Any
from datetime import datetime
import uuid
import filetype

class File(ABC):
    def __init__(self, file_blob: bytes):
        self._path = self.saveFile(file_blob)

    @property
    @abstractmethod
    def allowed_extensions(self) -> set[str]:
        ...

    @property
    @abstractmethod
    def folder(self) -> str:
        ...

    def saveFile(self, file_blob: bytes) -> str:
        file_extension = self._detect_file_extension(file_blob) 
        filename = self._generate_unique_filename(f"video.{file_extension}")
        if not self.allowed_file(filename):
            raise ValueError(f"Invalid file type: .{file_extension} not allowed")
        
        os.makedirs(self.folder, exist_ok=True)
        file_path = os.path.join(self.folder, filename)
        
        with open(file_path, 'wb') as f:
            f.write(file_blob)
            
        return file_path

    
    def path(self) -> str:
        if self._path is None:
            raise ValueError("File has not been saved yet.")
        return self._path
        
    def size(self) -> int:
        return os.path.getsize(self.path)
    
    def allowed_file(self, filename: str) -> bool:
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in self.allowed_extensions
    
    def _detect_file_extension(self, file_blob: bytes) -> str:
        """Detect file extension from magic bytes using filetype library"""
        kind = filetype.guess(file_blob)
        if kind is None:
            raise ValueError("Unable to determine file type from blob")
        return kind.extension
    
    def remove(self):
        if os.path.exists(self.path()):
            os.remove(self.path())
        else:
            raise FileNotFoundError(f"no such file: {self.path()}")
        
    def _generate_unique_filename(self, original_filename: str) -> str:
        if not original_filename:
            original_filename = "file"
        
        name, ext = os.path.splitext(original_filename)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        
        return f"{name}_{timestamp}_{unique_id}{ext}"
        
    @abstractmethod
    def metrics(self) -> dict[str, Any]:
        ...

    def __str__(self):
        return self.metrics().__str__()