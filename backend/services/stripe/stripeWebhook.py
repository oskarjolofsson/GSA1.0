from __future__ import annotations

import os
from typing import Any, Dict, Optional, Tuple

import stripe
from dotenv import load_dotenv

from services.firebase.firebase_stripe import FirebaseStripeService
from services.stripe.stripe import StripeService


class StripeWebhookService(StripeService):
    """
    Stable, single-parse Stripe webhook handler that
    - validates the signature once
    - resolves the Firebase user via metadata or customer lookup
    - updates Firestore through FirebaseStripeService consistently
    """

    def __init__(self, sig_header: str, payload: bytes):
        super().__init__()
        self.sig_header = sig_header
        self.payload = payload

        load_dotenv()
        self.webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

        # Parse and verify the event once
        self.event, self.event_type, self.data = self._parse_event()

        # Resolve Firebase user context (may be None at this stage and filled lazily)
        self.firebase_user_id: Optional[str] = self._extract_firebase_uid_from_data(self.data)
        self.firebase_stripe_service: Optional[FirebaseStripeService] = (
            FirebaseStripeService(firebase_user_id=self.firebase_user_id)
            if self.firebase_user_id
            else None
        )

        # Event router
        self.events_map = {
            "checkout.session.completed": self.handle_checkout_session_completed,
            "checkout.session.expired": self.handle_checkout_session_expired,
            "customer.subscription.created": self.handle_subscription_event,
            "customer.subscription.updated": self.handle_subscription_event,
            "customer.subscription.deleted": self.handle_subscription_deleted,
            "invoice.payment_succeeded": self.handle_invoice_payment_succeeded,
            "invoice.payment_failed": self.handle_invoice_payment_failed,
            "invoice.finalized": self.handle_invoice_finalized,
            "invoice.updated": self.handle_invoice_updated,
            "invoice.created": self.handle_invoice_created,
            "customer.deleted": self.handle_customer_deleted,
            "customer.updated": self.handle_customer_updated,
        }

    # -----------------------------
    # Public API
    # -----------------------------
    def handle_event(self) -> Tuple[str, int]:
        handler = self.events_map.get(self.event_type)
        if not handler:
            # Standardized log: event type and user id (may be None if not resolvable)
            print(f"Event: {self.event_type}, user_id: {self.firebase_user_id}")
            return "Unhandled event", 400

        try:
            handler()
            return "Success", 200
        except Exception as e:
            # Ensure we never crash the webhook endpoint
            print(f"Error handling event {self.event_type}: {e}")
            return "Error", 500

    # -----------------------------
    # Event handlers
    # -----------------------------
    def handle_checkout_session_completed(self) -> None:
        session = self.data
        self._log_event_and_return()

    def handle_subscription_event(self) -> None:
        subscription = self.data
        self._ensure_firebase_context(subscription)

        items = subscription.get("items", {}).get("data", [])
        subscription_id = subscription.get("id")
        status = subscription.get("status")
        current_period_end = subscription.get("current_period_end") or (
            items[0].get("current_period_end") if items else None
        )
        price_id = None

        # Some webhooks send partial subscription data
        if not current_period_end or not subscription.get("items"):
            # Safely refetch full subscription to ensure we get all fields
            try:
                sub = stripe.Subscription.retrieve(subscription_id)
                items = sub.get("items", {}).get("data", [])
                current_period_end = sub.get("current_period_end") or (
                    items[0].get("current_period_end") if items else None
                )
                price_id = items[0].get("price", {}).get("id") if items else None
                status = sub.get("status", status)
            except Exception as e:
                print(f"Failed to fetch full subscription data: {e}")
        else:
            items = subscription.get("items", {}).get("data", [])
            price_id = items[0].get("price", {}).get("id") if items else None

        self._firebase().update_subscription_info(
            subscription_id=subscription_id,
            price_id=price_id,
            current_period_end=current_period_end,
            status=status,
        )

        self._log_event_and_return()


    def handle_subscription_deleted(self) -> None:
        subscription = self.data
        self._ensure_firebase_context(subscription)

        self._firebase().update_subscription_info(
            subscription_id=None,
            price_id=None,
            current_period_end=None,
            status="free",
        )
        self._log_event_and_return()

    def handle_invoice_payment_succeeded(self) -> None:
        invoice = self.data
        self._ensure_firebase_context(invoice)

        subscription_id = invoice.get("subscription")
        if subscription_id:
            sub = stripe.Subscription.retrieve(subscription_id)
            current_period_end = sub.get("current_period_end")
            status = sub.get("status")
            items = sub.get("items", {}).get("data", [])
            price_id = items[0].get("price", {}).get("id") if items else None

            self._firebase().update_subscription_info(
                subscription_id=subscription_id,
                price_id=price_id,
                current_period_end=current_period_end,
                status=status,
            )
        self._log_event_and_return()

    def handle_invoice_payment_failed(self) -> None:
        invoice = self.data
        self._ensure_firebase_context(invoice)

        subscription_id = invoice.get("subscription")
        # Reflect payment issue by marking status as past_due if we can
        current_period_end = None
        price_id = None
        try:
            if subscription_id:
                sub = stripe.Subscription.retrieve(subscription_id)
                current_period_end = sub.get("current_period_end")
                items = sub.get("items", {}).get("data", [])
                price_id = items[0].get("price", {}).get("id") if items else None
        except Exception as e:
            print("Failed to retrieve subscription on payment_failed:", e)

        self._firebase().update_subscription_info(
            subscription_id=subscription_id,
            price_id=price_id,
            current_period_end=current_period_end,
            status="past_due",
        )
        self._log_event_and_return()

    def handle_invoice_finalized(self) -> None:
        invoice = self.data
        self._ensure_firebase_context(invoice)
        self._log_event_and_return()

    def handle_invoice_updated(self) -> None:
        invoice = self.data
        self._ensure_firebase_context(invoice)
        self._log_event_and_return()

    def handle_invoice_created(self) -> None:
        invoice = self.data
        self._ensure_firebase_context(invoice)
        self._log_event_and_return()

    def handle_customer_deleted(self) -> None:
        customer = self.data
        self._ensure_firebase_context(customer)
        self._firebase().update_subscription_info(
            subscription_id=None,
            price_id=None,
            current_period_end=None,
            status="free",
        )
        self._log_event_and_return()

    def handle_customer_updated(self) -> None:
        customer = self.data
        self._ensure_firebase_context(customer)
        self._firebase().update_customer_info(
            email=customer.get("email"),
            name=customer.get("name"),
            phone=customer.get("phone"),
        )
        self._log_event_and_return()

    def handle_checkout_session_expired(self) -> None:
        session = self.data
        self._ensure_firebase_context(session)
        self._log_event_and_return()

    # -----------------------------
    # Helpers
    # -----------------------------
    def _parse_event(self) -> Tuple[Dict[str, Any], str, Dict[str, Any]]:
        if not self.webhook_secret:
            raise ValueError("STRIPE_WEBHOOK_SECRET not configured")
        try:
            event = stripe.Webhook.construct_event(self.payload, self.sig_header, self.webhook_secret)
        except stripe.error.SignatureVerificationError:
            raise
        event_type: str = event.get("type")
        data: Dict[str, Any] = event.get("data", {}).get("object", {})
        return event, event_type, data

    def _extract_firebase_uid_from_data(self, data: Dict[str, Any]) -> Optional[str]:
        # Many objects include metadata; prefer it when present
        return data.get("metadata", {}).get("firebase_uid")

    def _ensure_firebase_context(self, stripe_object: Dict[str, Any]) -> None:
        """
        Unified helper to resolve Firebase user context from any Stripe object.
        Handles sessions, subscriptions, invoices, and customers by extracting
        metadata or customer_id for Firestore lookup.
        """
        # Try to extract firebase_uid from metadata first
        if not self.firebase_user_id:
            self.firebase_user_id = self._extract_firebase_uid_from_data(stripe_object)

        # Extract customer_id from the object (location varies by object type)
        # - sessions and subscriptions use "customer"
        # - invoices use "customer"
        # - customers use "id"
        customer_id = stripe_object.get("customer") or stripe_object.get("id")

        self._ensure_firebase_service(customer_id)

    def _ensure_firebase_service(self, customer_id: Optional[str]) -> None:
        # If we still don't have a Firebase user id, resolve by customer id via Firestore lookup
        if not self.firebase_stripe_service:
            self.firebase_stripe_service = FirebaseStripeService(firebase_user_id=self.firebase_user_id)

        if not self.firebase_user_id and customer_id:
            resolved = self.firebase_stripe_service.get_user_id_by_customer_id(customer_id)
            if resolved:
                self.firebase_user_id = resolved
                # Rebind service to the resolved user id
                self.firebase_stripe_service = FirebaseStripeService(firebase_user_id=self.firebase_user_id)

    def _firebase(self) -> FirebaseStripeService:
        if not self.firebase_stripe_service:
            # Final fallback construction; will error if user context truly missing
            self.firebase_stripe_service = FirebaseStripeService(firebase_user_id=self.firebase_user_id)
        return self.firebase_stripe_service

    def _log_event_and_return(self) -> None:
        # Standardized end-of-handler log: event type and user id, then return
        print(f"Event: {self.event_type}, user_id: {self.firebase_user_id} \n")
        return