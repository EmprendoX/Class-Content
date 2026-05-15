'use client';

import Icon from './Icon';

interface ProgressProps {
  currentStep: 'outline' | 'validate' | 'format' | null;
  message?: string | null;
}

const steps = [
  { id: 'outline', label: 'Borrador', labelEn: 'Outline', icon: 'sparkle' as const },
  { id: 'validate', label: 'Validación pedagógica', labelEn: 'Pedagogy checks', icon: 'target' as const },
  { id: 'format', label: 'Formato y exportación', labelEn: 'Format & export', icon: 'sheet' as const },
] as const;

export default function Progress({ currentStep, message }: ProgressProps) {
  const currentIndex = currentStep ? steps.findIndex((s) => s.id === currentStep) : -1;

  return (
    <div className="w-full animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        {steps.map((step, index) => {
          const isActive = currentIndex >= index && currentIndex !== -1;
          const isCurrent = currentStep === step.id;
          const isDone = currentIndex > index;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className="relative">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-brand text-white shadow-pop'
                        : 'bg-ink-100 text-ink-400'
                    }`}
                  >
                    {isDone ? (
                      <Icon name="check" size={18} strokeWidth={2.4} />
                    ) : (
                      <Icon name={step.icon} size={18} />
                    )}
                  </div>
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-2xl ring-4 ring-brand-200 animate-pulse-soft pointer-events-none" />
                  )}
                </div>
                <span
                  className={`mt-2.5 text-xs font-semibold text-center max-w-[110px] ${
                    isActive ? 'text-ink-900' : 'text-ink-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="h-0.5 flex-1 mx-2 rounded-full overflow-hidden bg-ink-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isDone ? 'w-full bg-gradient-brand' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {currentStep && (
        <div className="text-center text-sm text-ink-600 bg-brand-50 border border-brand-100 rounded-xl px-4 py-2.5 inline-flex items-center gap-2 justify-center w-full">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          <span>
            {steps.find((s) => s.id === currentStep)?.label}
            {message ? ` — ${message}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}
