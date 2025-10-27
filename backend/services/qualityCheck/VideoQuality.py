from services.qualityCheck.Quality import Quality
from services.file_handeling.Video_file import Video_file

class VideoQuality(Quality):
    def __init__(self, file: Video_file):
        super().__init__(file)

    def validate(self) -> bool:
        return self.correct_size() and self.correct_duration()

    def issues(self) -> list[str]:
        return_list: list[str] = []
        # Dictionary for methods to test and error messages if not true
        checks = {
            self.correct_size: "Video file is too small",
            self.correct_duration: "Video file is too short or too long"
        }

        for check, message in checks.items():
            if not check():
                return_list.append(message)

        return return_list

    def correct_size(self) -> bool:
        metrics = self.file.metrics()
        return metrics["width"] >= 720 and metrics["height"] >= 720     # TODO add more precise measurements
    
    def correct_duration(self) -> bool:
        metrics = self.file.metrics()
        duration = metrics["duration"]
        # longer than 1 second, shorter than 10 seconds
        return duration > 1 and duration < 10
    
    # Add more methods to test aspects bellow
    # Also add these mehtods in self.issues dict as well self.validate 