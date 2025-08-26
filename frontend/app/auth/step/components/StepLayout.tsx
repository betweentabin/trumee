import React from 'react';

interface StepLayoutProps {
  children: React.ReactNode;
  currentStep?: number;
  title?: string;
  description?: string;
}

export default function StepLayout({ children, currentStep, title, description }: StepLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {title && (
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
            {description && (
              <p className="text-lg text-gray-600">{description}</p>
            )}
          </div>
        )}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
