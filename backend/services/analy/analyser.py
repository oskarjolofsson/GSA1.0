from services.analy.Models.OpenAI.gpt5_nano import Gpt5_nano_AnalysisService
from services.firebase.firebase_stripe import FirebaseStripeService
from services.analy.Sports.sportInstructions import SportAnalysis
from services.analy.Models.model import Model
from services.firebase.firebase_tokens import FireBaseTokens

# Add models and sports as needed
# Import models and sports analyses
from services.analy.Models.OpenAI.gpt5 import Gpt5AnalysisService
from services.analy.Sports.golfInstructions import GolfAnalysis
from services.analy.Models.Gemini.gemini25flash import Gemini_25_flash
from services.analy.Models.Gemini.gemini25flashlite import Gemini_25_flash_lite
from services.analy.Models.Gemini.gemini25pro import Gemini_25_pro
from services.analy.Models.Gemini.gemini3propreview import Gemini_3_pro_preview
from services.analy.Models.OpenAI.gpt52 import Gpt52AnalysisService

# Factory
models = {
    "gpt-5": Gpt5AnalysisService,
    "gpt-5-nano": Gpt5_nano_AnalysisService,
    "gemini-2.5-flash": Gemini_25_flash,
    "gemini-2.5-flash-lite": Gemini_25_flash_lite,  # Broken model
    "gemini-2.5-pro": Gemini_25_pro,    # Broken model
    "gemini-3-pro-preview": Gemini_3_pro_preview,
    "gpt-5.2": Gpt52AnalysisService,
}

sports = {
    "golf": GolfAnalysis,
}

class Analysis():
    
    #private methods
    def __get_model(self, model_name: str) -> Model:
        model_class = models.get(model_name)
        if not model_class:
            raise ValueError(f"Model '{model_name}' not found.")
        return model_class
    
    def __get_sport_analysis(self, sport_name: str) -> SportAnalysis:
        sport_class = sports.get(sport_name)
        if not sport_class:
            raise ValueError(f"Sport analysis for '{sport_name}' not found.")
        return sport_class
    
    # public method
    def execute(self, 
                data: dict,
                video_blob
                ) -> dict:
        
        start_time = data.get("video").get("start_time", None)
        end_time = data.get("video").get("end_time", None)
        shape = data.get("prompts").get("shape", None)
        height = data.get("prompts").get("height", None)
        misses = data.get("prompts").get("misses", None)
        extra = data.get("prompts").get("extra", None)
        user_id = data.get("user_id")
        sport_name = data.get("sport", "golf")
        model_name = data.get("video").get("model")
        
        # # Check current balance first
        # print(self.user_has_subscription(user_id))
        # print(type(FireBaseTokens(user_id).get_user_tokens()))
        
        # if not self.user_has_subscription(user_id) and FireBaseTokens(user_id).get_user_tokens() < 1:
        #     raise ValueError("Insufficient tokens to perform analysis.")

        # Create analysis
        sport_class = self.__get_sport_analysis(sport_name)
        sport_analysis = sport_class()
        
        model_class = self.__get_model(model_name)
        model_instance = model_class(system_instructions=sport_analysis)
        
        return_dict = model_instance.get_response(video_blob=video_blob, 
                                                  start_time=start_time, 
                                                  end_time=end_time, 
                                                  user_id=user_id,
                                                  shape=shape,
                                                  height=height,
                                                  misses=misses,
                                                  extra=extra
                                                    )

        
        return return_dict
    
    def user_has_subscription(self, user_id: str) -> bool:
        return FirebaseStripeService(user_id).get_subscription_status()
    
# Singleton instance    
analyser = Analysis()