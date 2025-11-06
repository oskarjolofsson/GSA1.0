from services.firebase.firebase_stripe import FirebaseStripeService
from services.keyframes.Keyframes import Keyframes
from services.file_handeling.Video_file import Video_file
from services.qualityCheck.VideoQuality import VideoQuality
from services.analy.Sports.sportInstructions import SportAnalysis
from services.firebase.firebase_tokens import FireBaseTokens

from abc import ABC, abstractmethod
from werkzeug.datastructures import FileStorage

class Model(ABC):
    
    def __init__(self, system_instructions: SportAnalysis):
        self.system_instructions = system_instructions
    
    def get_response(self, user_id: str, video_FileStorage: FileStorage, prompt: str = "", start_time: float = None, end_time: float = None) -> dict:
        video_file = Video_file(video_FileStorage)

        # Trim video if start and end times are provided
        if start_time is not None and end_time is not None:
            video_file.trim(start_time, end_time)

        q = VideoQuality(video_file)
        if not q.validate():
            raise ValueError("\n".join(q.issues()))

        data = self.analyze(video_file, prompt=prompt)
        
        # spend one token after successful analysis
        if not FirebaseStripeService(user_id).get_subscription_status():
            FireBaseTokens(user_id).spend_tokens(amount=1)

        # Returns a formated dict that can be directly returned
        return data

    def set_system_instructions(self, system_instructions: SportAnalysis) -> None:
        self.system_instructions = system_instructions
        
    @abstractmethod
    def analyze(self, video_file: Video_file, prompt: str = ""):
        ...
