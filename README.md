# Billing Desk

A full-stack customer support and service billing application that manages the complete problem lifecycle from customer authentication to problem closure and invoice generation.

## 1. Problem Statement

Customer service operations often require separate processes for customer verification, problem tracking, service evidence, billing, and invoice generation. **Billing Desk** brings these activities into a single workflow.

## 2. Solution

Billing Desk provides a simple web application where a customer can:

**Login with OTP → Create Problem → Upload Before Photo → Start Work → Upload After Photo → Add Charges → Generate Invoice → Close Problem**

Closed cases remain **read-only**, while historical photos and invoices remain available for viewing and download.

## 3. Key Features

* SMS OTP-based customer authentication
* Problem/ticket creation with unique problem number
* Before and after service photo management
* Work In Progress (WIP) status tracking
* Service charge management
* Automatic invoice number and PDF generation
* Historical photo and invoice download after case closure

## 4. Technology Stack

**Frontend**

* React
* TypeScript
* Vite
* Tailwind CSS

**Backend**

* Python
* FastAPI
* Uvicorn
* Pydantic

**Database & Storage**

* MongoDB
* MongoDB GridFS for photos and invoice PDFs

**Other**

* ReportLab for invoice PDF generation
* REST APIs for frontend/backend communication

### SMS OTP Integration

Billing Desk uses the **SMS API** for customer mobile verification.

The application sends a one-time password (OTP) to the customer's registered mobile number and verifies the OTP through OTP.dev before allowing access to the customer dashboard.

```text
Customer Mobile
      ↓
Billing Desk
      ↓
SMS API
      ↓
SMS OTP
      ↓
Customer Verification
```

API credentials are stored in the local `.env` file and are **not committed to GitHub**.

Users need their own OTP.dev API credentials and can configure them using `.env.example`.

## 5. Architecture

```text
Customer
   │
   ▼
React Frontend
   │
   ▼
FastAPI Backend
   │
   ├── MongoDB
   │     ├── Customers
   │     ├── Problems
   │     └── Invoices
   │
   ├── GridFS
   │     ├── Before Photos
   │     ├── After Photos
   │     └── Invoice PDFs
   │
   └── OTP
         └── SMS OTP
```

## 6. Getting Started

### Backend

```bash
git clone https://github.com/amitbk02/Asian-lama-billing-desk.git
cd Asian-lama-billing-desk

python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
```

Create `.env` using `.env.example` and configure your OTP.dev credentials.

Start the API:

```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
```

Create `.env`:

```text
VITE_API_BASE_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

## 7. Workflow

```text
Customer Authentication
        ↓
Create Problem
        ↓
Before Photo
        ↓
WIP
        ↓
After Photo
        ↓
Charges
        ↓
Invoice PDF
        ↓
CLOSED
        ↓
Historical Records Available
```

## 8. Security & Future Enhancements

This project is currently a reference/POC implementation.

For production deployment, additional controls should be added, including HTTPS, stronger authentication, role-based access control, API rate limiting, secure secret management, audit logging, monitoring, backups, and production-grade authorization.

Future enhancements may include:

* Admin and technician roles
* Customer notifications
* Payment integration
* Reporting and SLA tracking
* Automated support workflows
* AI-powered customer support automation

