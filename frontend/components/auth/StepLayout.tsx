'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

interface StepLayoutProps {
  children: ReactNode;
  currentStep: number;
  stepTitle: string;
}

const StepLayout = ({ children, currentStep, stepTitle }: StepLayoutProps) => {
  const pathname = usePathname();
  
  const menuItems = [
    { label: 'TOP', href: '/dashboard', icon: null },
    { label: '登録情報の確認・変更', href: '/auth/step/step1-profile', icon: <ChevronRight className="w-4 h-4" /> },
    { label: 'パスワードの変更', href: '/account/password', icon: <ChevronRight className="w-4 h-4" /> },
    { label: '支払い情報登録・変更', href: '/account/payment', icon: <ChevronRight className="w-4 h-4" /> },
    { label: '有料プラン', href: '/account/paid-plan', icon: <ChevronRight className="w-4 h-4" /> },
  ];

  const steps = [
    { num: 1, label: '基本情報' },
    { num: 2, label: '職歴' },
    { num: 3, label: '学歴' },
    { num: 4, label: 'スキル' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-gray-900">TOP</Link>
            <ChevronRight className="w-4 h-4 mx-1" />
            <span className="text-gray-900">マイページ</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <aside className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm">
              <nav className="p-4">
                {menuItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className={`flex items-center justify-between px-4 py-3 rounded-md hover:bg-gray-50 transition-colors ${
                      pathname === item.href ? 'bg-gray-50' : ''
                    }`}
                  >
                    <span className={`text-sm ${index === 0 ? 'font-semibold' : ''}`}>
                      {item.label}
                    </span>
                    {item.icon}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-8">
              {/* Title */}
              <h1 className="text-2xl font-bold mb-8">{stepTitle}</h1>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between relative">
                  {/* Progress Line Background */}
                  <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200"></div>
                  
                  {/* Active Progress Line */}
                  <div 
                    className="absolute top-5 left-0 h-1 bg-[#FF6B35] transition-all duration-300"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                  ></div>

                  {/* Step Indicators */}
                  {steps.map((step) => (
                    <div key={step.num} className="relative z-10 text-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                          step.num === currentStep
                            ? 'bg-[#FF6B35] text-white'
                            : step.num < currentStep
                            ? 'bg-[#FF6B35] text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {step.num}
                      </div>
                      <span className={`text-xs ${
                        step.num === currentStep ? 'text-[#FF6B35] font-semibold' : 'text-gray-500'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Content */}
              <div className="space-y-6">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default StepLayout;