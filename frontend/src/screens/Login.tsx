import { useState } from 'react';
import { Phone, ShieldCheck, ArrowRight, LogOut } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NotificationsApi } from '@/hooks/useNotifications';
import { sendOtp, verifyOtp, Customer } from '@/lib/api';

interface LoginProps {
  onAuth: (customer: Customer) => void;
  notify: NotificationsApi;
}

type Phase = 'mobile' | 'otp';

export default function Login({ onAuth, notify }: LoginProps) {
  const [phase, setPhase] = useState<Phase>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const validateMobile = (val: string) => /^\d{10}$/.test(val);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setMobileError('');
    if (!validateMobile(mobile)) {
      setMobileError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setSending(true);
    try {
      await sendOtp(mobile);
      notify.success('OTP sent to your mobile number.');
      setPhase('otp');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to send OTP.');
    } finally {
      setSending(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setOtpError('');
    if (!otp.trim()) {
      setOtpError('Please enter the OTP.');
      return;
    }
    setVerifying(true);
    try {
      const customer = await verifyOtp(mobile, otp.trim());
      notify.success(`Welcome, ${customer.name}!`);
      onAuth(customer);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'OTP verification failed.');
    } finally {
      setVerifying(false);
    }
  }

  function resetFlow() {
    setPhase('mobile');
    setMobile('');
    setOtp('');
    setMobileError('');
    setOtpError('');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-200">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Asian Lama Billing Desk
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Customer Support &amp; Problem Management
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {phase === 'mobile' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Sign in</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter your registered mobile number to receive an OTP.
                </p>
              </div>
              <Input
                label="Mobile Number"
                placeholder="e.g. 9967274402"
                value={mobile}
                onChange={(e) =>
                  setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))
                }
                error={mobileError}
                inputMode="numeric"
                autoComplete="tel"
              />
              <Button type="submit" loading={sending} className="w-full" size="lg">
                <Phone className="h-4 w-4" />
                Send OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Verify OTP</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the OTP sent to <strong>{mobile}</strong>.
                </p>
              </div>
              <Input
                label="OTP"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))
                }
                error={otpError}
                inputMode="numeric"
                autoFocus
              />
              <Button type="submit" loading={verifying} className="w-full" size="lg">
                Verify &amp; Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setOtp('');
                    setOtpError('');
                    setPhase('mobile');
                  }}
                  className="font-medium text-sky-600 hover:text-sky-700"
                >
                  Change number
                </button>
                <button
                  type="button"
                  onClick={resetFlow}
                  className="font-medium text-slate-400 hover:text-slate-600"
                >
                  <LogOut className="inline h-4 w-4" /> Start over
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Use the OTP delivered to your mobile device to sign in.
        </p>
      </div>
    </div>
  );
}
