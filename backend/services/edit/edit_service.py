from werkzeug.datastructures import FileStorage
from services.file_handeling.Video_file import Video_file
import io


class VideoEdit:
    """
    Helper class to convert an upload (FileStorage) into a Video_file,
    perform edits (trim), and produce a FileStorage to return.
    """
    def __init__(self, upload: FileStorage):
        if not isinstance(upload, FileStorage):
            raise ValueError("upload must be a werkzeug FileStorage")
        # create Video_file which will save the file to disk
        self.video = Video_file(upload)

    def trim(self, start: float, end: float) -> io.BytesIO:
        self.video.trim(start, end)
        trimmed_fs = self.video.to_filestorage()
        # Convert to bytes to return in JSON
        trimmed_mp4_bytes: bytes = trimmed_fs.read()
        # wrap in a file-like object
        buf = io.BytesIO(trimmed_mp4_bytes)             
        buf.seek(0)

        # clean up the saved files
        self.video.remove()

        return buf


def trim_video(upload: FileStorage, start, end) -> io.BytesIO:
    return VideoEdit(upload).trim(float(start), float(end))
    

    
    
    
