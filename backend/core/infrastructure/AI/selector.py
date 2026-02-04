# core/infrastructure/ai/selector.py
from .ports import AnalysisAI
from .openAI.client import OpenAIAnalysisClient
from .local.client import AnthropicAnalysisClient
from .google.client import GoogleAnalysisClient

class AIProviderSelector:
    def __init__(self):
        self.providers: dict[str, AnalysisAI] = {
            "openai": OpenAIAnalysisClient(),
            "local": AnthropicAnalysisClient(),
            "google": GoogleAnalysisClient(),
        }

    def get(self, provider: str) -> AnalysisAI:
        try:
            return self.providers[provider]
        except KeyError:
            raise ValueError(f"Unknown AI provider: {provider}")
