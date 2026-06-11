import json
from decimal import Decimal
from typing import Any


def json_safe(data: dict) -> dict:
    """Coerce a provider payload into plain JSON types for a JSONB column.

    Stripe payloads contain Decimal values (e.g. plan.amount_decimal) and
    RevenueCat payloads can carry large millisecond integers / nested objects; the
    default JSON encoder can't serialize Decimal. Round-trip with a Decimal-aware
    default to coerce everything to plain JSON types.
    """
    return json.loads(json.dumps(data, default=_json_default))


def _json_default(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    return str(value)
