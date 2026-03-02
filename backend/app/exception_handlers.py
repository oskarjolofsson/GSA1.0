from fastapi import Request, status
from fastapi.responses import JSONResponse
from core.services.exceptions import (
    NotFoundException,
    InvalidStateException,
    UnauthorizedException,
    ValidationException,
    ServiceException,
    InvalidVideoException,
    ForbiddenException
)
from core.infrastructure.auth.exceptions import AuthenticationError
from traceback import format_exc


async def not_found_exception_handler(request: Request, exc: NotFoundException):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": str(exc)},
    )


async def invalid_state_exception_handler(request: Request, exc: InvalidStateException):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)},
    )


async def validation_exception_handler(request: Request, exc: ValidationException):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": str(exc)},
    )


async def service_exception_handler(request: Request, exc: ServiceException):
    print(f"Unexpected error: {format_exc()}"   )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc)},
    )


async def general_exception_handler(request: Request, exc: Exception):
    print(f"Unexpected error: {format_exc()}"   )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"An unexpected error occurred: {format_exc()}"},
    )

async def invalid_video_exception_handler(request: Request, exc: InvalidVideoException):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={"detail": str(exc)},
    )
    
async def invalid_authentication_exception_handler(request: Request, exc: AuthenticationError):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": str(exc)},
    )
    
    
async def forbidden_exception_handler(request: Request, exc: ForbiddenException):
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": str(exc)},
    )
    
    
async def unauthorized_exception_handler(request: Request, exc: UnauthorizedException):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": str(exc)},
    )