'use client';

interface ProgressProps {
  currentStep: 'ideation' | 'posts' | 'video' | 'format' | null;
  message?: string | null;
}

const steps = [
  { id: 'ideation', label: 'Ideación' },
  { id: 'posts', label: 'Posts' },
  { id: 'video', label: 'Video' },
  { id: 'format', label: 'Formato final' },
] as const;

export default function Progress({ currentStep, message }: ProgressProps) {
  const currentIndex = currentStep
    ? steps.findIndex((s) => s.id === currentStep)
    : -1;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const isActive = currentIndex >= index && currentIndex !== -1;
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  } ${isCurrent ? 'ring-4 ring-blue-300 ring-offset-2' : ''}`}
                >
                  {index + 1}
                </div>
                <span
                  className={`mt-2 text-sm font-medium ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 transition-colors ${
                    isActive && index < currentIndex
                      ? 'bg-blue-600'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      {currentStep && (
        <div className="text-center text-sm text-gray-600">
          Proceso: {steps.find((s) => s.id === currentStep)?.label}
          {message ? ` — ${message}` : ''}
        </div>
      )}
    </div>
  );
}


