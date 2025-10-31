
from abc import abstractmethod
from services.stripe.stripe import StripeService
from services.firebase.firebase_stripe import FirebaseStripeService

class StripeEvents(StripeService):
    
    def __init__(self, customer_id: str):
        super().__init__()
        self.firebase_stripe_service = FirebaseStripeService(None)
        self.firebase_user_id = self.firebase_stripe_service.get_user_id_by_customer_id(customer_id)
        self.customer_id = customer_id
        
    def execute(self):
        self.event()
    
    @abstractmethod
    def event(self):
        ...