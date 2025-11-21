from services.file_handeling.File import File
from openai import OpenAI
from werkzeug.datastructures import FileStorage
from PIL import Image
from typing import Any
import numpy as np
import os
import cv2

class Image_file(File):
    def __init__(self, f: FileStorage | np.ndarray, filename: str | None = ""):
        super().__init__(f)

        if isinstance(f, np.ndarray):
            self._path = self._saveNpDarray(f, filename or "keyframe.jpg")

    @property
    def allowed_extensions(self) -> set:
        return {'png', 'jpg'}

    @property
    def folder(self) -> str:
        return "uploads/keyframes"
    def _saveNpDarray(self, f: np.ndarray, name: str) -> str:
        filename = self._generate_unique_filename(name if name else "keyframe.jpg")
        save_path = os.path.join(self.folder, filename)
        os.makedirs(self.folder, exist_ok=True)
        cv2.imwrite(save_path, f)
        return save_path

    def metrics(self) -> dict[str, Any]:
        with Image.open(self.path()) as img:
            return {
                "width": img.width, 
                "height": img.height, 
                "format": img.format,
                "filename": img.filename
            }

    def assign_openai_id(self, client: OpenAI) -> str:
        with open(self.path(), "rb") as file_content:
            result = client.files.create(
                file=file_content,
                purpose="vision",
            )
            return result.id
    
    def pixelate_face(self, pixel_size: int = 20) -> None:
        # Load image
        img = cv2.imread(self.path())

        # Load face detector (bundled with cv2)
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )

        # Convert to grayscale for detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Detect faces
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

        pixel_size = 20  # Increase for bigger blocks

        # Pixelate each detected face
        for (x, y, w, h) in faces:
            face = img[y:y+h, x:x+w]

            # shrink then expand to create pixelation
            small = cv2.resize(face, (w // pixel_size, h // pixel_size))
            pixelated = cv2.resize(small, (w, h), interpolation=cv2.INTER_NEAREST)

            img[y:y+h, x:x+w] = pixelated

        # Save output
        cv2.imwrite(self.path(), img)
        print("Done!")


