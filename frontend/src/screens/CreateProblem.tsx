import { useState } from 'react';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { NotificationsApi } from '@/hooks/useNotifications';
import { createProblem, Problem } from '@/lib/api';

interface CreateProblemProps {
  mobile: string;
  notify: NotificationsApi;
  onBack: () => void;
  onCreated: (problem: Problem) => void;
}

export default function CreateProblem({
  mobile,
  notify,
  onBack,
  onCreated,
}: CreateProblemProps) {
  const [statement, setStatement] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<Problem | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (statement.trim().length < 5) {
      setError('Please describe the problem (at least 5 characters).');
      return;
    }
    setCreating(true);
    try {
      const problem = await createProblem(mobile, statement.trim());
      setCreated(problem);
      notify.success(`Problem created: ${problem.problem_number}`);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to create problem.');
    } finally {
      setCreating(false);
    }
  }

  if (created) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-lg px-4 py-12">
          <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Problem Created</h2>
            <p className="mt-1 text-sm text-slate-500">
              Your problem has been registered successfully.
            </p>
            <div className="mt-6 space-y-3 rounded-xl bg-slate-50 p-5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Problem Number</span>
                <span className="font-mono text-sm font-bold text-slate-800">
                  {created.problem_number}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Status</span>
                <Badge status={created.status} />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setCreated(null);
                  setStatement('');
                }}
              >
                Create Another
              </Button>
              <Button className="flex-1" onClick={() => onCreated(created)}>
                Open Problem
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-lg px-4 py-8">
        <button
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Create New Problem</h1>
              <p className="text-sm text-slate-500">Describe the issue you're facing.</p>
            </div>
          </div>
          <form onSubmit={handleCreate} className="space-y-5">
            <Textarea
              label="Problem Statement"
              placeholder="Describe the problem in detail…"
              rows={5}
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              error={error}
            />
            <Button type="submit" loading={creating} size="lg" className="w-full">
              Create Problem
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
