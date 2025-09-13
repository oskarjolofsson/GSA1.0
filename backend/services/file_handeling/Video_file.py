from File import File
from services.keyframes.Keyframes import Keyframes
from typing import List
from openai import OpenAI

class Video_file(File):
    def __init__(self):
        super().__init__()
        self.allowed_extensions = set(['mp4', 'mov', 'avi', 'mkv'])
        self.folder = "uploads/keyframes"   # TODO Create new unique foldername for every file, in case 2 of the same


    def keyframes(self) -> Keyframes:
        # Divide up into FileStorage images
        
        # Put them in a list

        # Create keyframes object, return that
        pass

    def open_ai_ids(self, client: OpenAI) -> List[str]:
        return self.keyframes().open_ai_id(client)