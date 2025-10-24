from abc import ABC, abstractmethod

class SportAnalysis(ABC):
    
    @abstractmethod
    def get(self) -> str:
        ...
    