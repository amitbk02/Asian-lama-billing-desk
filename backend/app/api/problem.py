from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.database import customers, problems


router = APIRouter(
    prefix="/api/problems",
    tags=["Problems"]
)


class ProblemCreate(BaseModel):
    mobile: str = Field(..., min_length=10, max_length=15)
    problem_statement: str = Field(..., min_length=5)


class ProblemStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(WIP|CLOSED)$")


def generate_problem_number(now: datetime) -> str:

    date_prefix = now.strftime("%d-%m-%Y")

    count = problems.count_documents({
        "problem_number": {
            "$regex": f"^{date_prefix}-"
        }
    })

    sequence = count + 1

    while True:

        problem_number = f"{date_prefix}-{sequence:02d}"

        if not problems.find_one({
            "problem_number": problem_number
        }):
            return problem_number

        sequence += 1


@router.post("")
def create_problem(request: ProblemCreate):

    customer = customers.find_one({
        "mobile": request.mobile
    })

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    if not customer.get("authenticated", False):
        raise HTTPException(
            status_code=401,
            detail="Customer is not authenticated"
        )

    now = datetime.utcnow()

    expires_at = now + timedelta(days=60)

    problem_number = generate_problem_number(now)

    problem = {
        "problem_number": problem_number,
        "customer_mobile": request.mobile,
        "customer_name": customer.get("name"),
        "problem_statement": request.problem_statement,

        "status": "OPEN",

        "before_photo": False,
        "after_photo": False,

        "charges": None,
        "invoice_number": None,

        "createdAt": now,
        "updatedAt": now,
        "expiresAt": expires_at
    }

    result = problems.insert_one(problem)

    return {
        "success": True,
        "message": "Problem created successfully",
        "problem_number": problem_number,
        "problem_id": str(result.inserted_id),
        "status": "OPEN",
        "expiresAt": expires_at
    }


@router.get("/{problem_number}")
def get_problem(problem_number: str):

    problem = problems.find_one({
        "problem_number": problem_number
    })

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    now = datetime.utcnow()

    expires_at = problem.get("expiresAt")

    if (
        problem.get("status") in {"OPEN", "WIP"}
        and expires_at
        and expires_at <= now
    ):

        problems.update_one(
            {"_id": problem["_id"]},
            {
                "$set": {
                    "status": "EXPIRED",
                    "updatedAt": now
                }
            }
        )

        problem["status"] = "EXPIRED"

    return {
        "success": True,
        "problem": {
            "problem_number": problem["problem_number"],
            "customer_mobile": problem["customer_mobile"],
            "customer_name": problem.get("customer_name"),
            "problem_statement": problem["problem_statement"],
            "status": problem["status"],
            "before_photo": problem.get("before_photo", False),
            "after_photo": problem.get("after_photo", False),
            "charges": problem.get("charges"),
            "invoice_number": problem.get("invoice_number"),
            "createdAt": problem.get("createdAt"),
            "updatedAt": problem.get("updatedAt"),
            "expiresAt": problem.get("expiresAt")
        }
    }


@router.patch("/{problem_number}/status")
def update_problem_status(
    problem_number: str,
    request: ProblemStatusUpdate
):

    problem = problems.find_one({
        "problem_number": problem_number
    })

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    now = datetime.utcnow()

    current_status = problem.get("status")

    if current_status == "EXPIRED":
        raise HTTPException(
            status_code=400,
            detail="Expired problem cannot be updated"
        )

    if current_status == "CLOSED":
        raise HTTPException(
            status_code=400,
            detail="Closed problem cannot be updated"
        )

    # Move problem to WIP
    if request.status == "WIP":

        if not problem.get("before_photo", False):
            raise HTTPException(
                status_code=400,
                detail="Before photo is required before setting problem to WIP"
            )

        problems.update_one(
            {"_id": problem["_id"]},
            {
                "$set": {
                    "status": "WIP",
                    "updatedAt": now
                }
            }
        )

        return {
            "success": True,
            "message": "Problem status updated to WIP",
            "problem_number": problem_number,
            "status": "WIP"
        }

    # Close problem
    if request.status == "CLOSED":

        if current_status != "WIP":
            raise HTTPException(
                status_code=400,
                detail="Problem must be in WIP status before closing"
            )

        if not problem.get("before_photo", False):
            raise HTTPException(
                status_code=400,
                detail="Before photo is required before closing the problem"
            )

        if not problem.get("after_photo", False):
            raise HTTPException(
                status_code=400,
                detail="After photo is required before closing the problem"
            )

        if problem.get("charges") is None:
            raise HTTPException(
                status_code=400,
                detail="Charges are required before closing the problem"
            )

        if not problem.get("invoice_number"):
            raise HTTPException(
                status_code=400,
                detail="Invoice is required before closing the problem"
            )

        problems.update_one(
            {"_id": problem["_id"]},
            {
                "$set": {
                    "status": "CLOSED",
                    "closedAt": now,
                    "updatedAt": now
                }
            }
        )

        return {
            "success": True,
            "message": "Problem closed successfully",
            "problem_number": problem_number,
            "status": "CLOSED",
            "closedAt": now
        }

    raise HTTPException(
        status_code=400,
        detail="Invalid status"
    )
