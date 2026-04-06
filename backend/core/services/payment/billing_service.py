

async def start_subscription_checkout(user_id: str) -> str:
    # Load the user from db
    
    # Check the subscription status
    
    # Call stripe gateway to create a checkout session
    
    # Return that
    ...

async def create_customer_portal(user_id: str) -> str:
    # Load the user
    
    # get the stripe customer ID
    
    # Create stripe customer portal session
    
    # Return the URL
    
    ...

async def handle_stripe_webhook(payload: bytes, signature: str) -> None:
    # Verify and parse the event
    
    # Idedntify what happened and update the DB accordingly
    
    ...