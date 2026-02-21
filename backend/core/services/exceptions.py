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
