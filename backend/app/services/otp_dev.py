import os
import requests
from dotenv import load_dotenv

load_dotenv()

OTP_DEV_API_KEY = os.getenv("OTP_DEV_API_KEY")
OTP_DEV_SENDER = os.getenv("OTP_DEV_SENDER")
OTP_DEV_TEMPLATE = os.getenv("OTP_DEV_TEMPLATE")

OTP_DEV_URL = "https://api.otp.dev/v1/verifications"


def send_otp(phone: str):

    payload = {
        "data": {
            "channel": "sms",
            "sender": OTP_DEV_SENDER,
            "phone": phone,
            "template": OTP_DEV_TEMPLATE,
            "code_length": 4
        }
    }

    headers = {
        "X-OTP-Key": OTP_DEV_API_KEY,
        "accept": "application/json",
        "content-type": "application/json"
    }

    response = requests.post(
        OTP_DEV_URL,
        json=payload,
        headers=headers,
        timeout=20
    )

    print("OTP.dev SEND status:", response.status_code)
    print("OTP.dev SEND response:", response.text)

    if not response.ok:
        raise RuntimeError(
            f"OTP.dev error {response.status_code}: "
            f"{response.text}"
        )

    return response.json()


def verify_otp(phone: str, code: str):

    params = {
        "code": code,
        "phone": phone
    }

    headers = {
        "X-OTP-Key": OTP_DEV_API_KEY,
        "accept": "application/json"
    }

    response = requests.get(
        OTP_DEV_URL,
        params=params,
        headers=headers,
        timeout=20
    )

    print("OTP.dev VERIFY status:", response.status_code)
    print("OTP.dev VERIFY response:", response.text)

    if not response.ok:
        raise RuntimeError(
            f"OTP.dev verification error "
            f"{response.status_code}: {response.text}"
        )

    return response.json()
