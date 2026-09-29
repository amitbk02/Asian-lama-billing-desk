from fastapi import FastAPI

from backend.app.database import client
from backend.app.api.customer import router as customer_router
from backend.app.api.auth import router as auth_router
from backend.app.api.problem import router as problem_router
from backend.app.api.photo import router as photo_router
from backend.app.api.billing import router as billing_router
from backend.app.api.invoice import router as invoice_router


app = FastAPI(
    title="Customer Support Agent API",
    description="API-first customer support automation platform",
    version="1.0.0"
)

# Register routers
app.include_router(customer_router)
app.include_router(auth_router)
app.include_router(problem_router)
app.include_router(photo_router)
app.include_router(billing_router)
app.include_router(invoice_router)

@app.get("/api/health", tags=["System"])
def health():

    try:
        client.admin.command("ping")

        return {
            "status": "OK",
            "mongodb": "connected",
            "service": "customer-support-agent"
        }

    except Exception as e:

        return {
            "status": "ERROR",
            "mongodb": "disconnected",
            "error": str(e)
        }
