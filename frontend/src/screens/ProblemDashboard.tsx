import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ImageIcon,
  Wrench,
  Receipt,
  FileCheck2,
  Lock,
  Upload,
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import ProgressSteps from '@/components/ui/ProgressSteps';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { NotificationsApi } from '@/hooks/useNotifications';
import {
  Problem,
  getProblem,
  uploadBeforePhoto,
  uploadAfterPhoto,
  updateStatus,
  addCharge,
  generateInvoice,
  invoicePdfUrl,
  photoUrl,
} from '@/lib/api';

interface ProblemDashboardProps {
  problemNumber: string;
  notify: NotificationsApi;
  onBack: () => void;
}

const STEPS = [
  'Authentication',
  'Problem',
  'Before Photo',
  'WIP',
  'After Photo',
  'Charges',
  'Invoice',
  'Closed',
];

function stepIndex(p: Problem): number {
  const status = p.status?.toUpperCase();
  if (status === 'CLOSED') return 7;
  if (p.invoice_number) return 7;
  if (p.charges && p.charges > 0) return 6;
  if (p.after_photo_url || p.after_photo) return 5;
  if (status === 'WIP') return 4;
  if (p.before_photo_url || p.before_photo) return 3;
  return 1;
}

function hasBefore(p: Problem) { return !!(p.before_photo_url || p.before_photo); }
function hasAfter(p: Problem) { return !!(p.after_photo_url || p.after_photo); }
function hasCharges(p: Problem) { return p.charges != null && p.charges > 0; }
function isClosed(p: Problem) { return p.status?.toUpperCase() === 'CLOSED'; }

function formatDate(s: string | null | undefined): string {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return s;
  }
}

