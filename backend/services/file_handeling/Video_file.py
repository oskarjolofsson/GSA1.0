from File import File

class Video_file(File):
    def __init__(self):
        super().__init__()
        self.allowed_extensions = set(['mp4', 'mov', 'avi', 'mkv'])
        self.folder = "uploads/keyframes"   # TODO Create new unique foldername for every file, in case 2 of the same


    def keyframes(self):
        pass