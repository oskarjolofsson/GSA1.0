from File import File
from openai import OpenAI
from werkzeug.datastructures import FileStorage

class Image_file(File):
    def __init__(self, f: FileStorage):
        super().__init__()
        self.allowed_extensions = set(['png'])
        self.folder = "uploads/keyframes"

    # Mehtod for openAI id
    def assign_openai_id(self, client: OpenAI) -> str:
        with open(self.path, "rb") as file_content:
            result = self.client.files.create(
                file=file_content,
                purpose="vision",
            )
            return result.id
