const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export interface Customer {
  name: string;
  mobile: string;
}

export interface Problem {
  problem_number: string;
  customer_name: string;
  mobile: string;
  problem_statement: string;
  status: string;
  created_date: string;
  expiry_date: string | null;
  before_photo_url?: string | null;
  after_photo_url?: string | null;
  before_photo?: boolean;
  after_photo?: boolean;
  charges?: number | null;
  invoice_number?: string | null;
}

export interface Invoice {
  invoice_number: string;
  problem_number: string;
  charges: number;
  currency?: string;
  file_id?: string;
  filename?: string;
  [key: string]: unknown;
}

let sessionCustomer: Customer | null = null;

export function setSession(customer: Customer | null) {
  sessionCustomer = customer;
}

export function getSession(): Customer | null {
  return sessionCustomer;
}

async function parseError(res: Response): Promise<string> {
  let detail = '';

  try {
    const data = await res.json();

    detail =
      (data && (data.detail || data.message || data.error)) ||
      JSON.stringify(data);
  } catch {
    try {
      detail = await res.text();
    } catch {
      detail = '';
    }
  }

  return detail || res.statusText || `Request failed (${res.status})`;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  const text = await res.text();

  if (!text) {
    return undefined as unknown as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

function getHeaders(): HeadersInit {
  return {
    Accept: 'application/json',
  };
}

/* -------------------------------------------------------------------------- */
/* Customer                                                                    */
/* -------------------------------------------------------------------------- */

async function getCustomer(mobile: string): Promise<Customer> {
  const res = await fetch(
    `${BASE_URL}/api/customers/${encodeURIComponent(mobile)}`,
    {
      headers: getHeaders(),
    }
  );

  const data = await handle<{
    success: boolean;
    customer_id: string;
    name: string;
    mobile: string;
    authenticated: boolean;
    createdAt: string;
  }>(res);

  return {
    name: data.name,
    mobile: data.mobile,
  };
}

/* -------------------------------------------------------------------------- */
/* Authentication                                                              */
/* -------------------------------------------------------------------------- */

export async function sendOtp(
  mobile: string
): Promise<{ message?: string }> {
  const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
    body: JSON.stringify({
      mobile,
    }),
  });

  return handle(res);
}

export async function verifyOtp(
  mobile: string,
  otp: string
): Promise<Customer> {
  const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
    body: JSON.stringify({
      mobile,
      otp,
    }),
  });

  await handle(res);

  /*
   * The verify-otp API confirms authentication but does not return
   * the customer's name. Fetch the customer after successful OTP
   * verification.
   */
  const customer = await getCustomer(mobile);

  setSession(customer);

  return customer;
}

/* -------------------------------------------------------------------------- */
/* Problems                                                                   */
/* -------------------------------------------------------------------------- */

function mapProblem(data: any): Problem {
  return {
    problem_number: data.problem_number,
    customer_name: data.customer_name ?? '',
    mobile: data.customer_mobile ?? data.mobile ?? '',
    problem_statement: data.problem_statement ?? '',
    status: data.status ?? '',
    created_date: data.createdAt ?? data.created_date ?? '',
    expiry_date: data.expiresAt ?? data.expiry_date ?? null,
    before_photo: data.before_photo ?? false,
    after_photo: data.after_photo ?? false,
    charges: data.charges ?? null,
    invoice_number: data.invoice_number ?? null,
    before_photo_url: data.before_photo_url ?? null,
    after_photo_url: data.after_photo_url ?? null,
  };
}

export async function createProblem(
  mobile: string,
  problem_statement: string
): Promise<Problem> {
  const res = await fetch(`${BASE_URL}/api/problems`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
    body: JSON.stringify({
      mobile,
      problem_statement,
    }),
  });

  const data = await handle<any>(res);

  return {
    problem_number: data.problem_number,
    customer_name: '',
    mobile,
    problem_statement,
    status: data.status ?? 'OPEN',
    created_date: data.createdAt ?? '',
    expiry_date: data.expiresAt ?? null,
    before_photo: false,
    after_photo: false,
    charges: null,
    invoice_number: null,
  };
}

export async function getProblem(
  problemNumber: string
): Promise<Problem> {
  const res = await fetch(
    `${BASE_URL}/api/problems/${encodeURIComponent(problemNumber)}`,
    {
      headers: getHeaders(),
    }
  );

  const data = await handle<{
    success: boolean;
    problem: any;
  }>(res);

  return mapProblem(data.problem);
}

/* -------------------------------------------------------------------------- */
/* Photos                                                                     */
/* -------------------------------------------------------------------------- */

export async function uploadBeforePhoto(
  problemNumber: string,
  photo: File
): Promise<Problem> {
  const form = new FormData();

  form.append('photo', photo);

  const res = await fetch(
    `${BASE_URL}/api/problems/${encodeURIComponent(
      problemNumber
    )}/photos/before`,
    {
      method: 'POST',
      body: form,
    }
  );

  await handle(res);

  // Upload API returns upload metadata, so refresh the actual problem.
  return getProblem(problemNumber);
}

export async function uploadAfterPhoto(
  problemNumber: string,
  photo: File
): Promise<Problem> {
  const form = new FormData();

  form.append('photo', photo);

  const res = await fetch(
    `${BASE_URL}/api/problems/${encodeURIComponent(
      problemNumber
    )}/photos/after`,
    {
      method: 'POST',
      body: form,
    }
  );

  await handle(res);

  // Upload API returns upload metadata, so refresh the actual problem.
  return getProblem(problemNumber);
}

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

export async function updateStatus(
  problemNumber: string,
  status: 'WIP' | 'CLOSED'
): Promise<Problem> {
  const res = await fetch(
    `${BASE_URL}/api/problems/${encodeURIComponent(
      problemNumber
    )}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(),
      },
      body: JSON.stringify({
        status,
      }),
    }
  );

  await handle(res);

  // Status API returns a smaller response, so refresh the problem.
  return getProblem(problemNumber);
}

/* -------------------------------------------------------------------------- */
/* Billing                                                                    */
/* -------------------------------------------------------------------------- */

export async function addCharge(
  problemNumber: string,
  charges: number
): Promise<Problem> {
  const res = await fetch(`${BASE_URL}/api/billing/charge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
    body: JSON.stringify({
      problem_number: problemNumber,
      charges,
    }),
  });

  await handle(res);

  return getProblem(problemNumber);
}

/* -------------------------------------------------------------------------- */
/* Invoice                                                                    */
/* -------------------------------------------------------------------------- */

export async function generateInvoice(
  problemNumber: string
): Promise<Invoice> {
  const res = await fetch(
    `${BASE_URL}/api/invoices?problem_number=${encodeURIComponent(
      problemNumber
    )}`,
    {
      method: 'POST',
      headers: getHeaders(),
    }
  );

  return handle(res);
}

export async function getInvoice(
  invoiceNumber: string
): Promise<Invoice> {
  const res = await fetch(
    `${BASE_URL}/api/invoices/${encodeURIComponent(invoiceNumber)}`,
    {
      headers: getHeaders(),
    }
  );

  const data = await handle<{
    success: boolean;
    invoice: Invoice;
  }>(res);

  return data.invoice;
}

export function invoicePdfUrl(invoiceNumber: string): string {
  return `${BASE_URL}/api/invoices/${encodeURIComponent(
    invoiceNumber
  )}/pdf`;
}

export function photoUrl(
  problemNumber: string,
  photoType: 'before' | 'after'
): string {
  return `${BASE_URL}/api/problems/${problemNumber}/photos/${photoType}`;
}


