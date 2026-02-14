import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    )
    from app.exception_handlers import (
        not_found_exception_handler,
        invalid_state_exception_handler,
        validation_exception_handler,
        service_exception_handler,
        general_exception_handler,
    )
    
    app.add_exception_handler(NotFoundException, not_found_exception_handler)
    app.add_exception_handler(InvalidStateException, invalid_state_exception_handler)
    app.add_exception_handler(ValidationException, validation_exception_handler)
    app.add_exception_handler(ServiceException, service_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)

    # --- Routers ---
    from app.api.v1.api import api_router
    app.include_router(api_router, prefix="/api/v1")

    return app
