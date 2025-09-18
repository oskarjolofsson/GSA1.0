from abc import ABC, abstractmethod
from werkzeug.datastructures import FileStorage
import os
from typing import Any
from datetime import datetime
import uuid

class File(ABC):
    def __init__(self, f: FileStorage):
        self._path: str | None = None
        if isinstance(f, FileStorage):
            self._path = self.saveFileStorage(f)

    @property
    @abstractmethod
    def allowed_extensions(self) -> set[str]:
        ...

    @property
    @abstractmethod
    def folder(self) -> str:
        ...

    def saveFileStorage(self, f: FileStorage):
        filename = self._generate_unique_filename(f.filename)
        print(f"filename is: {filename}")
        if not self.allowed_file(filename):
            raise ValueError("Invalid file type")
        
        os.makedirs(self.folder, exist_ok=True)
        file_path = os.path.join(self.folder, filename)
        f.save(file_path)
        return file_path

    
    def path(self) -> str:
        if self._path is None:
            raise ValueError("File has not been saved yet.")
        return self._path
        
    def size(self) -> int:
        return os.path.getsize(self.path)
    
    def allowed_file(self, filename: str) -> bool:
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in self.allowed_extensions
    
    def remove(self):
        if os.path.exists(self.path):
            os.remove(self.path)
        else:
            raise FileNotFoundError(f"no such file: {self.path}")
        
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

