


from dataclasses import dataclass
from typing import Any


@dataclass
class RevenueCatWebhookEvent:
    event_id: str
    event_type: str
    # The RevenueCat `event` object (everything under the top-level envelope).
    data: dict
    raw: Any
    # Unix seconds, derived from event_timestamp_ms; used for the out-of-order guard.
    event_created_at: int | None = None