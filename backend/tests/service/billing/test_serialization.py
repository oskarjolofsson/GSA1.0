"""Regression test for webhook payload serialization.

Provider payloads embed Decimal values that are not JSON-serializable and broke
the JSONB `raw` column insert. `json_safe` normalizes them before storage.
"""

import json
from decimal import Decimal

from core.services.payment.serialization import json_safe


def test_json_safe_converts_decimal_for_jsonb_storage():
    data = {"plan": {"amount_decimal": Decimal("999.00")}, "id": "sub_1"}

    safe = json_safe(data)

    # Must be serializable and value preserved as a plain number.
    assert json.dumps(safe)
    assert safe["plan"]["amount_decimal"] == 999.0
    assert safe["id"] == "sub_1"
