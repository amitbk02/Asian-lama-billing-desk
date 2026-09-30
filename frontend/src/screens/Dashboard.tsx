import { useState } from 'react';
import { PlusCircle, Search, User, Phone, LogOut, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NotificationsApi } from '@/hooks/useNotifications';
import { Customer, getProblem } from '@/lib/api';

interface DashboardProps {
  customer: Customer;
  notify: NotificationsApi;
  onCreate: () => void;
  onOpenProblem: (problemNumber: string) => void;
  onLogout: () => void;
}

export default function Dashboard({
  customer,
  notify,
  onCreate,
  onOpenProblem,
  onLogout,
}: DashboardProps) {
  const [lookup, setLookup] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [searching, setSearching] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLookupError('');
    if (!lookup.trim()) {
      setLookupError('Enter a problem number to look up.');
      return;
    }
    setSearching(true);
    try {
      await getProblem(lookup.trim());
      onOpenProblem(lookup.trim());
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Problem not found.');
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold text-slate-800">Asian Lama</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                <User className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{customer.name}</h1>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                  <Phone className="h-3.5 w-3.5" />
                  {customer.mobile}
                </p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Authenticated
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={onCreate}
            className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:border-sky-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600 transition-colors group-hover:bg-sky-600 group-hover:text-white">
              <PlusCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Create New Problem</h2>
              <p className="mt-1 text-sm text-slate-500">
                Report a new issue and get a tracking number.
              </p>
            </div>
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Search className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Lookup Problem</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Track an existing problem by number.
                </p>
              </div>
            </div>
            <form onSubmit={handleLookup} className="space-y-3">
              <Input
                placeholder="e.g. 29-09-2026-01"
                value={lookup}
                onChange={(e) => setLookup(e.target.value)}
                error={lookupError}
              />
              <Button type="submit" loading={searching} variant="secondary" className="w-full">
                <Search className="h-4 w-4" />
                Find Problem
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
