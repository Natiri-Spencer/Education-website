"""Small Daraja STK Push client. Credentials and callback URL come from env vars."""

import base64
import json
import os
from datetime import datetime
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo


class MpesaError(Exception):
    """Raised when Daraja cannot start an STK Push request."""


def _configuration():
    environment = os.environ.get("MPESA_ENVIRONMENT", "sandbox").lower()
    if environment not in {"sandbox", "production"}:
        raise MpesaError("M-Pesa environment must be sandbox or production.")

    values = {
        "consumer_key": os.environ.get("MPESA_CONSUMER_KEY", "").strip(),
        "consumer_secret": os.environ.get("MPESA_CONSUMER_SECRET", "").strip(),
        "shortcode": os.environ.get("MPESA_SHORTCODE", "").strip(),
        "passkey": os.environ.get("MPESA_PASSKEY", "").strip(),
        "callback_url": os.environ.get("MPESA_CALLBACK_URL", "").strip(),
        "transaction_type": os.environ.get("MPESA_TRANSACTION_TYPE", "CustomerPayBillOnline").strip(),
    }
    if not all(values.values()):
        raise MpesaError("M-Pesa payments are not configured yet.")
    if urlparse(values["callback_url"]).scheme != "https":
        raise MpesaError("The M-Pesa callback URL must use HTTPS.")

    base_url = (
        "https://sandbox.safaricom.co.ke"
        if environment == "sandbox"
        else "https://api.safaricom.co.ke"
    )
    return base_url, values


def _send(url, *, headers, body=None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    request = Request(url, data=data, headers=headers, method="GET" if body is None else "POST")
    try:
        with urlopen(request, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise MpesaError("Could not reach the M-Pesa payment service.") from exc


def initiate_stk_push(*, phone_number, amount, course_title):
    base_url, config = _configuration()
    credentials = f"{config['consumer_key']}:{config['consumer_secret']}".encode("utf-8")
    basic_auth = base64.b64encode(credentials).decode("ascii")
    token_response = _send(
        f"{base_url}/oauth/v1/generate?grant_type=client_credentials",
        headers={"Authorization": f"Basic {basic_auth}"},
    )
    access_token = token_response.get("access_token")
    if not access_token:
        raise MpesaError("M-Pesa authorization failed.")

    timestamp = datetime.now(ZoneInfo("Africa/Nairobi")).strftime("%Y%m%d%H%M%S")
    password_source = f"{config['shortcode']}{config['passkey']}{timestamp}".encode("utf-8")
    password = base64.b64encode(password_source).decode("ascii")
    payload = {
        "BusinessShortCode": config["shortcode"],
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": config["transaction_type"],
        "Amount": int(amount),
        "PartyA": phone_number,
        "PartyB": config["shortcode"],
        "PhoneNumber": phone_number,
        "CallBackURL": config["callback_url"],
        "AccountReference": "EduPortal",
        "TransactionDesc": f"Course: {course_title}"[:40],
    }
    response = _send(
        f"{base_url}/mpesa/stkpush/v1/processrequest",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        body=payload,
    )
    if response.get("ResponseCode") != "0" or not response.get("CheckoutRequestID"):
        raise MpesaError("M-Pesa could not start the payment prompt. Please try again.")
    return response
