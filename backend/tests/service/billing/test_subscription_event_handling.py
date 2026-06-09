"""Regression tests for subscription period extraction.

Current Stripe API versions deliver current_period_start/end on the subscription
*item* (items.data[0]), not the subscription object. Reading them from the
subscription top level (the old code) silently yielded NULL. These guard the fix.
"""

import json
from decimal import Decimal

from core.services.payment.billing_service import _extract_period, _json_safe


def test_extract_period_reads_from_subscription_item():
    data = {
        "current_period_start": None,
        "current_period_end": None,
        "items": {
            "data": [
                {
                    "current_period_start": 1_710_000_000,
                    "current_period_end": 1_710_086_400,
                    "price": {"id": "price_x"},
                }
            ]
        },
    }

    assert _extract_period(data) == (1_710_000_000, 1_710_086_400)


def test_extract_period_falls_back_to_top_level_when_item_has_none():
    data = {
        "current_period_start": 1_700_000_000,
        "current_period_end": 1_700_086_400,
        "items": {"data": [{"price": {"id": "price_x"}}]},
    }

    assert _extract_period(data) == (1_700_000_000, 1_700_086_400)


def test_extract_period_handles_missing_everything():
    assert _extract_period({}) == (None, None)


def test_json_safe_converts_decimal_for_jsonb_storage():
    # Stripe payloads embed Decimal (e.g. plan.amount_decimal) which is not
    # JSON-serializable and broke the JSONB `raw` column insert.
    data = {"plan": {"amount_decimal": Decimal("999.00")}, "id": "sub_1"}

    safe = _json_safe(data)

    # Must be serializable and value preserved as a plain number.
    assert json.dumps(safe)
    assert safe["plan"]["amount_decimal"] == 999.0
    assert safe["id"] == "sub_1"
