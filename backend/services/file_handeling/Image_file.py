from File import File
from openai import OpenAI
from werkzeug.datastructures import FileStorage
from PIL import Image
from typing import Any
import numpy as np
import os
import cv2

class Image_file(File):
    def __init__(self, f: FileStorage | np.ndarray, filename: str | None = ""):
        super().__init__()

        self.allowed_extensions = set(['png, jpg'])
        self.folder = "uploads/keyframes"

        if isinstance(f, np.ndarray):
            self.path = self._saveNpDarray(f, filename)

    def _saveNpDarray(self, f: np.ndarray, name: str) -> str:
        # Always save as image, so just pick extension
        filename = self._generate_unique_filename(name + ".jpg")
        save_path = os.path.join(self.folder(), filename)
        os.makedirs(self.folder(), exist_ok=True)
        cv2.imwrite(save_path, f)
        return save_path

    def metrics(self) -> dict[str, Any]:
        # example: use Pillow
        with Image.open(self.path) as img:
            return {
                "width": img.width, 
                "height": img.height, 
                "format": img.format,
                "filename": img.filename
            }

    # Mehtod for openAI id
    def assign_openai_id(self, client: OpenAI) -> str:
        with open(self.path, "rb") as file_content:
            result = self.client.files.create(
                file=file_content,
                purpose="vision",
            )
            return result.id
