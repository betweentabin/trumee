import React from 'react';
import Link from 'next/link';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  nextHref?: string;
  prevHref?: string;
  onNext?: () => void;
  onPrev?: () => void;
  nextLabel?: string;
  prevLabel?: string;
  nextDisabled?: boolean;
}

const steps = [
  { step: 1, label: 'プロフィール', href: '/auth/step/step1-profile' },
  { step: 2, label: '学歴', href: '/auth/step/step2-education' },
  { step: 3, label: '職歴', href: '/auth/step/step3-experience' },
  { step: 4, label: '希望条件', href: '/auth/step/step4-preference' },
  { step: 5, label: '確認', href: '/auth/step/step5-confirm' },
  { step: 6, label: 'ダウンロード', href: '/auth/step/step6-download' },
];

export default function StepNavigation({
  currentStep,
  totalSteps,
  nextHref,
  prevHref,
  onNext,
  onPrev,
  nextLabel = '次へ',
  prevLabel = '戻る',
  nextDisabled = false
}: StepNavigationProps) {
  return (
    <div className="space-y-6">
      {/* Step Progress */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.step} className="flex items-center">
              <Link href={step.href} className="flex items-center group">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                    ${step.step <= currentStep
                      ? 'bg-[#FF733E] text-white'
                      : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                    }
                  `}
                  title={`${step.label}`}
                >
                  {step.step}
                </div>
                <span
                  className={`
                    ml-2 text-sm font-medium transition-colors
                    ${step.step <= currentStep ? 'text-[#FF733E]' : 'text-gray-500 group-hover:text-gray-700'}
                  `}
                >
                  {step.label}
                </span>
              </Link>
              {index < steps.length - 1 && (
                <div
                  className={`
                    ml-4 w-12 h-0.5 transition-colors
                    ${step.step < currentStep ? 'bg-[#FF733E]' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <div>
          {(prevHref || onPrev) && currentStep > 1 && (
            prevHref ? (
              <Link
                href={prevHref}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF733E]"
              >
                ← {prevLabel}
              </Link>
            ) : (
              <button
                onClick={onPrev}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF733E]"
              >
                ← {prevLabel}
              </button>
            )
          )}
        </div>
        
        <div>
          {(nextHref || onNext) && currentStep < totalSteps && (
            nextHref ? (
              <Link
                href={nextHref}
                className={`
                  inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white
                  ${nextDisabled
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#FF733E] hover:bg-[#e9632e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF733E]'
                  }
                `}
              >
                {nextLabel} →
              </Link>
            ) : (
              <button
                onClick={onNext}
                disabled={nextDisabled}
                className={`
                  inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white
                  ${nextDisabled
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#FF733E] hover:bg-[#e9632e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF733E]'
                  }
                `}
              >
                {nextLabel} →
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
