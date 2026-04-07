import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.infrastructure.payment.stripe.exceptions import StripeInfrastructureError

def create_app() -> FastAPI:
    app = FastAPI(
        title="True Swing API",
        version="1.0.0"
    )

    # --- Environment config ---
    FRONTENDS = [
        os.getenv("VITE_API_URL"),
        os.getenv("VITE_API_URL2")
    ]
    FRONTENDS = [o for o in FRONTENDS if o]

    # --- CORS ---
    app.add_middleware(
        CORSMiddleware,
        allow_origins=FRONTENDS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        expose_headers=["Content-Type"],
    )

    print(f"Allowed CORS origins: {FRONTENDS}")

    # --- Exception Handlers ---
    from core.services.exceptions import (
        NotFoundException,
        InvalidStateException,
        ValidationException,
        ServiceException,
        InvalidVideoException,
        ForbiddenException,
        UnauthorizedException,
        ConflictException
    )
    from core.infrastructure.auth.exceptions import AuthenticationError
    from app.exception_handlers import (
        not_found_exception_handler,
        invalid_state_exception_handler,
        validation_exception_handler,
        service_exception_handler,
        general_exception_handler,
        invalid_authentication_exception_handler,
        invalid_video_exception_handler,
        forbidden_exception_handler,
        unauthorized_exception_handler,
        stripe_infrastructure_exception_handler,
        conflict_exception_handler
    )
    
    app.add_exception_handler(NotFoundException, not_found_exception_handler)
    app.add_exception_handler(InvalidStateException, invalid_state_exception_handler)
    app.add_exception_handler(ValidationException, validation_exception_handler)
    app.add_exception_handler(ServiceException, service_exception_handler)
    app.add_exception_handler(AuthenticationError, invalid_authentication_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
    app.add_exception_handler(InvalidVideoException, invalid_video_exception_handler)
    app.add_exception_handler(ForbiddenException, forbidden_exception_handler)
    app.add_exception_handler(UnauthorizedException, unauthorized_exception_handler)
    app.add_exception_handler(StripeInfrastructureError,stripe_infrastructure_exception_handler)
    app.add_exception_handler(ConflictException, conflict_exception_handler)

    # --- Routers ---
    from app.api.v1.api import api_router
    app.include_router(api_router, prefix="/api/v1")

    return app
