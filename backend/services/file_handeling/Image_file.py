from File import File

class Image_file(File):
    def __init__(self):
        super().__init__()
        self.allowed_extensions = set(['png'])
        self.path = "uploads/keyframes"

    # Mehtod for openAI id
    def id(self):
        pass
