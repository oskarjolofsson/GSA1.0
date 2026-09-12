"""Service layer exceptions."""


class ServiceException(Exception):
    """Base exception for service layer errors."""
    pass


class NotFoundException(ServiceException):
    """Raised when a requested resource is not found."""
    def __init__(self, resource_type: str, resource_id: str):
        self.resource_type = resource_type
        self.resource_id = resource_id
        super().__init__(f"{resource_type} with id {resource_id} not found")


class InvalidStateException(ServiceException):
    """Raised when an operation is attempted on a resource in an invalid state."""
    def __init__(self, message: str):
        super().__init__(message)


class ValidationException(ServiceException):
    """Raised when validation fails."""
    def __init__(self, message: str):
        super().__init__(message)


class InvalidVideoException(ServiceException):
    """Raised when video analysis fails (e.g., non-golf video, corrupted file)."""
    def __init__(self, message: str):
        super().__init__(message)
        
        
class UnauthorizedException(ServiceException):
    """Raised when a user tries to access a resource they are not authorized for."""
    def __init__(self, message: str):
        super().__init__(message)


class ForbiddenException(ServiceException):
    """Raised when a user tries to access a resource they are forbidden from accessing."""
    def __init__(self, message: str):
        super().__init__(message)
        
        
class ConflictException(ServiceException):
    def __init__(self, message: str):
        super().__init__(message)


class FocusLimitExceeded(ServiceException):
    """Raised when a free-tier (unsubscribed) user tries to hold more than one active
    Program at once.

    This is the AUTHORITATIVE, transaction-scoped check inside
    `program_service.generate_program` -- see its docstring / ADR context for why the
    router-level entitlement dependency alone is not enough to close the TOCTOU race
    between two concurrent add-focus requests.

    Minimal placeholder: Lane A (entitlement dependency splitting) may define a richer
    version of this exception in the same module. If so, reconcile at merge -- the name
    and import path (`core.services.exceptions.FocusLimitExceeded`) must stay stable so
    callers on both lanes keep working.
    """
    def __init__(self, message: str = "You already have an active focus. Subscribe to add more."):
        super().__init__(message)