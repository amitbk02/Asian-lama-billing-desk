from datetime import datetime
from io import BytesIO

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from gridfs import GridFS

from backend.app.database import problems, invoices, db


router = APIRouter(
    prefix="/api/invoices",
    tags=["Invoices"]
)


def generate_invoice_number(now: datetime) -> str:
    date_prefix = now.strftime("%Y%m%d")

    count = invoices.count_documents({
        "invoice_number": {
            "$regex": f"^INV-{date_prefix}-"
        }
    })

    sequence = count + 1

    while True:
        invoice_number = f"INV-{date_prefix}-{sequence:04d}"

        if not invoices.find_one({
            "invoice_number": invoice_number
        }):
            return invoice_number

        sequence += 1


def create_invoice_pdf(
    invoice_number: str,
    problem: dict,
    charges: float,
    invoice_date: datetime
) -> bytes:

    buffer = BytesIO()

    pdf = canvas.Canvas(
        buffer,
        pagesize=A4
    )

    width, height = A4

    # Header
    pdf.setFont("Helvetica-Bold", 20)
    pdf.drawString(50, height - 60, "SERVICE INVOICE")

    pdf.setFont("Helvetica", 10)
    pdf.drawString(
        50,
        height - 80,
        "Customer Support Service"
    )

    # Invoice details
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(
        50,
        height - 120,
        f"Invoice Number: {invoice_number}"
    )

    pdf.setFont("Helvetica", 10)
    pdf.drawString(
        50,
        height - 140,
        f"Invoice Date: {invoice_date.strftime('%d-%m-%Y')}"
    )

    # Customer
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(
        50,
        height - 190,
        "Customer Details"
    )

    pdf.setFont("Helvetica", 10)

    pdf.drawString(
        50,
        height - 210,
        f"Name: {problem.get('customer_name', '')}"
    )

    pdf.drawString(
        50,
        height - 230,
        f"Mobile: {problem.get('customer_mobile', '')}"
    )

    # Problem
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(
        50,
        height - 280,
        "Service Details"
    )

    pdf.setFont("Helvetica", 10)

    pdf.drawString(
        50,
        height - 300,
        f"Problem Number: {problem['problem_number']}"
    )

    # Problem statement wrapping
    statement = problem.get(
        "problem_statement",
        ""
    )

    pdf.drawString(
        50,
        height - 320,
        f"Problem: {statement[:100]}"
    )

    # Charges table
    y = height - 380

    pdf.setFont("Helvetica-Bold", 11)

    pdf.drawString(50, y, "Description")
    pdf.drawString(400, y, "Amount")

    pdf.line(
        50,
        y - 5,
        540,
        y - 5
    )

    pdf.setFont("Helvetica", 10)

    pdf.drawString(
        50,
        y - 30,
        "Service / Repair Charges"
    )

    pdf.drawRightString(
        500,
        y - 30,
        f"Rs. {charges:.2f}"
    )

    pdf.line(
        50,
        y - 50,
        540,
        y - 50
    )

    pdf.setFont("Helvetica-Bold", 12)

    pdf.drawString(
        350,
        y - 80,
        "Total:"
    )

    pdf.drawRightString(
        500,
        y - 80,
        f"Rs. {charges:.2f}"
    )

    # Footer
    pdf.setFont("Helvetica", 9)

    pdf.drawString(
        50,
        80,
        "Thank you for using our service."
    )

    pdf.drawString(
        50,
        65,
        "This invoice contains service charges only."
    )

    pdf.showPage()
    pdf.save()

    buffer.seek(0)

    return buffer.getvalue()


@router.post("")
def generate_invoice(problem_number: str):

    problem = problems.find_one({
        "problem_number": problem_number
    })

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    if problem.get("status") == "CLOSED":
        raise HTTPException(
            status_code=400,
            detail="Problem is already closed"
        )

    if problem.get("status") == "EXPIRED":
        raise HTTPException(
            status_code=400,
            detail="Cannot generate invoice for expired problem"
        )

    if not problem.get("before_photo", False):
        raise HTTPException(
            status_code=400,
            detail="Before photo is required"
        )

    if not problem.get("after_photo", False):
        raise HTTPException(
            status_code=400,
            detail="After photo is required"
        )

    charges = problem.get("charges")

    if charges is None:
        raise HTTPException(
            status_code=400,
            detail="Charges are required before generating invoice"
        )

    # Prevent duplicate invoice
    if problem.get("invoice_number"):
        existing = invoices.find_one({
            "invoice_number": problem["invoice_number"]
        })

        return {
            "success": True,
            "message": "Invoice already exists",
            "invoice_number": problem["invoice_number"],
            "problem_number": problem_number,
            "file_id": (
                existing.get("file_id")
                if existing
                else problem.get("invoice_file_id")
            )
        }

    now = datetime.utcnow()

    invoice_number = generate_invoice_number(now)

    pdf_data = create_invoice_pdf(
        invoice_number,
        problem,
        float(charges),
        now
    )

    # Store PDF in MongoDB GridFS
    fs = GridFS(db)

    file_id = fs.put(
        pdf_data,
        filename=f"{invoice_number}.pdf",
        content_type="application/pdf",
        invoice_number=invoice_number,
        problem_number=problem_number,
        uploadedAt=now
    )

    invoice_record = {
        "invoice_number": invoice_number,
        "problem_number": problem_number,
        "customer_mobile": problem.get("customer_mobile"),
        "customer_name": problem.get("customer_name"),
        "charges": float(charges),
        "currency": "INR",
        "file_id": str(file_id),
        "createdAt": now
    }

    invoices.insert_one(invoice_record)

    problems.update_one(
        {
            "problem_number": problem_number
        },
        {
            "$set": {
                "invoice_number": invoice_number,
                "invoice_file_id": str(file_id),
                "updatedAt": now
            }
        }
    )

    return {
        "success": True,
        "message": "Invoice generated successfully",
        "invoice_number": invoice_number,
        "problem_number": problem_number,
        "charges": float(charges),
        "currency": "INR",
        "file_id": str(file_id),
        "filename": f"{invoice_number}.pdf"
    }


@router.get("/{invoice_number}")
def get_invoice(invoice_number: str):

    invoice = invoices.find_one({
        "invoice_number": invoice_number
    })

    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found"
        )

    return {
        "success": True,
        "invoice": {
            "invoice_number": invoice["invoice_number"],
            "problem_number": invoice["problem_number"],
            "customer_name": invoice.get("customer_name"),
            "customer_mobile": invoice.get("customer_mobile"),
            "charges": invoice.get("charges"),
            "currency": invoice.get("currency"),
            "file_id": invoice.get("file_id"),
            "createdAt": invoice.get("createdAt")
        }
    }


@router.get("/{invoice_number}/pdf")
def download_invoice_pdf(invoice_number: str):

    invoice = invoices.find_one({
        "invoice_number": invoice_number
    })

    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found"
        )

    file_id = invoice.get("file_id")

    if not file_id:
        raise HTTPException(
            status_code=404,
            detail="Invoice PDF not found"
        )

    from bson import ObjectId

    fs = GridFS(db)

    try:
        grid_file = fs.get(ObjectId(file_id))
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Invoice PDF not found in GridFS"
        )

    return StreamingResponse(
        grid_file,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                f'inline; filename="{invoice_number}.pdf"'
        }
    )
