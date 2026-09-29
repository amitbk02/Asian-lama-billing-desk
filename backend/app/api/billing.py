from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.database import problems


router = APIRouter(
    prefix="/api/billing",
    tags=["Billing"]
)


class BillingRequest(BaseModel):
    problem_number: str
    charges: float = Field(..., gt=0)


@router.post("/charge")
def add_charges(request: BillingRequest):

    problem = problems.find_one({
        "problem_number": request.problem_number
    })

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    if problem.get("status") == "CLOSED":
        raise HTTPException(
            status_code=400,
            detail="Cannot add charges to a closed problem"
        )

    if problem.get("status") == "EXPIRED":
        raise HTTPException(
            status_code=400,
            detail="Cannot add charges to an expired problem"
        )

    if not problem.get("after_photo", False):
        raise HTTPException(
            status_code=400,
            detail="After photo is required before adding charges"
        )

    now = datetime.utcnow()

    problems.update_one(
        {
            "problem_number": request.problem_number
        },
        {
            "$set": {
                "charges": request.charges,
                "updatedAt": now
            }
        }
    )

    return {
        "success": True,
        "message": "Charges saved successfully",
        "problem_number": request.problem_number,
        "charges": request.charges,
        "currency": "INR"
    }