export default function ProblemDashboard({ problemNumber, notify, onBack }: ProblemDashboardProps) {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [chargeInput, setChargeInput] = useState('');
  const [chargeError, setChargeError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const p = await getProblem(problemNumber);
        if (active) setProblem(p);
      } catch (err) {
        if (active)
          setFetchError(err instanceof Error ? err.message : 'Failed to load problem.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [problemNumber]);

  async function refresh() {
    if (!problem) return;
    setBusy('refresh');
    try {
      const p = await getProblem(problem.problem_number);
      setProblem(p);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Refresh failed.');
    } finally {
      setBusy(null);
    }
  }

  async function handleBefore(file: File) {
    if (!problem) return;
    setBusy('before');
    try {
      const p = await uploadBeforePhoto(problem.problem_number, file);
      setProblem(p);
      notify.success('Before photo uploaded.');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(null);
    }
  }

  async function handleAfter(file: File) {
    if (!problem) return;
    setBusy('after');
    try {
      const p = await uploadAfterPhoto(problem.problem_number, file);
      setProblem(p);
      notify.success('After photo uploaded.');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(null);
    }
  }

  async function handleWip() {
    if (!problem) return;
    setBusy('wip');
    try {
      const p = await updateStatus(problem.problem_number, 'WIP');
      setProblem(p);
      notify.success('Status changed to WIP.');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Status update failed.');
    } finally {
      setBusy(null);
    }
  }

  async function handleAddCharge(e: React.FormEvent) {
    e.preventDefault();
    if (!problem) return;
    setChargeError('');
    const amt = parseFloat(chargeInput);
    if (isNaN(amt) || amt <= 0) {
      setChargeError('Enter a valid charge amount.');
      return;
    }
    setBusy('charge');
    try {
      const p = await addCharge(problem.problem_number, amt);
      setProblem(p);
      setChargeInput('');
      notify.success('Charges added.');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to add charges.');
    } finally {
      setBusy(null);
    }
  }

  async function handleGenerateInvoice() {
    if (!problem) return;
    setBusy('invoice');
    try {
      await generateInvoice(problem.problem_number);
      const p = await getProblem(problem.problem_number);
      setProblem(p);
      notify.success('Invoice generated.');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to generate invoice.');
    } finally {
      setBusy(null);
    }
  }

  async function handleClose() {
    if (!problem) return;
    setBusy('close');
    try {
      const p = await updateStatus(problem.problem_number, 'CLOSED');
      setProblem(p);
      notify.success('Problem closed.');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to close.');
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <FullPageSpinner label="Loading problem…" />;
  if (fetchError)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <XCircle className="mx-auto mb-3 h-10 w-10 text-rose-500" />
          <h2 className="text-lg font-semibold text-slate-900">Could not load problem</h2>
          <p className="mt-1 text-sm text-slate-500">{fetchError}</p>
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={onBack}>Back</Button>
            <Button className="flex-1" onClick={refresh}>Retry</Button>
          </div>
        </div>
      </div>
    );
  if (!problem) return null;

  const closed = isClosed(problem);
  const beforeDone = hasBefore(problem);
  const afterDone = hasAfter(problem);
  const chargesDone = hasCharges(problem);
  const invoiceDone = !!problem.invoice_number;

  const canUploadBefore = !closed && !beforeDone;
  const canWip = !closed && beforeDone && problem.status?.toUpperCase() !== 'WIP';
  const canUploadAfter = !closed && problem.status?.toUpperCase() === 'WIP' && !afterDone;
  const canAddCharge = !closed && afterDone && !chargesDone;
  const canGenerateInvoice = !closed && chargesDone && !invoiceDone;
  const canClose = !closed && beforeDone && afterDone && chargesDone && invoiceDone;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <Button variant="ghost" size="sm" loading={busy === 'refresh'} onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Workflow Progress</h2>
          <ProgressSteps steps={STEPS} currentIndex={stepIndex(problem)} />
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h1 className="font-mono text-lg font-bold text-slate-900">
                {problem.problem_number}
              </h1>
              <p className="text-sm text-slate-500">Problem Details</p>
            </div>
            <Badge status={problem.status} />
          </div>
          <div className="grid gap-x-6 gap-y-4 p-6 sm:grid-cols-2">
            <Detail label="Customer Name" value={problem.customer_name} />
            <Detail label="Mobile" value={problem.mobile} />
            <Detail label="Problem Statement" value={problem.problem_statement} full />
            <Detail label="Created Date" value={formatDate(problem.created_date)} />
            <Detail label="Expiry Date" value={formatDate(problem.expiry_date)} />
            <Detail
              label="Before Photo"
              value={
                beforeDone ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> Uploaded
                    </span>
                    <a
                      href={photoUrl(problem.problem_number, 'before')}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </a>
                    <a
                      href={photoUrl(problem.problem_number, 'before')}
                      download
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </a>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <XCircle className="h-4 w-4" /> Not uploaded
                  </span>
                )
              }
            />
            <Detail
              label="After Photo"
              value={
                afterDone ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> Uploaded
                    </span>
                    <a
                      href={photoUrl(problem.problem_number, 'after')}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </a>
                    <a
                      href={photoUrl(problem.problem_number, 'after')}
                      download
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </a>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <XCircle className="h-4 w-4" /> Not uploaded
                  </span>
                )
              }
            />
            <Detail label="Charges" value={chargesDone ? `₹${problem.charges}` : '—'} />
            <Detail
              label="Invoice Number"
              value={
                invoiceDone ? (
                  <span className="font-mono text-sm font-semibold text-sky-700">
                    {problem.invoice_number}
                  </span>
                ) : (
                  '—'
                )
              }
            />
          </div>
        </div>

        {closed ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <Lock className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
            <h2 className="text-lg font-semibold text-emerald-800">Problem Closed</h2>
            <p className="mt-1 text-sm text-emerald-700">
              This problem is closed and read-only.
            </p>
            {invoiceDone && (
              <a
                href={invoicePdfUrl(problem.invoice_number!)}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex"
              >
                <Button variant="secondary">
                  <Download className="h-4 w-4" />
                  Download Invoice PDF
                </Button>
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <ActionCard
              icon={<ImageIcon className="h-5 w-5" />}
              title="1. Upload Before Photo"
              description="Upload a photo showing the problem before work begins."
              done={beforeDone}
              disabled={!canUploadBefore}
            >
              {canUploadBefore && (
                <FileUpload label="Choose Before Photo" loading={busy === 'before'} onFile={handleBefore} />
              )}
            </ActionCard>

            <ActionCard
              icon={<Wrench className="h-5 w-5" />}
              title="2. Start Work (WIP)"
              description="Mark the problem as Work In Progress."
              done={problem.status?.toUpperCase() === 'WIP'}
              disabled={!canWip}
            >
              {canWip && (
                <Button loading={busy === 'wip'} onClick={handleWip}>
                  <Wrench className="h-4 w-4" />
                  Change to WIP
                </Button>
              )}
            </ActionCard>

            <ActionCard
              icon={<ImageIcon className="h-5 w-5" />}
              title="3. Upload After Photo"
              description="Upload a photo showing the result after work is done."
              done={afterDone}
              disabled={!canUploadAfter}
            >
              {canUploadAfter && (
                <FileUpload label="Choose After Photo" loading={busy === 'after'} onFile={handleAfter} />
              )}
            </ActionCard>

            <ActionCard
              icon={<Receipt className="h-5 w-5" />}
              title="4. Add Charges"
              description="Enter the billing amount for the work done."
              done={chargesDone}
              disabled={!canAddCharge}
            >
              {canAddCharge && (
                <form onSubmit={handleAddCharge} className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <Input
                    label="Amount (₹)"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="e.g. 500"
                    value={chargeInput}
                    onChange={(e) => setChargeInput(e.target.value)}
                    error={chargeError}
                  />
                  <Button type="submit" loading={busy === 'charge'} className="mt-6 sm:mt-0">
                    Add Charges
                  </Button>
                </form>
              )}
            </ActionCard>

            <ActionCard
              icon={<FileCheck2 className="h-5 w-5" />}
              title="5. Generate Invoice"
              description="Create an invoice for the billed charges."
              done={invoiceDone}
              disabled={!canGenerateInvoice}
            >
              {canGenerateInvoice && (
                <Button variant="secondary" loading={busy === 'invoice'} onClick={handleGenerateInvoice}>
                  <FileCheck2 className="h-4 w-4" />
                  Generate Invoice
                </Button>
              )}
            </ActionCard>

            <ActionCard
              icon={<Lock className="h-5 w-5" />}
              title="6. Close Problem"
              description="Close the problem once all steps are complete."
              done={false}
              disabled={!canClose}
            >
              {canClose && (
                <Button variant="danger" loading={busy === 'close'} onClick={handleClose}>
                  <Lock className="h-4 w-4" />
                  Close Problem
                </Button>
              )}
            </ActionCard>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  full,
}: {
  label: string;
  value: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  done,
  disabled,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  done: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm transition-opacity ${
        disabled && !done ? 'opacity-50' : ''
      } ${done ? 'border-emerald-200' : 'border-slate-200'}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {done ? <CheckCircle2 className="h-5 w-5" /> : icon}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </div>
  );
}

function FileUpload({
  label,
  loading,
  onFile,
}: {
  label: string;
  loading: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100 ${
        loading ? 'pointer-events-none opacity-60' : ''
      }`}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <Upload className="h-4 w-4" />
      )}
      {label}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
    </label>
  );
}
