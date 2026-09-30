import { Check } from 'lucide-react';

interface ProgressStepsProps {
  steps: string[];
  currentIndex: number;
}

export default function ProgressSteps({ steps, currentIndex }: ProgressStepsProps) {
  return (
    <div className="w-full overflow-x-auto">
      <ol className="flex min-w-max items-center gap-1">
        {steps.map((step, i) => {
          const isDone = i < currentIndex;
          const isActive = i === currentIndex;
          return (
            <li key={step} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                    isDone
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : isActive
                      ? 'border-sky-500 bg-sky-500 text-white'
                      : 'border-slate-300 bg-white text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={`whitespace-nowrap text-[11px] font-medium ${
                    isActive
                      ? 'text-sky-600'
                      : isDone
                      ? 'text-emerald-600'
                      : 'text-slate-400'
                  }`}
                >
                  {step}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`mx-1 h-0.5 w-6 rounded transition-colors sm:w-10 ${
                    isDone ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
