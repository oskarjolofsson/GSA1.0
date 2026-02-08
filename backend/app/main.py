from fastapi import FastAPI
import os
from dotenv import load_dotenv
load_dotenv()

from app.api.v1.api import api_router
from core.services.exceptions import (
    NotFoundException,
    InvalidStateException,
    ValidationException,
    ServiceException,
)
from .exception_handlers import (
    not_found_exception_handler,
    invalid_state_exception_handler,
    validation_exception_handler,
    service_exception_handler,
    general_exception_handler,
)

app = FastAPI(title="Backend API")

# Register exception handlers
app.add_exception_handler(NotFoundException, not_found_exception_handler)
app.add_exception_handler(InvalidStateException, invalid_state_exception_handler)
app.add_exception_handler(ValidationException, validation_exception_handler)
app.add_exception_handler(ServiceException, service_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

app.include_router(api_router, prefix="/api/v1")