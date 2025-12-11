from services.analy.Models.OpenAI.gpt5_nano import Gpt5_nano_AnalysisService
from services.firebase.firebase_stripe import FirebaseStripeService
from services.analy.Sports.sportInstructions import SportAnalysis
from services.analy.Models.model import Model
from services.firebase.firebase_tokens import FireBaseTokens

# Add models and sports as needed
# Import models and sports analyses
from services.analy.Models.OpenAI.gpt5 import Gpt5AnalysisService
from services.analy.Sports.golfInstructions import GolfAnalysis
from services.firebase.firebase_past_analysis import FireBasePastAnalysis

# Factory
models = {
    "gpt-5": Gpt5AnalysisService,
    "gpt-5-nano": Gpt5_nano_AnalysisService,
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
                model_name: str, 
                sport_name: str, 
                video_FileStorage, 
                prompt: str = "", 
                start_time: float = None, 
                end_time: float = None, 
                user_id: str = "") -> dict:
        
        # Check current balance first
        print(self.user_has_subscription(user_id))
        print(type(FireBaseTokens(user_id).get_user_tokens()))
        
        if not self.user_has_subscription(user_id) and FireBaseTokens(user_id).get_user_tokens() < 1:
            raise ValueError("Insufficient tokens to perform analysis.")

        # Create analysis
        sport_class = self.__get_sport_analysis(sport_name)
        sport_analysis = sport_class()
        
        model_class = self.__get_model(model_name)
        model_instance = model_class(system_instructions=sport_analysis)
        
        return_dict = model_instance.get_response(video_FileStorage=video_FileStorage, 
                                                  prompt=prompt, 
                                                  start_time=start_time, 
                                                  end_time=end_time, 
                                                  user_id=user_id)
        
        # Log past analysis
        FireBasePastAnalysis(user_id, sport_name).add_analysis(return_dict)
        
        return return_dict
    
    def user_has_subscription(self, user_id: str) -> bool:
        return FirebaseStripeService(user_id).get_subscription_status()