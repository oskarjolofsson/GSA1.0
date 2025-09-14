from typing import List
from openai import OpenAI

from services.file_handeling.Image_file import Image_file
from services.file_handeling.Video_file import Video_file

class Keyframes:
    def __init__(self):
        self.images = []

    def add(self, file: Image_file) -> None:
        self.images.append(file)

    def add_all(self, li: List[Image_file]) -> None:
        for file in li:
            self.add(file)

    def open_ai_id(self, client: OpenAI) -> List[str]:
        return_li = []
        # get list with id:s from every image in class
        for file in self.images:
            return_li.append(file.assign_openai_id(client))

        return_li

    def deleteAll(self):
        for image in self.images():
            image.remove()


