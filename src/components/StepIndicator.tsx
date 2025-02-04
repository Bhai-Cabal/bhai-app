// components/StepIndicator.tsx
import { FC } from 'react';

interface StepIndicatorProps {
  currentStep: number;
  maxSteps: number;
}

export const StepIndicator: FC<StepIndicatorProps> = ({ currentStep, maxSteps }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        {Array.from({ length: maxSteps }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            className={`w-1/3 h-2 rounded-full mx-1 ${
              step <= currentStep ? "bg-primary" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <div className="text-center text-sm text-gray-500">
        Step {currentStep} of {maxSteps}
      </div>
    </div>
  );
};