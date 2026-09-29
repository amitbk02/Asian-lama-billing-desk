from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.database import customers


router = APIRouter(
    prefix="/api/customers",
    tags=["Customers"]
)


class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=2)
    mobile: str = Field(..., min_length=10, max_length=15)


@router.post("")
def create_customer(customer: CustomerCreate):

    # Check whether customer already exists
    existing = customers.find_one({
        "mobile": customer.mobile
    })

    if existing:
        return {
            "success": True,
            "message": "Customer already exists",
            "customer_id": str(existing["_id"]),
            "name": existing["name"],
            "mobile": existing["mobile"]
        }

    # Create new customer
    result = customers.insert_one({
        "name": customer.name,
        "mobile": customer.mobile,
        "authenticated": False,
        "createdAt": datetime.utcnow()
    })

    return {
        "success": True,
        "message": "Customer created",
        "customer_id": str(result.inserted_id),
        "name": customer.name,
        "mobile": customer.mobile
    }


@router.get("/{mobile}")
def get_customer(mobile: str):

    customer = customers.find_one({
        "mobile": mobile
    })

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    return {
        "success": True,
        "customer_id": str(customer["_id"]),
        "name": customer["name"],
        "mobile": customer["mobile"],
        "authenticated": customer.get("authenticated", False),
        "createdAt": customer["createdAt"]
    }
