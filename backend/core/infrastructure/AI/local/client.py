from ..ports import AnalysisAI
from ....config import GEMINI_API_KEY
from ..google.videoAnalyzer import analyze_video

from google import genai  

class LocalAnalysisClient(AnalysisAI):
    
    ...