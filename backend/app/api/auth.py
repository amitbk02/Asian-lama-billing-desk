from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.database import customers
from backend.app.services.otp_dev import (
    send_otp,
    verify_otp
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


class SendOTPRequest(BaseModel):
    mobile: str


class VerifyOTPRequest(BaseModel):
    mobile: str
    otp: str


def normalize_phone(mobile: str) -> str:

    mobile = mobile.strip()

    # 9967274402 -> 919967274402
    if len(mobile) == 10:
        return "91" + mobile

    # +919967274402 -> 919967274402
    if mobile.startswith("+"):
        return mobile[1:]

    return mobile


@router.post("/send-otp")
def request_otp(request: SendOTPRequest):

    customer = customers.find_one({
        "mobile": request.mobile
    })

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    phone = normalize_phone(request.mobile)

    try:

        result = send_otp(phone)

        return {
            "success": True,
            "message": "OTP sent successfully",
            "mobile": request.mobile,
            "provider": "OTP.dev",
            "provider_response": result
        }

    except Exception as e:

        raise HTTPException(
            status_code=502,
            detail=str(e)
        )


@router.post("/verify-otp")
def request_verify_otp(
    request: VerifyOTPRequest
):

    customer = customers.find_one({
        "mobile": request.mobile
    })

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    phone = normalize_phone(request.mobile)

    try:

        result = verify_otp(
            phone,
            request.otp
        )

        # OTP.dev returns empty data
        # when OTP is invalid.
        if not result.get("data"):

            raise HTTPException(
                status_code=401,
                detail="Invalid or expired OTP"
            )

        customers.update_one(
            {
                "mobile": request.mobile
            },
            {
                "$set": {
                    "authenticated": True
                }
            }
        )

        return {
            "success": True,
            "message": "Customer authenticated successfully",
            "mobile": request.mobile,
            "authenticated": True
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=502,
            detail=str(e)
        )
