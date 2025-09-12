from abc import ABC, abstractmethod
from werkzeug.datastructures import FileStorage
import os

class File(ABC):
    def __init__(self, f: FileStorage):
        self.path = self.save(f)

    @property
    @abstractmethod
    def allowed_extensions(self) -> set[str]:
        ...

    @property
    @abstractmethod
    def folder(self) -> str:
        ...

    def save(self, f: FileStorage):
        """
        Stores the inputed file on disk
        Checks that it is the correct type
        """
        if not self.allowed_file(f.filename):
            raise ValueError(f"Invalid file type")
        
        # Save video to uploads folder
        os.makedirs(self.path, exist_ok=True)
        file_path = os.path.join(self.folder, f.filename)     # TODO Create new unique filename for every file, in case 2 of the same
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
        

